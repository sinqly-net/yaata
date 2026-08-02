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
  value = model.required<object>();
  readOnly = input<boolean>(false);
  schema = input<object | null>(null);
  validationErrors = output<any[]>();

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
      const jsonString = this.convertJsonToString(val) ?? '{}';
      if (this.editor.getValue() !== jsonString) {
        this.editor.setValue(jsonString);
      }
    });

    effect(() => {
      this.readOnly();
      this.editor?.updateOptions({readOnly: this.readOnly()});
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

  loadJsonFromString(json_string: string | undefined): object | undefined {
    if (!json_string) return undefined;
    try {
      return JSON.parse(json_string);
    } catch {
      return undefined;
    }
  }

  convertJsonToString(json: object | undefined): string | undefined {
    if (json === undefined) return undefined;
    return JSON.stringify(json, null, 2);
  }

  private onChange: (value: string) => void = () => {
  };
  private onTouched: () => void = () => {
  };

  private initEditor(): void {
    monaco.editor.defineTheme('dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        {token: 'string.key.json', foreground: '9CDCFE'},
        {token: 'string.value.json', foreground: 'CE9178'},
        {token: 'number.json', foreground: 'B5CEA8'},
        {token: 'keyword.json', foreground: '569CD6'}, // true/false/null
      ],
      colors: {
        // These values got changed to custom values
        'editor.background': '#2b394f', // background for code section
        'editorGutter.background': '#263245', // left side bar background
        'editor.lineHighlightBackground': '#30425b', // highlight for selected line

        // These values are the defaults
        'editor.foreground': '#cdd6f4',
        'editor.selectionBackground': '#585b7099',
        'editorCursor.foreground': '#f5e0dc',
        'editorLineNumber.foreground': '#6c7086',
        'editorLineNumber.activeForeground': '#cdd6f4',
        'editorWidget.background': '#181825',
        'editorWidget.border': '#313244',
        'editorSuggestWidget.background': '#181825',
        'editorSuggestWidget.selectedBackground': '#313244',
        'scrollbarSlider.background': '#45475a80',
        'scrollbarSlider.hoverBackground': '#585b70aa',
      }
    });

    this.editor = monaco.editor.create(this.editorContainer().nativeElement, {
      value: this.convertJsonToString(this.value()) ?? '{}',
      language: 'json',
      theme: 'dark',
      automaticLayout: true,
      minimap: {enabled: false},
      readOnly: this.readOnly(),
      formatOnPaste: true,
      tabSize: 2,
      scrollBeyondLastLine: false
    });

    this.editorReady = true;
    this.applySchema();

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
