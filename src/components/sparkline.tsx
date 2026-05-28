// Inline SVG sparkline — no JS on the client, no chart library.
// Institutional aesthetic: one line, no fill, no animation, faint axis.

interface Point {
  x: number; // numeric position (e.g. year)
  y: number; // value
}

export function Sparkline({
  data,
  width = 480,
  height = 120,
  ariaLabel,
}: {
  data: Point[];
  width?: number;
  height?: number;
  ariaLabel?: string;
}) {
  if (data.length < 2) {
    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-ink-mute)",
          fontFamily: "var(--font-sans)",
          fontSize: 12,
        }}
      >
        Not enough data points
      </div>
    );
  }

  const padX = 24;
  const padY = 16;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || Math.abs(yMin) || 1;

  const px = (x: number) => padX + ((x - xMin) / xSpan) * innerW;
  const py = (y: number) => padY + innerH - ((y - yMin) / ySpan) * innerH;

  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${px(d.x).toFixed(2)} ${py(d.y).toFixed(2)}`)
    .join(" ");

  const last = data[data.length - 1];
  const first = data[0];

  // Y-axis tick at min and max
  const yTicks = [yMax, yMin];

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      style={{ display: "block" }}
    >
      {/* faint x-axis baseline */}
      <line
        x1={padX}
        y1={py(yMin)}
        x2={width - padX}
        y2={py(yMin)}
        stroke="var(--color-rule)"
        strokeWidth={1}
      />
      {/* y ticks */}
      {yTicks.map((y, i) => (
        <g key={i}>
          <line
            x1={padX}
            y1={py(y)}
            x2={width - padX}
            y2={py(y)}
            stroke="var(--color-rule-soft)"
            strokeWidth={1}
            strokeDasharray={i === 1 ? "0" : "2 3"}
          />
          <text
            x={padX - 4}
            y={py(y) + 3}
            textAnchor="end"
            fontSize="9"
            fill="var(--color-ink-mute)"
            fontFamily="var(--font-sans)"
          >
            {Math.abs(y) >= 1_000_000_000
              ? `${(y / 1_000_000_000).toFixed(1)}B`
              : Math.abs(y) >= 1_000_000
                ? `${(y / 1_000_000).toFixed(1)}M`
                : Math.abs(y) >= 1_000
                  ? `${(y / 1_000).toFixed(1)}k`
                  : y.toFixed(2)}
          </text>
        </g>
      ))}
      {/* x axis end labels */}
      <text
        x={padX}
        y={height - 3}
        fontSize="9"
        fill="var(--color-ink-mute)"
        fontFamily="var(--font-sans)"
      >
        {first.x}
      </text>
      <text
        x={width - padX}
        y={height - 3}
        textAnchor="end"
        fontSize="9"
        fill="var(--color-ink-mute)"
        fontFamily="var(--font-sans)"
      >
        {last.x}
      </text>
      {/* the series */}
      <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth={1.5} />
      {/* last point marker */}
      <circle
        cx={px(last.x)}
        cy={py(last.y)}
        r={2.5}
        fill="var(--color-accent)"
      />
    </svg>
  );
}
