/**
 * Canvasに画像を描画
 * @param canvas HTMLCanvasElement
 * @param img 画像
 */
export const drawImage = async (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement | ImageBitmap | string,
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
