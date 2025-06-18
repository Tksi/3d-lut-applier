import { trilinear } from './interporate';
import type { Cube } from './parseCube';

/**
 * ImageDataに3D LUTを適用する
 * @param imageData - 元の画像データ
 * @param cube - 3D LUTデータ
 * @returns LUT適用後のImageData
 */
export const applyLutToImageData = (
  imageData: ImageData,
  cube: Cube,
): ImageData => {
  const { data, width, height } = imageData;
  const newData = new Uint8ClampedArray(data.length);

  // 各ピクセルを処理
  for (let i = 0; i < data.length; i += 4) {
    // RGB値を0-1に正規化
    const r = (data[i] ?? 0) / 255;
    const g = (data[i + 1] ?? 0) / 255;
    const b = (data[i + 2] ?? 0) / 255;

    // 3D LUTを適用してRGB値を変換
    const [newR, newG, newB] = applyLutToPixel(r, g, b, cube);

    // 0-255に戻す
    newData[i] = Math.round(newR * 255);
    newData[i + 1] = Math.round(newG * 255);
    newData[i + 2] = Math.round(newB * 255);
    newData[i + 3] = data[i + 3] ?? 255; // アルファ値はそのまま
  }

  return new ImageData(newData, width, height);
};

/**
 * 単一ピクセルのRGB値に3D LUTを適用
 * @param r - 赤成分（0-1）
 * @param g - 緑成分（0-1）
 * @param b - 青成分（0-1）
 * @param cube - 3D LUTデータ
 * @returns 変換後のRGB値
 */
const applyLutToPixel = (
  r: number,
  g: number,
  b: number,
  cube: Cube,
): [number, number, number] => {
  const { size, data } = cube;

  // LUT座標系に変換（0からsize-1の範囲）
  const rIndex = Math.min(r * (size - 1), size - 1);
  const gIndex = Math.min(g * (size - 1), size - 1);
  const bIndex = Math.min(b * (size - 1), size - 1);

  // 整数部分と小数部分を分離
  const r0 = Math.floor(rIndex);
  const g0 = Math.floor(gIndex);
  const b0 = Math.floor(bIndex);
  const r1 = Math.min(r0 + 1, size - 1);
  const g1 = Math.min(g0 + 1, size - 1);
  const b1 = Math.min(b0 + 1, size - 1);

  // 補完係数
  const tr = rIndex - r0;
  const tg = gIndex - g0;
  const tb = bIndex - b0;

  // 8つの頂点のLUT値を取得
  const getLutValue = (ri: number, gi: number, bi: number, channel: number) => {
    const index = (bi * size * size + gi * size + ri) * 3 + channel;

    return data[index] ?? 0;
  };

  // 各チャンネル（R, G, B）について補完
  const newR = trilinear(
    getLutValue(r0, g0, b0, 0), // x000
    getLutValue(r1, g0, b0, 0), // x100
    getLutValue(r0, g1, b0, 0), // x010
    getLutValue(r1, g1, b0, 0), // x110
    getLutValue(r0, g0, b1, 0), // x001
    getLutValue(r1, g0, b1, 0), // x101
    getLutValue(r0, g1, b1, 0), // x011
    getLutValue(r1, g1, b1, 0), // x111
    tr,
    tg,
    tb,
  );

  const newG = trilinear(
    getLutValue(r0, g0, b0, 1),
    getLutValue(r1, g0, b0, 1),
    getLutValue(r0, g1, b0, 1),
    getLutValue(r1, g1, b0, 1),
    getLutValue(r0, g0, b1, 1),
    getLutValue(r1, g0, b1, 1),
    getLutValue(r0, g1, b1, 1),
    getLutValue(r1, g1, b1, 1),
    tr,
    tg,
    tb,
  );

  const newB = trilinear(
    getLutValue(r0, g0, b0, 2),
    getLutValue(r1, g0, b0, 2),
    getLutValue(r0, g1, b0, 2),
    getLutValue(r1, g1, b0, 2),
    getLutValue(r0, g0, b1, 2),
    getLutValue(r1, g0, b1, 2),
    getLutValue(r0, g1, b1, 2),
    getLutValue(r1, g1, b1, 2),
    tr,
    tg,
    tb,
  );

  return [
    Math.max(0, Math.min(1, newR)),
    Math.max(0, Math.min(1, newG)),
    Math.max(0, Math.min(1, newB)),
  ];
};
