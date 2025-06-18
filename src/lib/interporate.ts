/**
 * 線形補完（Linear Interpolation）を行う関数
 * @param a - 開始値
 * @param b - 終了値
 * @param t - 補完係数（0.0-1.0）
 * @returns 補完された値
 */
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

/**
 * バイリニア補完（Bilinear Interpolation）を行う関数
 * 2D平面上の4点から補完値を計算する
 * @param x00 - (0,0)位置の値
 * @param x10 - (1,0)位置の値
 * @param x01 - (0,1)位置の値
 * @param x11 - (1,1)位置の値
 * @param tx - X方向の補完係数（0.0-1.0）
 * @param ty - Y方向の補完係数（0.0-1.0）
 * @returns 補完された値
 */
export const bilinear = (
  x00: number,
  x10: number,
  x01: number,
  x11: number,
  tx: number,
  ty: number,
): number => {
  const x0 = lerp(x00, x10, tx);
  const x1 = lerp(x01, x11, tx);

  return lerp(x0, x1, ty);
};

/**
 * トリリニア補完（Trilinear Interpolation）を行う関数
 * 3D空間の8点から補完値を計算する
 * @param x000 - (0,0,0)位置の値
 * @param x100 - (1,0,0)位置の値
 * @param x010 - (0,1,0)位置の値
 * @param x110 - (1,1,0)位置の値
 * @param x001 - (0,0,1)位置の値
 * @param x101 - (1,0,1)位置の値
 * @param x011 - (0,1,1)位置の値
 * @param x111 - (1,1,1)位置の値
 * @param tx - X方向の補完係数（0.0-1.0）
 * @param ty - Y方向の補完係数（0.0-1.0）
 * @param tz - Z方向の補完係数（0.0-1.0）
 * @returns 補完された値
 */
export const trilinear = (
  x000: number,
  x100: number,
  x010: number,
  x110: number,
  x001: number,
  x101: number,
  x011: number,
  x111: number,
  tx: number,
  ty: number,
  tz: number,
): number => {
  const c00 = bilinear(x000, x100, x010, x110, tx, ty);
  const c01 = bilinear(x001, x101, x011, x111, tx, ty);

  return lerp(c00, c01, tz);
};
