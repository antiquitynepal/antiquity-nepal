import React, { useMemo } from 'react';
import QRCode from 'qrcode';
import {
  buildHeritageShareUrl,
  findHeritageSite,
  QRTargetId,
} from '../utils/heritageShare';

const QUIET_ZONE = 4;

interface QRMatrixInfo {
  size: number;
  data: Uint8Array | number[];
  centerStart: number;
  centerEnd: number;
}

function isInFinder(row: number, col: number, size: number): boolean {
  const topLeft = row < 7 && col < 7;
  const topRight = row < 7 && col >= size - 7;
  const bottomLeft = row >= size - 7 && col < 7;
  return topLeft || topRight || bottomLeft;
}

function isInFinderCore(row: number, col: number, size: number): boolean {
  const tl = row >= 2 && row <= 4 && col >= 2 && col <= 4;
  const tr = row >= 2 && row <= 4 && col >= size - 5 && col <= size - 3;
  const bl = row >= size - 5 && row <= size - 3 && col >= 2 && col <= 4;
  return tl || tr || bl;
}

export function computeQrMatrix(url: string): QRMatrixInfo {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const size = qr.modules.size;
  let boxModules = Math.max(5, Math.floor(size * 0.16));
  if (boxModules % 2 === 0) boxModules += 1;
  const centerStart = Math.floor((size - boxModules) / 2);
  const centerEnd = centerStart + boxModules - 1;
  return {
    size,
    data: qr.modules.data,
    centerStart,
    centerEnd,
  };
}

export function renderHeritageQrPlaqueCanvas(targetId: QRTargetId): HTMLCanvasElement {
  const targetUrl = buildHeritageShareUrl(targetId);
  const selectedSite = findHeritageSite(targetId);
  const matrix = computeQrMatrix(targetUrl);
  const totalSvgSize = matrix.size + QUIET_ZONE * 2;
  const centerCoord = totalSvgSize / 2;
  const crestBoxSize = matrix.centerEnd - matrix.centerStart + 1;

  const canvas = document.createElement('canvas');
  const width = 760;
  const height = 940;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Archival paper base
  ctx.fillStyle = '#F8F5F0';
  ctx.fillRect(0, 0, width, height);

  // Outer double border frame
  ctx.strokeStyle = '#1C1917';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  ctx.strokeStyle = '#9A3412';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(34, 34, width - 68, height - 68);

  // Top imprint text
  ctx.fillStyle = '#9A3412';
  ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("SURAJ GIRI'S KATHMANDU HERITAGE ATLAS", width / 2, 82);

  ctx.fillStyle = '#57534E';
  ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ANTIQUITY NEPAL · INSTANT HERITAGE QR PASS', width / 2, 106);

  // Title
  const heading = selectedSite ? selectedSite.name : 'Kathmandu Valley 360° Directory';
  const subheading = selectedSite
    ? `${selectedSite.nativeName} · ${selectedSite.district}`
    : 'All 7 UNESCO Monument Zones · Interactive Tours, Routes & Audio';

  ctx.fillStyle = '#1C1917';
  ctx.font = '600 32px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(heading, width / 2, 158);

  ctx.fillStyle = '#57534E';
  ctx.font = '400 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(subheading, width / 2, 186);

  // QR Frame Box
  const qrBoxSize = 520;
  const qrX = (width - qrBoxSize) / 2;
  const qrY = 222;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrX, qrY, qrBoxSize, qrBoxSize);
  ctx.strokeStyle = '#D6D3D1';
  ctx.lineWidth = 2;
  ctx.strokeRect(qrX, qrY, qrBoxSize, qrBoxSize);

  const modSize = qrBoxSize / totalSvgSize;
  for (let r = 0; r < matrix.size; r++) {
    for (let c = 0; c < matrix.size; c++) {
      const val = matrix.data[r * matrix.size + c];
      if (!val) continue;
      const inCenter =
        r >= matrix.centerStart &&
        r <= matrix.centerEnd &&
        c >= matrix.centerStart &&
        c <= matrix.centerEnd;
      if (inCenter) continue;

      const x = qrX + (c + QUIET_ZONE) * modSize;
      const y = qrY + (r + QUIET_ZONE) * modSize;

      if (isInFinder(r, c, matrix.size)) {
        ctx.fillStyle = isInFinderCore(r, c, matrix.size) ? '#1C1917' : '#9A3412';
      } else {
        ctx.fillStyle = '#1C1917';
      }
      ctx.fillRect(x, y, modSize + 0.35, modSize + 0.35);
    }
  }

  // Center Stupa Emblem
  const cX = qrX + centerCoord * modSize;
  const cY = qrY + centerCoord * modSize;
  const crestPx = (crestBoxSize - 0.8) * modSize;

  ctx.fillStyle = '#F8F5F0';
  ctx.fillRect(cX - crestPx / 2, cY - crestPx / 2, crestPx, crestPx);
  ctx.strokeStyle = '#9A3412';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(cX - crestPx / 2, cY - crestPx / 2, crestPx, crestPx);

  ctx.fillStyle = '#9A3412';
  ctx.beginPath();
  ctx.moveTo(cX, cY - crestPx * 0.32);
  ctx.lineTo(cX + crestPx * 0.24, cY + crestPx * 0.22);
  ctx.lineTo(cX - crestPx * 0.24, cY + crestPx * 0.22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1C1917';
  ctx.fillRect(cX - crestPx * 0.28, cY + crestPx * 0.22, crestPx * 0.56, crestPx * 0.09);

  // Footer scan instructions
  ctx.fillStyle = '#1C1917';
  ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'Scan with your phone camera to open immediately',
    width / 2,
    798
  );

  ctx.fillStyle = '#78716C';
  ctx.font = '400 13px "JetBrains Mono", monospace';
  const shortDisplay =
    targetUrl.length > 62 ? `${targetUrl.slice(0, 59)}…` : targetUrl;
  ctx.fillText(shortDisplay, width / 2, 830);

  ctx.fillStyle = '#9A3412';
  ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    '360° Virtual Tour · Arrival Routes · Historical Timeline · Audio Guide',
    width / 2,
    868
  );

  return canvas;
}

