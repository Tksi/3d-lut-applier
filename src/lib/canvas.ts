/**
 * Canvasに画像を描画
 * @param canvas HTMLCanvasElement
 * @param img 画像
 */
export const drawImage = async (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement | ImageBitmap | ImageData | string,
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (typeof img === 'string') {
    // eslint-disable-next-line no-param-reassign
    img = await createImageElement(img);
  }

  // eslint-disable-next-line no-param-reassign
  canvas.width = img.width;
  // eslint-disable-next-line no-param-reassign
  canvas.height = img.height;

  if (img instanceof ImageData) {
    ctx.putImageData(img, 0, 0);

    return;
  }

  ctx.drawImage(img, 0, 0);
};

const createImageElement = (imgPath: string): Promise<HTMLImageElement> => {
  const { promise, resolve, reject } =
    Promise.withResolvers<HTMLImageElement>();

  const img = new Image();
  img.addEventListener('load', () => resolve(img));
  img.addEventListener('error', (err) => reject(new Error(err.message)));
  img.src = imgPath;

  return promise;
};

/**
 * Canvasから画像データを取得
 * @param canvas HTMLCanvasElement
 * @returns ImageData
 */
export const getImageData = (canvas: HTMLCanvasElement): ImageData => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not found');

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};
