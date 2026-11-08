import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Harita veya konum servisinde beklenmedik bir çalışma zamanı hatası oluştuğunda beyaz ekranı önleyen hata sınırı bileşeni
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  public static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message =
      error instanceof Error
        ? error.message
        : 'Beklenmeyen bir uygulama hatası oluştu.';
    return {
      hasError: true,
      errorMessage: message,
    };
  }

  public componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    console.error('Dolmu-app ErrorBoundary yakaladı:', error, errorInfo);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false, errorMessage: null });
    window.location.reload();
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-lg font-extrabold tracking-tight">
                Harita Yüklenirken Bir Sorun Oluştu
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kırıkkale ulaşım verileri güvende ancak görüntüleme sırasında geçici bir hata meydana geldi.
              </p>
            </div>

            {this.state.errorMessage !== null && (
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-slate-300 break-words">
                {this.state.errorMessage}
              </div>
            )}

            <button
              type="button"
              onClick={this.handleReload}
              className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              <span>Uygulamayı Yeniden Yükle</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
