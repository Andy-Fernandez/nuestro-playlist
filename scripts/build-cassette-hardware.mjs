import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Original image texture stays inside each SVG, so offline images have no
// external dependencies. Edit a cassette's hardware.json and run this script.
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const cassetteRoot = path.join(projectRoot, 'public/assets/cassettes');
const sources = {
  reel: { file: 'reel.png', width: 171, height: 173 },
  guideRoller: { file: 'guide-roller.png', width: 969, height: 977 },
};
for (const source of Object.values(sources)) {
  source.data = (await readFile(path.join(projectRoot, 'design/hardware', source.file))).toString('base64');
}

function renderHardware(source, color, title) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error(`Invalid hardware color: ${color}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${source.width}" height="${source.height}" viewBox="0 0 ${source.width} ${source.height}">
  <title>${title}</title>
  <defs><filter id="color" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">
    <feColorMatrix type="saturate" values="0" result="metal"/>
    <feFlood flood-color="${color}" result="tint"/>
    <feComposite in="tint" in2="metal" operator="in" result="masked-tint"/>
    <feBlend in="metal" in2="masked-tint" mode="multiply"/>
  </filter></defs>
  <image width="${source.width}" height="${source.height}" href="data:image/png;base64,${source.data}" filter="url(#color)"/>
</svg>\n`;
}

for (const folder of await readdir(cassetteRoot, { withFileTypes: true })) {
  if (!folder.isDirectory() || folder.name === 'shared') continue;
  const directory = path.join(cassetteRoot, folder.name);
  const palette = JSON.parse(await readFile(path.join(directory, 'hardware.json'), 'utf8'));
  await writeFile(path.join(directory, 'reel.svg'), renderHardware(sources.reel, palette.reelColor, `${folder.name} main reel`));
  await writeFile(path.join(directory, 'guide-roller.svg'), renderHardware(sources.guideRoller, palette.guideRollerColor, `${folder.name} guide roller`));
}
console.log('Cassette hardware images rebuilt from individual palettes.');
