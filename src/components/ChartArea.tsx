import { useState } from 'react'

export default function ChartArea({
  data,
  isUp,
  onHover,
}: {
  data: number[]
  isUp?: boolean
  onHover?: (index: number | null, clientX: number, clientY: number) => void
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
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

  const gradientColor = isUp !== false ? '#ef4444' : '#3b82f6'
  const strokeColor = isUp !== false ? '#dc2626' : '#1d4ed8'

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let closestIndex = 0
    let closestDist = Infinity
    points.forEach(([px, py], idx) => {
      const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2)
      if (dist < closestDist) {
        closestDist = dist
        closestIndex = idx
      }
    })

    if (closestDist < 30) {
      setHoveredIndex(closestIndex)
      if (onHover) onHover(closestIndex, e.clientX, e.clientY)
    } else {
      setHoveredIndex(null)
      if (onHover) onHover(null, 0, 0)
    }
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
    if (onHover) onHover(null, 0, 0)
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: '100%' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <defs>
        <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={gradientColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((fraction) => (
        <line
          key={fraction}
          x1={padding}
          x2={width - padding}
          y1={height * fraction}
          y2={height * fraction}
          stroke="#ece9e2"
          strokeDasharray="3 4"
        />
      ))}
      <path d={fillPath} fill="url(#chartGrad)" />
      <path d={path} stroke={strokeColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r="5"
        fill={gradientColor}
        stroke={strokeColor}
        strokeWidth="2"
      />

      {hoveredIndex !== null && (
        <>
          <line x1={points[hoveredIndex][0]} x2={points[hoveredIndex][0]} y1={padding} y2={height - padding} stroke="#999" strokeDasharray="2 2" strokeWidth="1" />
          <circle cx={points[hoveredIndex][0]} cy={points[hoveredIndex][1]} r="6" fill={gradientColor} stroke="white" strokeWidth="2" />
        </>
      )}
    </svg>
  )
}