interface HeritageQRCodeSvgProps {
  url: string;
  label: string;
  className?: string;
}

export const HeritageQRCodeSvg: React.FC<HeritageQRCodeSvgProps> = ({
  url,
  label,
  className = 'w-full h-auto block',
}) => {
  const matrix = useMemo(() => computeQrMatrix(url), [url]);
  const totalSvgSize = matrix.size + QUIET_ZONE * 2;
  const centerCoord = totalSvgSize / 2;
  const crestBoxSize = matrix.centerEnd - matrix.centerStart + 1;

  return (
    <svg
      viewBox={`0 0 ${totalSvgSize} ${totalSvgSize}`}
      className={className}
      role="img"
      aria-label={label}
    >
      <rect width={totalSvgSize} height={totalSvgSize} fill="#F8F5F0" />
      {Array.from({ length: matrix.size }).map((_, r) =>
        Array.from({ length: matrix.size }).map((__, c) => {
          const val = matrix.data[r * matrix.size + c];
          if (!val) return null;
          const inCenter =
            r >= matrix.centerStart &&
            r <= matrix.centerEnd &&
            c >= matrix.centerStart &&
            c <= matrix.centerEnd;
          if (inCenter) return null;

          const finder = isInFinder(r, c, matrix.size);
          const core = finder && isInFinderCore(r, c, matrix.size);
          const fill = finder ? (core ? '#1C1917' : '#9A3412') : '#1C1917';

          return (
            <rect
              key={`${r}-${c}`}
              x={c + QUIET_ZONE}
              y={r + QUIET_ZONE}
              width={1.03}
              height={1.03}
              rx={finder ? 0 : 0.18}
              fill={fill}
            />
          );
        })
      )}

      {/* Center Temple Spire Crest inside Level-H Safe Cutout */}
      <g>
        <rect
          x={centerCoord - (crestBoxSize - 0.6) / 2}
          y={centerCoord - (crestBoxSize - 0.6) / 2}
          width={crestBoxSize - 0.6}
          height={crestBoxSize - 0.6}
          fill="#F8F5F0"
          stroke="#9A3412"
          strokeWidth={0.35}
          rx={0.4}
        />
        <polygon
          points={`${centerCoord},${
            centerCoord - (crestBoxSize - 1) * 0.34
          } ${centerCoord + (crestBoxSize - 1) * 0.28},${
            centerCoord + (crestBoxSize - 1) * 0.22
          } ${centerCoord - (crestBoxSize - 1) * 0.28},${
            centerCoord + (crestBoxSize - 1) * 0.22
          }`}
          fill="#9A3412"
        />
        <rect
          x={centerCoord - (crestBoxSize - 1) * 0.32}
          y={centerCoord + (crestBoxSize - 1) * 0.22}
          width={(crestBoxSize - 1) * 0.64}
          height={(crestBoxSize - 1) * 0.12}
          fill="#1C1917"
        />
      </g>
    </svg>
  );
};
