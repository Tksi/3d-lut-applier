import { applyLutToImageData } from '../lib/applyLut';
import type { Cube } from '../lib/parseCube';

export type LutChunkWorkerMessage = {
  type: 'apply-lut-chunk';
  imageData: ImageData;
  cube: Cube;
  startRow: number;
  endRow: number;
  chunkIndex: number;
};

export type LutChunkWorkerResponse = {
  type: 'chunk-processed' | 'error';
  result?: ImageData;
  chunkIndex?: number;
  error?: string;
};

/**
 * ImageDataの指定された行範囲のみを処理
 * @param imageData 元の画像データ
 * @param cube 3D LUTデータ
 * @param startRow 開始行（0から始まる）
 * @param endRow 終了行（この行は含まない）
 * @returns 処理されたチャンクのImageData
 */
const processImageChunk = (
  imageData: ImageData,
  cube: Cube,
  startRow: number,
  endRow: number,
): ImageData => {
  const { width } = imageData;
  const chunkHeight = endRow - startRow;

  // チャンクサイズのImageDataを作成
  const chunkData = new Uint8ClampedArray(width * chunkHeight * 4);

  // 元の画像データから該当する行をコピー
  const startPixel = startRow * width * 4;
  const endPixel = endRow * width * 4;
  chunkData.set(imageData.data.slice(startPixel, endPixel));

  const chunkImageData = new ImageData(chunkData, width, chunkHeight);

  // LUTを適用
  return applyLutToImageData(chunkImageData, cube);
};

self.addEventListener(
  'message',
  (event: MessageEvent<LutChunkWorkerMessage>) => {
    const { type, imageData, cube, startRow, endRow, chunkIndex } = event.data;

    if (type === 'apply-lut-chunk') {
      try {
        const result = processImageChunk(imageData, cube, startRow, endRow);
        const response: LutChunkWorkerResponse = {
          type: 'chunk-processed',
          result,
          chunkIndex,
        };
        self.postMessage(response);
      } catch (err) {
        const response: LutChunkWorkerResponse = {
          type: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
          chunkIndex,
        };
        self.postMessage(response);
      }
    }
  },
);
