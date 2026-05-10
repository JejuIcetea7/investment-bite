export default function ChartArea({ data }: { data: number[] }) {
  const width = 720
  const height = 220
  const padding = 6
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2)
    const y = padding + (1 - (value - min) / range) * (height - padding * 2)
    return [x, y] as const
  })

  const path = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const fillPath = `${path} L${width - padding},${height - padding} L${padding},${height - padding} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#facc18" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#facc18" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((fraction) => (
        <line key={fraction} x1={padding} x2={width - padding} y1={height * fraction} y2={height * fraction} stroke="#ece9e2" strokeDasharray="3 4" />
      ))}
      <path d={fillPath} fill="url(#chartGrad)" />
      <path d={path} stroke="#3a2204" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="5" fill="#facc18" stroke="#3a2204" strokeWidth="2" />
    </svg>
  )
}
