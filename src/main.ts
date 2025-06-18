import { parseCube } from 'lib/parseCube';
import './style.css';

const cube = await fetch('/lut.cube')
  .then((res) => res.text())
  .then((cubeText) => parseCube(cubeText));

console.log(cube);
