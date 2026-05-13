export default function Sparkline({ data }: { data: number[] }) {
  const width = 92
  const height = 34
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const path = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="spark-line" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
