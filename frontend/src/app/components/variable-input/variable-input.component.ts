import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {VariablePickerComponent} from 'components/variable-picker/variable-picker.component';
import {
  parseValueToSegments,
  segmentsToValue,
  TextSegment,
  ValueSegment,
  VariableSegment
} from 'utils/variable-parser';

@Component({
  selector: 'app-variable-input',
  imports: [
    FormsModule,
    VariablePickerComponent,
  ],
  templateUrl: './variable-input.component.html',
  styleUrl: './variable-input.component.scss',
})
export class VariableInputComponent {
  value = model<any>('');
  placeholder = input<string>('Wert oder ${request.field}');
  disabled = input<boolean>(false);
  inputClass = input<string>('');
  containerClass = input<string>('');
  showAddButton = input<boolean>(true);
  id = input<string>('');

  keydownEnter = output<KeyboardEvent>();

  isPickerOpen = signal<boolean>(false);
  activeVariableIndex = signal<number | null>(null);
  editingRequestName = signal<string | null>(null);
  editingFieldPath = signal<string | null>(null);
  insertPositionIndex = signal<number | null>(null);

  isRawMode = signal<boolean>(false);

  segments = computed<ValueSegment[]>(() => {
    const rawVal = this.value();
    const strVal = rawVal !== null && rawVal !== undefined ? String(rawVal) : '';
    return parseValueToSegments(strVal);
  });

  hasVariables = computed<boolean>(() => {
    return this.segments().some(s => s.type === 'variable');
  });

  onTextSegmentChange(index: number, event: Event) {
    const inputEl = event.target as HTMLInputElement;
    const newText = inputEl.value;

    const currentSegments = [...this.segments()];
    if (currentSegments[index] && currentSegments[index].type === 'text') {
      currentSegments[index] = { type: 'text', value: newText };
      const updatedValue = segmentsToValue(currentSegments);
      this.value.set(updatedValue);

      // Falls der Nutzer "${" getippt hat, Picker öffnen
      if (newText.endsWith('${')) {
        // "${" entfernen und Picker für diese Stelle öffnen
        currentSegments[index] = { type: 'text', value: newText.slice(0, -2) };
        this.value.set(segmentsToValue(currentSegments));
        this.openPickerForInsert(index);
      }
    }
  }

  onTextKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.keydownEnter.emit(event);
    } else if (event.key === 'Enter') {
      this.keydownEnter.emit(event);
    }
  }

  onRawInput(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    this.value.set(inputEl.value);
  }

  onRawKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.keydownEnter.emit(event);
    } else if (event.key === 'Enter') {
      this.keydownEnter.emit(event);
    }
  }

  openPicker() {
    this.editingRequestName.set(null);
    this.editingFieldPath.set(null);
    this.activeVariableIndex.set(null);
    this.insertPositionIndex.set(this.segments().length);
    this.isPickerOpen.set(true);
  }

  openPickerForInsert(segmentIndex: number) {
    this.editingRequestName.set(null);
    this.editingFieldPath.set(null);
    this.activeVariableIndex.set(null);
    this.insertPositionIndex.set(segmentIndex + 1);
    this.isPickerOpen.set(true);
  }

  editVariable(index: number, segment: VariableSegment) {
    this.activeVariableIndex.set(index);
    this.editingRequestName.set(segment.requestName);
    this.editingFieldPath.set(segment.fieldPath);
    this.insertPositionIndex.set(null);
    this.isPickerOpen.set(true);
  }

  removeVariable(index: number) {
    const currentSegments = [...this.segments()];
    if (index >= 0 && index < currentSegments.length) {
      currentSegments.splice(index, 1);
      // Bereinige und normalisiere Segmente
      const normalized = this.normalizeSegments(currentSegments);
      this.value.set(segmentsToValue(normalized));
    }
  }

  onVariableSelected(variable: { raw: string; requestName: string; fieldPath: string }) {
    const currentSegments = [...this.segments()];
    const editIdx = this.activeVariableIndex();

    if (editIdx !== null && editIdx >= 0 && editIdx < currentSegments.length) {
      // Bestehende Variable aktualisieren
      currentSegments[editIdx] = {
        type: 'variable',
        raw: variable.raw,
        requestName: variable.requestName,
        fieldPath: variable.fieldPath,
      };
    } else {
      // Neue Variable anfügen oder an gegebener Position einfügen
      const insertIdx = this.insertPositionIndex() ?? currentSegments.length;
      const newVarSegment: VariableSegment = {
        type: 'variable',
        raw: variable.raw,
        requestName: variable.requestName,
        fieldPath: variable.fieldPath,
      };
      const trailingTextSegment: TextSegment = { type: 'text', value: '' };

      currentSegments.splice(insertIdx, 0, newVarSegment, trailingTextSegment);
    }

    const normalized = this.normalizeSegments(currentSegments);
    this.value.set(segmentsToValue(normalized));
    this.isPickerOpen.set(false);
  }

  private normalizeSegments(segments: ValueSegment[]): ValueSegment[] {
    if (segments.length === 0) {
      return [{ type: 'text', value: '' }];
    }

    const merged: ValueSegment[] = [];
    for (const seg of segments) {
      if (seg.type === 'text') {
        const last = merged[merged.length - 1];
        if (last && last.type === 'text') {
          last.value += seg.value;
        } else {
          merged.push({ ...seg });
        }
      } else {
        merged.push({ ...seg });
      }
    }

    // Wenn am Ende eine Variable steht, füge ein leeres Textsegment an für weitere Eingaben
    if (merged.length > 0 && merged[merged.length - 1].type === 'variable') {
      merged.push({ type: 'text', value: '' });
    }

    return merged;
  }

  toggleRawMode() {
    this.isRawMode.update(v => !v);
  }
}
