import {Service} from '@angular/core';

declare global {
  interface Window {
    MonacoEnvironment: any;
  }
}

@Service()
export class MonacoLoader {
  private loaded = false;
  private loadingPromise: Promise<void> | null = null;

  load(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = new Promise((resolve, reject) => {
      const baseUrl = 'public/monaco/vs';

      window.MonacoEnvironment = {
        getWorkerUrl: (_moduleId: string, label: string) => {
          if (label === 'json') {
            return `${baseUrl}/language/json/json.worker.js`;
          }
          return `${baseUrl}/editor/editor.worker.js`;
        }
      };

      const loaderScript = document.createElement('script');
      loaderScript.src = `${baseUrl}/loader.js`;
      loaderScript.onload = () => {
        (window as any).require.config({paths: {vs: baseUrl}});
        (window as any).require(['vs/editor/editor.main'], () => {
          this.loaded = true;
          resolve();
        });
      };
      loaderScript.onerror = reject;
      document.body.appendChild(loaderScript);
    });

    return this.loadingPromise;
  }
}
