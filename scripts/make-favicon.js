const fs = require('fs');
const path = require('path');

// 1. Create the SVG content
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
    <linearGradient id="border" x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.22)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.05)" />
    </linearGradient>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="32" height="32" rx="7.5" fill="url(#bg)" />
  <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="6.75" stroke="url(#border)" stroke-width="1.5" />

  <!-- Vault safe icon -->
  <g transform="translate(4, 4)" stroke="#f4f4f5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <!-- Safe door body -->
    <rect width="17" height="17" x="3.5" y="3.5" rx="3" />
    
    <!-- 4 corner rivets / bolts -->
    <circle cx="7.5" cy="7.5" r="0.8" fill="#f4f4f5" stroke="none" />
    <circle cx="16.5" cy="7.5" r="0.8" fill="#f4f4f5" stroke="none" />
    <circle cx="7.5" cy="16.5" r="0.8" fill="#f4f4f5" stroke="none" />
    <circle cx="16.5" cy="16.5" r="0.8" fill="#f4f4f5" stroke="none" />

    <!-- Dial spoke handles -->
    <path d="m8.2 8.2 2.3 2.3" />
    <path d="m13.5 10.5 2.3-2.3" />
    <path d="m8.2 15.8 2.3-2.3" />
    <path d="m13.5 13.5 2.3 2.3" />

    <!-- Center combination dial wheel -->
    <circle cx="12" cy="12" r="2.25" fill="#18181b" stroke="#f4f4f5" stroke-width="1.75" />
    <!-- Center spindle dot -->
    <circle cx="12" cy="12" r="0.75" fill="#f4f4f5" stroke="none" />
  </g>
