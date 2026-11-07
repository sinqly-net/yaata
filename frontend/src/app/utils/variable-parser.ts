import {RequestHistory} from 'types/RequestHistory';

export interface TextSegment {
  type: 'text';
  value: string;
}

export interface VariableSegment {
  type: 'variable';
  raw: string; // z.B. "${Get Access Token.token}"
  requestName: string; // z.B. "Get Access Token"
  fieldPath: string; // z.B. "token" oder "data.user.id"
}

export type ValueSegment = TextSegment | VariableSegment;

export interface ExtractedField {
  path: string;
  category: 'body' | 'header' | 'status' | 'custom';
  valuePreview: string;
  type: string;
}

/**
 * Zerlegt einen String (z.B. "Bearer ${Get Access Token.token} extra")
 * in Segmente aus Text und Variablen.
 */
export function parseValueToSegments(input: string | null | undefined): ValueSegment[] {
  if (input === null || input === undefined || input === '') {
    return [{ type: 'text', value: '' }];
  }

  const str = String(input);
  const regex = /\$\{([^}]+)\}/g;
  const segments: ValueSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: str.substring(lastIndex, match.index),
      });
    }

    const inside = match[1].trim();
    const dotIndex = inside.indexOf('.');
    let requestName = inside;
    let fieldPath = '';
    if (dotIndex !== -1) {
      requestName = inside.substring(0, dotIndex).trim();
      fieldPath = inside.substring(dotIndex + 1).trim();
    }

    segments.push({
      type: 'variable',
      raw: match[0],
      requestName,
      fieldPath,
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    segments.push({
      type: 'text',
      value: str.substring(lastIndex),
    });
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', value: '' });
  }

  return segments;
}

/**
 * Wandelt Segmente wieder in einen zusammenhängenden String um.
 */
export function segmentsToValue(segments: ValueSegment[]): string {
  if (!segments || segments.length === 0) return '';
  return segments.map(s => {
    if (s.type === 'text') return s.value;
    if (s.type === 'variable') {
      return s.fieldPath ? `\${${s.requestName}.${s.fieldPath}}` : `\${${s.requestName}}`;
    }
    return '';
  }).join('');
}

/**
 * Extrahiert alle verfügbaren Felder (Body-JSON/XML, Headers, Status) aus einem RequestHistory-Eintrag.
 */
export function extractFieldsFromHistory(history: RequestHistory): ExtractedField[] {
  const fields: ExtractedField[] = [];
  if (!history) return fields;

  // 1. Status & Meta
  if (history.status !== undefined && history.status !== null) {
    fields.push({
      path: 'status',
      category: 'status',
      valuePreview: `${history.status} ${history.status_text || ''}`.trim(),
      type: 'number',
    });
  }
  if (history.ok !== undefined && history.ok !== null) {
    fields.push({
      path: 'ok',
      category: 'status',
      valuePreview: String(history.ok),
      type: 'boolean',
    });
  }
  if (history.duration_ms !== undefined && history.duration_ms !== null) {
    fields.push({
      path: 'duration_ms',
      category: 'status',
      valuePreview: `${history.duration_ms} ms`,
      type: 'number',
    });
  }

  // 2. Response Headers
  if (history.headers && typeof history.headers === 'object') {
    for (const [key, val] of Object.entries(history.headers)) {
      const displayVal = typeof val === 'string' ? val : JSON.stringify(val);
      fields.push({
        path: `headers.${key.toLowerCase()}`,
        category: 'header',
        valuePreview: displayVal.length > 60 ? displayVal.slice(0, 57) + '...' : displayVal,
        type: 'string',
      });
    }
  }

  // 3. Response Body
  if (history.body !== undefined && history.body !== null) {
    let bodyObj = history.body;
    if (typeof bodyObj === 'string') {
      const trimmed = bodyObj.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          bodyObj = JSON.parse(trimmed);
        } catch {
          bodyObj = null;
        }
      } else if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
        const xmlFields = extractXmlFields(trimmed);
        fields.push(...xmlFields);
        bodyObj = null;
      } else {
        bodyObj = null;
      }
    }

    if (bodyObj && typeof bodyObj === 'object') {
      extractJsonFields(bodyObj, '', fields);
    }
  }

  return fields;
}

function extractJsonFields(obj: any, prefix: string, fields: ExtractedField[], depth = 0) {
  if (depth > 5 || obj === null || obj === undefined) return;

  if (Array.isArray(obj)) {
    obj.slice(0, 3).forEach((item, idx) => {
      const currentPath = prefix ? `${prefix}[${idx}]` : `[${idx}]`;
      if (typeof item === 'object' && item !== null) {
        extractJsonFields(item, currentPath, fields, depth + 1);
      } else {
        const valStr = String(item);
        fields.push({
          path: currentPath,
          category: 'body',
          valuePreview: valStr.length > 60 ? valStr.slice(0, 57) + '...' : valStr,
          type: typeof item,
        });
      }
    });
    return;
  }

  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      const currentPath = prefix ? `${prefix}.${key}` : key;
      if (val !== null && typeof val === 'object') {
        extractJsonFields(val, currentPath, fields, depth + 1);
      } else {
        const valStr = val !== undefined ? String(val) : 'null';
        fields.push({
          path: currentPath,
          category: 'body',
          valuePreview: valStr.length > 60 ? valStr.slice(0, 57) + '...' : valStr,
          type: typeof val,
        });
      }
    }
  }
}

function extractXmlFields(xmlStr: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, 'application/xml');
    if (!doc.querySelector('parsererror') && doc.documentElement) {
      const traverse = (node: Element, prefix = '') => {
        const tagName = node.tagName;
        const currentPath = prefix ? `${prefix}.${tagName}` : tagName;

        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          fields.push({
            path: `${currentPath}@${attr.name}`,
            category: 'body',
            valuePreview: attr.value,
            type: 'string',
          });
        }

        if (node.children.length === 0 && node.textContent?.trim()) {
          fields.push({
            path: currentPath,
            category: 'body',
            valuePreview: node.textContent.trim(),
            type: 'string',
          });
        }

        for (let i = 0; i < node.children.length; i++) {
          traverse(node.children[i], currentPath);
        }
      };

      traverse(doc.documentElement);
    }
  } catch {
    // Ignore XML parse errors in browser/test env
  }
  return fields;
}
