import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  OnDestroy,
  output,
  viewChild
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MonacoLoader} from 'services/monaco-loader';

declare const monaco: any;

@Component({
  selector: 'app-json-editor',
  imports: [],
  templateUrl: './json-editor.html',
  styleUrl: './json-editor.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => JsonEditor),
      multi: true
    }
  ],
})
export class JsonEditor implements AfterViewInit, OnDestroy, ControlValueAccessor {
  editorContainer = viewChild.required<ElementRef<HTMLDivElement>>('editorContainer');
  value = model.required<any>();
  language = input<string>('json');
  readOnly = input<boolean>(false);
  schema = input<object | null>(null);
  validationErrors = output<any[]>();
  submitShortcut = output<void>();

  private monacoLoader = inject(MonacoLoader);
  private editor: any;
  private disposables: any[] = [];
  private editorReady = false;

  private updatingFromEditor = false;

  constructor() {
    effect(() => {
      const val = this.value();
      if (!this.editor) return;

      if (this.updatingFromEditor) {
        return;
      }
      const jsonString = this.convertJsonToString(val) ?? '';
      if (this.editor.getValue() !== jsonString) {
        this.editor.setValue(jsonString);
      }
    });

    effect(() => {
      this.readOnly();
      this.editor?.updateOptions({readOnly: this.readOnly()});
    });

    effect(() => {
      const lang = this.language();
      if (this.editor && this.editorReady) {
        const model = this.editor.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, lang || 'json');
        }
      }
    });

    effect(() => {
      this.schema();
      if (this.editorReady) {
        this.applySchema();
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    await this.monacoLoader.load();
    this.initEditor();
  }

  formatDocument(): void {
    this.editor?.getAction('editor.action.formatDocument')?.run();
  }

  writeValue(value: string): void {
    const parsed = this.loadJsonFromString(value);
    this.value.set(parsed ?? {});
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.editor?.updateOptions({readOnly: isDisabled});
  }

  ngOnDestroy(): void {
    this.disposables.forEach(d => d.dispose());
    this.editor?.dispose();
  }

  loadJsonFromString(json_string: string | undefined): any {
    if (!json_string) return undefined;
    if (this.language() !== 'json') return json_string;
    try {
      return JSON.parse(json_string);
    } catch {
      return json_string;
    }
  }

  convertJsonToString(json: any): string | undefined {
    if (json === undefined || json === null) return '';
    if (typeof json === 'string') return json;
    return JSON.stringify(json, null, 2);
  }

  private onChange: (value: string) => void = () => {
  };
  private onTouched: () => void = () => {
  };

  private initEditor(): void {
    monaco.editor.defineTheme('yaata-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        {token: 'string.key.json', foreground: '93C5FD'}, // sky-300
        {token: 'string.value.json', foreground: 'FDBA74'}, // orange-300
        {token: 'number.json', foreground: '86EFAC'}, // green-300
        {token: 'keyword.json', foreground: 'F472B6'}, // pink-400 (true/false/null)
      ],
      colors: {
        'editor.background': '#0b1120',
        'editorGutter.background': '#0b1120',
        'editor.lineHighlightBackground': '#1e293b40',
        'editor.foreground': '#e2e8f0',
        'editor.selectionBackground': '#33415580',
        'editorCursor.foreground': '#38bdf8',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#cbd5e1',
        'editorWidget.background': '#0f172a',
        'editorWidget.border': '#1e293b',
        'editorSuggestWidget.background': '#0f172a',
        'editorSuggestWidget.selectedBackground': '#1e293b',
        'scrollbarSlider.background': '#33415540',
        'scrollbarSlider.hoverBackground': '#47556960',
        'scrollbarSlider.activeBackground': '#64748b80',
      }
    });

    this.editor = monaco.editor.create(this.editorContainer().nativeElement, {
      value: this.convertJsonToString(this.value()) ?? '',
      language: this.language() || 'json',
      theme: 'yaata-dark',
      automaticLayout: true,
      minimap: {enabled: false},
      readOnly: this.readOnly(),
      formatOnPaste: true,
      tabSize: 2,
      scrollBeyondLastLine: false,
      fontSize: 13,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      lineNumbersMinChars: 3,
      padding: { top: 8, bottom: 8 },
      roundedSelection: true,
      renderLineHighlight: 'all',
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
        useShadows: false,
        alwaysConsumeMouseWheel: true
      },
      fixedOverflowWidgets: true
    });

    this.editorReady = true;
    this.applySchema();

    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      this.submitShortcut.emit();
    });

    const changeSub = this.editor.onDidChangeModelContent(() => {
      const val: string = this.editor.getValue();
      this.onChange(val);
      this.onTouched();

      const parsed = this.loadJsonFromString(val);
      if (parsed === undefined) {
        return;
      }

      this.updatingFromEditor = true;
      this.value.set(parsed);
      queueMicrotask(() => (this.updatingFromEditor = false));
    });
    this.disposables.push(changeSub);

    const markerSub = monaco.editor.onDidChangeMarkers(([uri]: any[]) => {
      const model = this.editor.getModel();
      if (model && uri.toString() === model.uri.toString()) {
        const markers = monaco.editor.getModelMarkers({resource: uri});
        this.validationErrors.emit(markers);
      }
    });
    this.disposables.push(markerSub);
  }

  private applySchema(): void {
    if (!this.schema()) return;
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        {
          uri: 'internal://json-editor-schema.json',
          fileMatch: ['*'],
          schema: this.schema()
        }
      ]
    });
  }
}
