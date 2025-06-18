import { drawImage } from 'lib/canvas';
import { parseCube } from 'lib/parseCube';
import './style.css';

const originalCanvas = document.querySelector<HTMLCanvasElement>('#original')!;

const [cube] = await Promise.all([
  fetch('/lut.cube')
    .then((res) => res.text())
    .then((cubeText) => parseCube(cubeText)),
  drawImage(originalCanvas, '/img.avif'),
]);
