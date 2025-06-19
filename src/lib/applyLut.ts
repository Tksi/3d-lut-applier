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

  // 8つの頂点のベースインデックスを事前計算（高速化）
  const sizeSquared = size * size;
  const baseIndex000 = (b0 * sizeSquared + g0 * size + r0) * 3;
  const baseIndex100 = (b0 * sizeSquared + g0 * size + r1) * 3;
  const baseIndex010 = (b0 * sizeSquared + g1 * size + r0) * 3;
  const baseIndex110 = (b0 * sizeSquared + g1 * size + r1) * 3;
  const baseIndex001 = (b1 * sizeSquared + g0 * size + r0) * 3;
  const baseIndex101 = (b1 * sizeSquared + g0 * size + r1) * 3;
  const baseIndex011 = (b1 * sizeSquared + g1 * size + r0) * 3;
  const baseIndex111 = (b1 * sizeSquared + g1 * size + r1) * 3;

  // 各チャンネル（R, G, B）について補完 - 直接インデックスアクセスで高速化
  const newR = trilinear(
    data[baseIndex000] ?? 0, // x000
    data[baseIndex100] ?? 0, // x100
    data[baseIndex010] ?? 0, // x010
    data[baseIndex110] ?? 0, // x110
    data[baseIndex001] ?? 0, // x001
    data[baseIndex101] ?? 0, // x101
    data[baseIndex011] ?? 0, // x011
    data[baseIndex111] ?? 0, // x111
    tr,
    tg,
    tb,
  );

  const newG = trilinear(
    data[baseIndex000 + 1] ?? 0,
    data[baseIndex100 + 1] ?? 0,
    data[baseIndex010 + 1] ?? 0,
    data[baseIndex110 + 1] ?? 0,
    data[baseIndex001 + 1] ?? 0,
    data[baseIndex101 + 1] ?? 0,
    data[baseIndex011 + 1] ?? 0,
    data[baseIndex111 + 1] ?? 0,
    tr,
    tg,
    tb,
  );

  const newB = trilinear(
    data[baseIndex000 + 2] ?? 0,
    data[baseIndex100 + 2] ?? 0,
    data[baseIndex010 + 2] ?? 0,
    data[baseIndex110 + 2] ?? 0,
    data[baseIndex001 + 2] ?? 0,
    data[baseIndex101 + 2] ?? 0,
    data[baseIndex011 + 2] ?? 0,
    data[baseIndex111 + 2] ?? 0,
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
