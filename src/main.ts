import { WorkerPool } from 'lib/WorkerPool';
import { drawImage, getImageData } from 'lib/canvas';
import { type Cube, parseCube } from 'lib/parseCube';
import workerUrl from 'workers/lutChunkWorker.ts?worker&url';
import type {
  LutChunkWorkerMessage,
  LutChunkWorkerResponse,
} from 'workers/lutChunkWorker';
import './style.css';

const originalCanvas = document.querySelector<HTMLCanvasElement>('#original')!;
const appliedCanvas = document.querySelector<HTMLCanvasElement>('#applied')!;
const container = document.querySelector<HTMLDivElement>('.canvas-container')!;
const sliderLine = document.querySelector<HTMLDivElement>('.slider-line')!;
const loadingOverlay = document.querySelector<HTMLDivElement>('#loading')!;
const downloadBtn = document.querySelector<HTMLButtonElement>('#download-btn')!;
const uploadBtn = document.querySelector<HTMLButtonElement>('#upload-btn')!;
const imageInput = document.querySelector<HTMLInputElement>('#image-input')!;

let currentCube: Cube | null = null;

/**
 * 画像に3D LUTを適用してcanvasに描画
 * @param imageSource 画像のソース（File、string、または画像要素）
 */
const processAndDrawImage = async (
  imageSource: File | HTMLImageElement | string,
) => {
  console.time('Timer');
  showLoading(true);

  await drawImage(
    originalCanvas,
    imageSource instanceof File
      ? await createImageFromFile(imageSource)
      : imageSource,
  );

  if (currentCube) {
    const imageData = getImageData(originalCanvas);
    await applyLutWithWorkerPool(imageData, currentCube);
  }

  showLoading(false);
  console.timeEnd('Timer');
};

/**
 * ローディング状態を表示/非表示
 * @param show 表示するかどうか
 */
const showLoading = (show: boolean) => {
  loadingOverlay.style.display = show ? 'flex' : 'none';
};

/**
 * WorkerPoolを使って並列でLUTを適用
 * @param imageData 画像データ
 * @param cube 3D LUTデータ
 */
const applyLutWithWorkerPool = (
  imageData: ImageData,
  cube: Cube,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const { width, height } = imageData;
    const workerCount = navigator.hardwareConcurrency || 4;
    const chunkHeight = Math.ceil(height / workerCount);
    const chunks = new Array<ImageData | undefined>(workerCount);

    const workerPool = new WorkerPool<LutChunkWorkerResponse>(
      workerUrl,
      (result: LutChunkWorkerResponse) => {
        if (
          result.type === 'chunk-processed' &&
          result.result &&
          result.chunkIndex !== undefined
        ) {
          chunks[result.chunkIndex] = result.result;
        } else if (result.type === 'error') {
          reject(new Error(result.error ?? 'Unknown worker error'));
        }
      },
      () => {
        // すべてのチャンクが処理完了したら結合
        const finalImageData = mergeChunks(chunks, width, height);
        void drawImage(appliedCanvas, finalImageData);
        resolve();
      },
      workerCount,
    );

    // 各チャンクを処理
    for (let i = 0; i < workerCount; i++) {
      const startRow = i * chunkHeight;
      const endRow = Math.min((i + 1) * chunkHeight, height);

      if (startRow < height) {
        const message: LutChunkWorkerMessage = {
          type: 'apply-lut-chunk',
          imageData,
          cube,
          startRow,
          endRow,
          chunkIndex: i,
        };

        workerPool.add(message);
      }
    }

    workerPool.fix();
  });
};

/**
 * 処理されたチャンクを結合して元のサイズのImageDataを作成
 * @param chunks 処理されたチャンクの配列
 * @param width 元の画像の幅
 * @param height 元の画像の高さ
 * @returns 結合されたImageData
 */
const mergeChunks = (
  chunks: (ImageData | undefined)[],
  width: number,
  height: number,
): ImageData => {
  const mergedData = new Uint8ClampedArray(width * height * 4);
  let currentRow = 0;

  for (const chunk of chunks) {
    if (chunk !== undefined) {
      const chunkHeight = chunk.height;
      const startPixel = currentRow * width * 4;
      const chunkData = chunk.data;

      mergedData.set(chunkData, startPixel);
      currentRow += chunkHeight;
    }
  }

  return new ImageData(mergedData, width, height);
};

/**
 * FileオブジェクトからHTMLImageElementを作成
 * @param file ファイルオブジェクト
 * @returns HTMLImageElement
 */
