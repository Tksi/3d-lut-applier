import { drawImage, getImageData } from 'lib/canvas';
import { type Cube, parseCube } from 'lib/parseCube';
import type { LutWorkerMessage, LutWorkerResponse } from './workers/lutWorker';
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
let lutWorker: Worker | null = null;

/**
 * 画像に3D LUTを適用してcanvasに描画
 * @param imageSource 画像のソース（File、string、または画像要素）
 */
const processAndDrawImage = async (
  imageSource: File | HTMLImageElement | string,
) => {
  showLoading(true);

  await drawImage(
    originalCanvas,
    imageSource instanceof File
      ? await createImageFromFile(imageSource)
      : imageSource,
  );

  if (currentCube && lutWorker) {
    const imageData = getImageData(originalCanvas);
    await applyLutWithWorker(imageData, currentCube);
  }
};

/**
 * ローディング状態を表示/非表示
 * @param show 表示するかどうか
 */
const showLoading = (show: boolean) => {
  loadingOverlay.style.display = show ? 'flex' : 'none';
};

/**
 * Web WorkerでLUTを適用
 * @param imageData 画像データ
 * @param cube 3D LUTデータ
 */
const applyLutWithWorker = (
  imageData: ImageData,
  cube: Cube,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!lutWorker) {
      reject(new Error('Worker not initialized'));

      return;
    }

    const handleMessage = (event: MessageEvent<LutWorkerResponse>) => {
      if (event.data.type === 'lut-applied') {
        if (event.data.result !== undefined) {
          void drawImage(appliedCanvas, event.data.result);
        }

        lutWorker?.removeEventListener('message', handleMessage);
        showLoading(false);
        resolve();
      } else if (event.data.type === 'error') {
        lutWorker?.removeEventListener('message', handleMessage);
        showLoading(false);
        reject(new Error(String(event.data.error ?? 'Unknown worker error')));
      }
    };

    lutWorker.addEventListener('message', handleMessage);

    const message: LutWorkerMessage = {
      type: 'apply-lut',
      imageData,
      cube,
    };

    lutWorker.postMessage(message);
  });
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
 * Web Workerを初期化
 */
const initializeWorker = () => {
  lutWorker = new Worker(new URL('workers/lutWorker.ts', import.meta.url), {
    type: 'module',
  });
};

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
    // Web Workerを初期化
    initializeWorker();

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

      if (file?.type.startsWith('image/')) {
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
