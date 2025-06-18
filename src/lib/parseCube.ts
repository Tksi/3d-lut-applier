export type Cube = {
  title: string;
  size: number;
  domainMin: [number, number, number];
  domainMax: [number, number, number];
  data: number[];
};

/**
 * Cubeファイルをパース
 * @param cubeText - Cubeファイルのテキスト
 */
export const parseCube = (cubeText: string): Cube => {
  const cube: Cube = {
    title: '',
    size: 0,
    domainMin: [0, 0, 0],
    domainMax: [1, 1, 1],
    data: [],
  };

  const lines = cubeText.split('\n').map((line) => line.trim());

  for (const line of lines) {
    // コメント行スキップ
    if (line.startsWith('#')) {
      continue;
    }

    const parts = line.split(/\s+/);

    switch (parts[0]) {
      case undefined: {
        break;
      }
      case 'TITLE': {
        const title = parts[1]?.match(/"(.*)"/)?.[1];
        if (title != null) cube.title = title;

        break;
      }
      case 'LUT_3D_SIZE': {
        const size = Number(parts[1]);
        if (Number.isNaN(size) === false) cube.size = size;

        break;
      }
      case 'DOMAIN_MIN': {
        const domainMin = parts.slice(1, 4).map(Number) as [
          number,
          number,
          number,
        ];

        if (domainMin.every((v) => Number.isNaN(v) === false)) {
          cube.domainMin = domainMin;
        }

        break;
      }
      case 'DOMAIN_MAX': {
        const domainMax = parts.slice(1, 4).map(Number) as [
          number,
          number,
          number,
        ];

        if (domainMax.every((v) => Number.isNaN(v) === false)) {
          cube.domainMax = domainMax;
        }

        break;
      }
      default: {
        const data = parts.map(Number);

        // LUT data points
        if (
          parts.length === 3 &&
          data.every((v) => Number.isNaN(v) === false)
        ) {
          cube.data.push(...data);
        }

        break;
      }
    }
  }

  if (cube.data.length !== cube.size ** 3 * 3) {
    throw new Error(
      `Invalid LUT data size: expected ${cube.size ** 3}, got ${cube.data.length}`,
    );
  }

  return cube;
};
