import { applyLutToImageData } from 'lib/applyLut';
import { drawImage, getImageData } from 'lib/canvas';
import { parseCube } from 'lib/parseCube';
import './style.css';

const originalCanvas = document.querySelector<HTMLCanvasElement>('#original')!;
const appliedCanvas = document.querySelector<HTMLCanvasElement>('#applied')!;

const [cube] = await Promise.all([
  fetch('/lut.cube')
    .then((res) => res.text())
    .then((cubeText) => parseCube(cubeText)),
  drawImage(originalCanvas, '/img.avif'),
]);

// 3D LUTを適用
const appliedImageData = applyLutToImageData(
  getImageData(originalCanvas),
  cube,
);

// appliedCanvasに結果を描画
await drawImage(appliedCanvas, appliedImageData);
