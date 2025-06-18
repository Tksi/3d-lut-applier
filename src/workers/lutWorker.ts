import { applyLutToImageData } from '../lib/applyLut';
import type { Cube } from '../lib/parseCube';

export type LutWorkerMessage = {
  type: 'apply-lut';
  imageData: ImageData;
  cube: Cube;
}

export type LutWorkerResponse = {
  type: 'error' | 'lut-applied';
  result?: ImageData;
  error?: string;
}

self.addEventListener('message', (event: MessageEvent<LutWorkerMessage>) => {
  const { type, imageData, cube } = event.data;

  if (type === 'apply-lut') {
    try {
      const result = applyLutToImageData(imageData, cube);
      const response: LutWorkerResponse = {
        type: 'lut-applied',
        result,
      };
      self.postMessage(response);
    } catch (err) {
      const response: LutWorkerResponse = {
        type: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      };
      self.postMessage(response);
    }
  }
});