</svg>`;

// Write app/icon.svg and public/icon.svg
const appIconSvgPath = path.join(__dirname, '..', 'app', 'icon.svg');
const publicIconSvgPath = path.join(__dirname, '..', 'public', 'icon.svg');
fs.writeFileSync(appIconSvgPath, svgContent);
fs.writeFileSync(publicIconSvgPath, svgContent);
console.log('Wrote app/icon.svg and public/icon.svg');

// 2. Generate a 32x32 32-bit ICO file
function createVaultIco() {
  const width = 32;
  const height = 32;

  // Create pixel canvas (x, y) -> [r, g, b, a]
  const pixels = Array.from({ length: height }, () => 
    Array.from({ length: width }, () => [0, 0, 0, 0])
  );

  function setPixel(x, y, r, g, b, a) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const existing = pixels[y][x];
      const alpha = a / 255;
      pixels[y][x] = [
        Math.round(r * alpha + existing[0] * (1 - alpha)),
        Math.round(g * alpha + existing[1] * (1 - alpha)),
        Math.round(b * alpha + existing[2] * (1 - alpha)),
        Math.max(existing[3], a),
      ];
    }
  }

  function drawCircle(cx, cy, r, fill, stroke, strokeWidth = 1) {
    for (let y = Math.floor(cy - r - 2); y <= Math.ceil(cy + r + 2); y++) {
      for (let x = Math.floor(cx - r - 2); x <= Math.ceil(cx + r + 2); x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (fill && d <= r) {
          setPixel(x, y, fill[0], fill[1], fill[2], fill[3]);
        }
        if (stroke && Math.abs(d - r) <= strokeWidth / 2) {
          setPixel(x, y, stroke[0], stroke[1], stroke[2], stroke[3]);
        }
      }
    }
  }

  function drawLine(x0, y0, x1, y1, color) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let currX = x0;
    let currY = y0;
    while (true) {
      setPixel(currX, currY, color[0], color[1], color[2], color[3]);
      if (currX === x1 && currY === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; currX += sx; }
      if (e2 < dx) { err += dx; currY += sy; }
    }
  }

  // Draw Squircle Background
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Rounded rect check (radius 7)
      const r = 7;
      let inRect = false;
      if (x >= r && x < width - r) inRect = true;
      else if (y >= r && y < height - r) inRect = true;
      else {
        const cx = x < r ? r : width - 1 - r;
        const cy = y < r ? r : height - 1 - r;
        if (Math.hypot(x - cx, y - cy) <= r) inRect = true;
      }

      if (inRect) {
        // gradient dark background
        const t = (x + y) / (width + height);
        const bgVal = Math.round(24 * (1 - t) + 12 * t);
        setPixel(x, y, bgVal, bgVal, bgVal + 2, 255);
      }
    }
  }

  // Draw Squircle border
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = 7;
      const cornerX = x < r ? r : x >= width - r ? width - 1 - r : null;
      const cornerY = y < r ? r : y >= height - r ? height - 1 - r : null;
      let isBorder = false;
      if (cornerX !== null && cornerY !== null) {
        const dist = Math.hypot(x - cornerX, y - cornerY);
        if (dist >= r - 1 && dist <= r) isBorder = true;
      } else if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        isBorder = true;
      }
      if (isBorder && pixels[y][x][3] > 0) {
        setPixel(x, y, 70, 72, 78, 255);
      }
    }
  }

  // Safe door outer frame: x: 7 to 24, y: 7 to 24 (size 18x18)
  const white = [245, 245, 247, 255];
  const darkCenter = [20, 20, 22, 255];

  // Draw safe door border with rounded corners
  for (let x = 9; x <= 22; x++) {
    setPixel(x, 7, ...white);
    setPixel(x, 24, ...white);
  }
  for (let y = 9; y <= 22; y++) {
    setPixel(7, y, ...white);
    setPixel(24, y, ...white);
  }
  // corners
  setPixel(8, 8, ...white);
  setPixel(23, 8, ...white);
  setPixel(8, 23, ...white);
  setPixel(23, 23, ...white);

  // 4 corner bolts
  drawCircle(10, 10, 1, white, null);
  drawCircle(21, 10, 1, white, null);
  drawCircle(10, 21, 1, white, null);
  drawCircle(21, 21, 1, white, null);

  // 4 diagonal spokes
  drawLine(11, 11, 13, 13, white);
  drawLine(20, 11, 18, 13, white);
  drawLine(11, 20, 13, 18, white);
  drawLine(20, 20, 18, 18, white);

  // Center combination dial
  drawCircle(15.5, 15.5, 3.2, darkCenter, white, 1.2);
  // Center spindle dot
  drawCircle(15.5, 15.5, 0.8, white, null);

  // Assemble ICO buffer
  const imageSize = 40 + width * height * 4 + (width * height) / 8;
  const totalSize = 22 + imageSize;
  const buf = Buffer.alloc(totalSize);

  // 1. ICONDIR
  buf.writeUInt16LE(0, 0); // Reserved
  buf.writeUInt16LE(1, 2); // Type = 1 (ICO)
  buf.writeUInt16LE(1, 4); // Count = 1

  // 2. ICONDIRENTRY
  buf.writeUInt8(width, 6); // Width
  buf.writeUInt8(height, 7); // Height
  buf.writeUInt8(0, 8); // Color count
  buf.writeUInt8(0, 9); // Reserved
  buf.writeUInt16LE(1, 10); // Color planes
  buf.writeUInt16LE(32, 12); // Bits per pixel
  buf.writeUInt32LE(imageSize, 14); // Size of image data
  buf.writeUInt32LE(22, 18); // Offset to image data

  // 3. BITMAPINFOHEADER
  let offset = 22;
  buf.writeUInt32LE(40, offset); // biSize
  buf.writeInt32LE(width, offset + 4); // biWidth
  buf.writeInt32LE(height * 2, offset + 8); // biHeight (must be 2x for ICO XOR+AND mask)
  buf.writeUInt16LE(1, offset + 12); // biPlanes
  buf.writeUInt16LE(32, offset + 14); // biBitCount
  buf.writeUInt32LE(0, offset + 16); // biCompression = BI_RGB
  buf.writeUInt32LE(width * height * 4, offset + 20); // biSizeImage
  buf.writeInt32LE(0, offset + 24); // biXPelsPerMeter
  buf.writeInt32LE(0, offset + 28); // biYPelsPerMeter
  buf.writeUInt32LE(0, offset + 32); // biClrUsed
  buf.writeUInt32LE(0, offset + 36); // biClrImportant
  offset += 40;

  // 4. XOR mask (BGRA, bottom-to-top)
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixels[y][x];
      buf.writeUInt8(b, offset++);
      buf.writeUInt8(g, offset++);
      buf.writeUInt8(r, offset++);
      buf.writeUInt8(a, offset++);
    }
  }

  // 5. AND mask (1 bit per pixel, bottom-to-top)
  for (let y = height - 1; y >= 0; y--) {
    let rowByte = 0;
    let bitCount = 0;
    for (let x = 0; x < width; x++) {
      const a = pixels[y][x][3];
      const bit = a === 0 ? 1 : 0;
      rowByte = (rowByte << 1) | bit;
      bitCount++;
      if (bitCount === 8) {
        buf.writeUInt8(rowByte, offset++);
        rowByte = 0;
        bitCount = 0;
      }
    }
  }

  return buf;
}

const icoBuffer = createVaultIco();
const appFaviconIcoPath = path.join(__dirname, '..', 'app', 'favicon.ico');
const publicFaviconIcoPath = path.join(__dirname, '..', 'public', 'favicon.ico');
fs.writeFileSync(appFaviconIcoPath, icoBuffer);
fs.writeFileSync(publicFaviconIcoPath, icoBuffer);
console.log('Wrote app/favicon.ico and public/favicon.ico');

