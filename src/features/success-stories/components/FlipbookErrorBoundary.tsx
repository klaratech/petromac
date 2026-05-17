'use client';

import { Component, type ReactNode } from 'react';

/**
 * Local error boundary for the Success Stories flipbook.
 *
 * The page-flip library has occasionally thrown during teardown / re-init
 * (filter change, viewport resize, very fast double taps). Without this
 * boundary, those exceptions bubble all the way to the global error.tsx
 * and the kiosk renders the full-screen "500 / Try Again" page — which
 * looks like a hard crash even though the rest of the kiosk is fine.
 *
 * This catches Flipbook errors locally and renders a small inline retry,
 * keeping the filters + header + back navigation usable.
 */

interface Props {
  children: ReactNode;
}

interface State {
  errored: boolean;
  /** Key bump triggers a fresh re-mount on retry. */
  resetKey: number;
}

export default class FlipbookErrorBoundary extends Component<Props, State> {
  state: State = { errored: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { errored: true };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[FlipbookErrorBoundary]', error);
  }

  reset = () => {
    this.setState((prev) => ({ errored: false, resetKey: prev.resetKey + 1 }));
  };

  render() {
    if (this.state.errored) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <p className="text-slate-900 text-lg font-semibold mb-2">
              The flipbook hit a snag rendering.
            </p>
            <p className="text-slate-500 text-sm mb-6">
              Filters and back navigation still work. Try reloading the
              flipbook below — your filter selection is preserved.
            </p>
            <button
              onClick={this.reset}
              className="px-5 py-2 rounded-full bg-brand text-white font-semibold hover:bg-brand/90 transition-colors"
            >
              Reload flipbook
            </button>
          </div>
        </div>
      );
    }

    // Bump the key on retry so the child remounts cleanly.
    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}