const createImageFromFile = (file: File): Promise<HTMLImageElement> => {
  const { promise, resolve, reject } =
    Promise.withResolvers<HTMLImageElement>();

  const img = new Image();
  img.addEventListener('load', () => {
    URL.revokeObjectURL(img.src);
    resolve(img);
  });
  img.addEventListener('error', () => {
    URL.revokeObjectURL(img.src);
    reject(new Error('画像の読み込みに失敗しました'));
  });

  img.src = URL.createObjectURL(file);

  return promise;
};

/**
 * マウス位置に応じてcanvasのクリップ領域を更新
 * @param percentage クリップする位置のパーセンテージ
 */
const updateClipPath = (percentage: number) => {
  // appliedCanvasのクリップ領域を更新（右側を表示）
  appliedCanvas.style.clipPath = `polygon(${percentage}% 0%, 100% 0%, 100% 100%, ${percentage}% 100%)`;

  // スライダーラインの位置を更新
  sliderLine.style.left = `${percentage}%`;
};

let animationFrameId: number | null = null;

/**
 * requestAnimationFrameを使用した最適化されたクリップ更新
 * @param mouseX マウスのX座標（コンテナ内の相対位置）
 * @param containerWidth コンテナの幅
 */
const scheduleClipUpdate = (mouseX: number, containerWidth: number) => {
  // 前のフレームをキャンセル
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  animationFrameId = requestAnimationFrame(() => {
    const percentage = Math.max(
      0,
      Math.min(100, (mouseX / containerWidth) * 100),
    );
    updateClipPath(percentage);
    animationFrameId = null;
  });
};

// ドラッグ・アンド・ドロップイベントリスナーを追加
container.addEventListener('dragover', (event) => {
  event.preventDefault();
  container.classList.add('drag-over');
});

container.addEventListener('dragleave', (event) => {
  if (!container.contains(event.relatedTarget as Node)) {
    container.classList.remove('drag-over');
  }
});

container.addEventListener('drop', (event) => {
  event.preventDefault();
  container.classList.remove('drag-over');

  const files = [...(event.dataTransfer?.files ?? [])];
  const imageFile = files.find((file) => file.type.startsWith('image/'));

  if (imageFile) {
    processAndDrawImage(imageFile).catch((err) => {
      console.error('画像処理エラー:', err);
      alert('画像の処理に失敗しました');
    });
  } else {
    alert('画像ファイルをドロップしてください');
  }
});

// マウスイベントリスナーを追加
container.addEventListener('mousemove', (event) => {
  const rect = container.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  scheduleClipUpdate(mouseX, rect.width);
});

// タッチイベントリスナーを追加
container.addEventListener('touchmove', (event) => {
  event.preventDefault(); // スクロールを防ぐ
  const rect = container.getBoundingClientRect();
  const touch = event.touches[0];

  if (touch) {
    const touchX = touch.clientX - rect.left;
    scheduleClipUpdate(touchX, rect.width);
  }
});

container.addEventListener('touchstart', (event) => {
  event.preventDefault(); // スクロールを防ぐ
  const rect = container.getBoundingClientRect();
  const touch = event.touches[0];

  if (touch) {
    const touchX = touch.clientX - rect.left;
    scheduleClipUpdate(touchX, rect.width);
  }
});

/**
 * appliedCanvasの内容をJPEGとしてダウンロード
 */
const downloadCanvasAsJpeg = () => {
  const canvas = appliedCanvas;
  const link = document.createElement('a');

  canvas.toBlob(
    (blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `lut-applied-${Date.now()}.jpeg`;
        link.click();
        URL.revokeObjectURL(url);
      }
    },
    'image/jpeg',
    0.8,
  );
};

// 初期化処理
const initializeApp = async () => {
  try {
    // 3D LUTファイルを読み込み
    currentCube = await fetch('/lut.cube')
      .then((res) => res.text())
      .then((cubeText) => parseCube(cubeText));

    // 初期画像を読み込み
    await processAndDrawImage('/img.avif');

    // ダウンロードボタンのイベントリスナーを追加
    downloadBtn.addEventListener('click', downloadCanvasAsJpeg);

    // アップロードボタンのイベントリスナーを追加
    uploadBtn.addEventListener('click', () => {
      imageInput.click();
    });

    // ファイル選択のイベントリスナーを追加
    imageInput.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (file?.type.startsWith('image/') === true) {
        processAndDrawImage(file).catch((err) => {
          console.error('画像処理エラー:', err);
          alert('画像の処理に失敗しました');
        });
      } else if (file) {
        alert('画像ファイルを選択してください');
      }

      // ファイル選択後にinputをクリア（同じファイルを再度選択可能にする）
      target.value = '';
    });
  } catch (err) {
    console.error('初期化エラー:', err);
  }
};

await initializeApp();
