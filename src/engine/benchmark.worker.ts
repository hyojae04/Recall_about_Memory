import { runBenchmark } from './evaluation';

self.onmessage = (event: MessageEvent<{ k: number }>) => {
  try {
    const run = runBenchmark(event.data.k, (completed, total) =>
      self.postMessage({ type: 'progress', completed, total }),
    );
    self.postMessage({ type: 'complete', run });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Benchmark failed',
    });
  }
};
