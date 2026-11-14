// Genera todos los íconos de la app a partir del dibujo de Llavecita.
// Uso: npm run icons
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const cara = `
  <path d="M78 32 A62 62 0 1 0 122 32 L122 56 Q122 66 112 66 L88 66 Q78 66 78 56 Z" fill="#FFF6E9" stroke="#0F3D4A" stroke-width="6" stroke-linejoin="round"/>
  <ellipse cx="58" cy="114" rx="10" ry="7" fill="#FF9E8F"/>
  <ellipse cx="142" cy="114" rx="10" ry="7" fill="#FF9E8F"/>
  <circle cx="78" cy="96" r="17" fill="#FFFFFF" stroke="#0F3D4A" stroke-width="4"/>
  <circle cx="122" cy="96" r="17" fill="#FFFFFF" stroke="#0F3D4A" stroke-width="4"/>
  <circle cx="80" cy="98" r="9" fill="#0F3D4A"/>
  <circle cx="124" cy="98" r="9" fill="#0F3D4A"/>
  <circle cx="84" cy="93" r="3.5" fill="#FFFFFF"/>
  <circle cx="128" cy="93" r="3.5" fill="#FFFFFF"/>
  <path d="M86 122 Q100 136 114 122" fill="none" stroke="#0F3D4A" stroke-width="5" stroke-linecap="round"/>
`;

// Ícono normal: cuadro naranja con esquinas redondeadas.
const normal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="46" fill="#FF8A1F"/>
  <g transform="translate(0 14) rotate(-6 100 90)">${cara}</g>
</svg>`;

// Ícono "maskable": fondo naranja completo y la cara dentro de la zona segura,
// para que Android pueda recortarlo en círculo, gota o cuadro sin cortar la cara.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#FF8A1F"/>
  <g transform="translate(22 30) scale(0.78) rotate(-6 100 90)">${cara}</g>
</svg>`;

await mkdir('public/icons', { recursive: true });
await writeFile('public/favicon.svg', normal);

const render = (svg, size, file) =>
  sharp(Buffer.from(svg), { density: 600 }).resize(size, size).png().toFile(`public/icons/${file}`);

for (const s of [48, 72, 96, 128, 144, 152, 192, 256, 384, 512]) {
  await render(normal, s, `icon-${s}.png`);
}
for (const s of [192, 384, 512]) {
  await render(maskable, s, `maskable-${s}.png`);
}
await render(maskable, 180, 'apple-touch-icon.png');
console.log('Íconos generados en public/icons');
