import {describe, it, expect} from 'vitest';
import {
  parseValueToSegments,
  segmentsToValue,
  extractFieldsFromHistory,
  ValueSegment
} from './variable-parser';
import {RequestHistory} from 'types/RequestHistory';

describe('variable-parser', () => {
  it('should parse plain text into a single text segment', () => {
    const segments = parseValueToSegments('https://example.com/api');
    expect(segments).toEqual([
      { type: 'text', value: 'https://example.com/api' }
    ]);
    expect(segmentsToValue(segments)).toBe('https://example.com/api');
  });

  it('should parse single variable with text before and after', () => {
    const input = 'Bearer ${Get Access Token.token}';
    const segments = parseValueToSegments(input);
    expect(segments).toEqual([
      { type: 'text', value: 'Bearer ' },
      {
        type: 'variable',
        raw: '${Get Access Token.token}',
        requestName: 'Get Access Token',
        fieldPath: 'token'
      }
    ]);
    expect(segmentsToValue(segments)).toBe(input);
  });

  it('should parse multiple variables with text in between', () => {
    const input = 'https://api.com/users/${Get User.id}?token=${Auth.jwt}&lang=de';
    const segments = parseValueToSegments(input);
    expect(segments.length).toBe(5);
    expect(segments[0]).toEqual({ type: 'text', value: 'https://api.com/users/' });
    expect(segments[1]).toEqual({
      type: 'variable',
      raw: '${Get User.id}',
      requestName: 'Get User',
      fieldPath: 'id'
    });
    expect(segments[2]).toEqual({ type: 'text', value: '?token=' });
    expect(segments[3]).toEqual({
      type: 'variable',
      raw: '${Auth.jwt}',
      requestName: 'Auth',
      fieldPath: 'jwt'
    });
    expect(segments[4]).toEqual({ type: 'text', value: '&lang=de' });
    expect(segmentsToValue(segments)).toBe(input);
  });

  it('should handle empty or null input gracefully', () => {
    expect(parseValueToSegments('')).toEqual([{ type: 'text', value: '' }]);
    expect(parseValueToSegments(null)).toEqual([{ type: 'text', value: '' }]);
    expect(segmentsToValue([])).toBe('');
  });

  it('should extract fields from RequestHistory with JSON body and headers', () => {
    const mockHistory: RequestHistory = {
      id: 'hist-1',
      request_id: 'req-1',
      ok: true,
      status: 200,
      status_text: 'OK',
      duration_ms: 85,
      created_at: new Date(),
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer xyz'
      },
      body: {
        token: 'jwt-12345',
        user: {
          id: 'u-99',
          name: 'Alice'
        },
        roles: ['admin', 'editor']
      }
    };

    const fields = extractFieldsFromHistory(mockHistory);
    const paths = fields.map(f => f.path);

    expect(paths).toContain('status');
    expect(paths).toContain('ok');
    expect(paths).toContain('duration_ms');
    expect(paths).toContain('headers.content-type');
    expect(paths).toContain('headers.authorization');
    expect(paths).toContain('token');
    expect(paths).toContain('user.id');
    expect(paths).toContain('user.name');
    expect(paths).toContain('roles[0]');

    const tokenField = fields.find(f => f.path === 'token');
    expect(tokenField?.valuePreview).toBe('jwt-12345');
  });
});
