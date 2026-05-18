type SparklineProps = {
  data: number[]
  className?: string
  stroke?: string
}

export function Sparkline({
  data,
  className,
  stroke = 'currentColor',
}: SparklineProps) {
  const width = 100
  const height = 28

  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 4) - 2
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const lastX = width
  const lastY =
    height - ((data[data.length - 1] - min) / range) * (height - 4) - 2

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r="1.6" fill={stroke} />
    </svg>
  )
}
