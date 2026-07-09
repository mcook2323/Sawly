interface TablePreviewProps {
  length: number;
  width: number;
  height: number;
}

export function TablePreview({ length, width, height }: TablePreviewProps) {
  const previewWidth = Math.min(520, Math.max(260, length * 5));
  const previewHeight = Math.min(260, Math.max(140, height * 7));
  const topDepth = Math.min(120, Math.max(60, width * 2));

  return (
    <div className="flex h-full min-h-96 items-center justify-center rounded-2xl bg-neutral-800 p-8">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 640 420"
        className="max-h-[420px]"
      >
        <g transform="translate(70 70)">
          <polygon
            points={`0,${topDepth} 90,0 ${previewWidth},0 ${
              previewWidth - 90
            },${topDepth}`}
            fill="none"
            stroke="white"
            strokeWidth="4"
          />

          <line
            x1="0"
            y1={topDepth}
            x2="0"
            y2={topDepth + previewHeight}
            stroke="white"
            strokeWidth="4"
          />

          <line
            x1={previewWidth - 90}
            y1={topDepth}
            x2={previewWidth - 90}
            y2={topDepth + previewHeight}
            stroke="white"
            strokeWidth="4"
          />

          <line
            x1="90"
            y1="0"
            x2="90"
            y2={previewHeight}
            stroke="white"
            strokeWidth="4"
            opacity="0.5"
          />

          <line
            x1={previewWidth}
            y1="0"
            x2={previewWidth}
            y2={previewHeight}
            stroke="white"
            strokeWidth="4"
            opacity="0.5"
          />

          <text x="0" y={topDepth + previewHeight + 35} fill="white">
            Length: {length}"
          </text>

          <text x={previewWidth - 120} y={topDepth + previewHeight + 35} fill="white">
            Width: {width}"
          </text>

          <text x={previewWidth + 20} y={topDepth + previewHeight / 2} fill="white">
            Height: {height}"
          </text>
        </g>
      </svg>
    </div>
  );
}