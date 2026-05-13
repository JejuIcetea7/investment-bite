import { useMemo, useState } from 'react'
import type { DashboardWidgetKey, WatchItem, WatchStockQuiz } from '../../types'
import EditableWidgetShell from '../../components/EditableWidgetShell'
import { WATCH_STOCK_QUIZZES } from '../../data/watchStockQuizzes'

const hashText = (value: string) => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

const pickQuiz = (pool: WatchStockQuiz[], seed: number) => {
  if (pool.length === 0) return null
  const key = `${pool.map((quiz) => quiz.id).join('|')}::${seed}`
  return pool[hashText(key) % pool.length]
}

export default function WatchStockQuizSection({
  watchlist,
  beginner,
  hiddenWidgets,
  editMode,
  onToggle,
}: {
  watchlist: WatchItem[]
  beginner: boolean
  hiddenWidgets: DashboardWidgetKey[]
  editMode: boolean
  onToggle: () => void
}) {
  const [seed, setSeed] = useState(1)
  const [answersByQuizId, setAnswersByQuizId] = useState<Record<string, number>>({})

  const quizPool = useMemo(() => {
    const watchSymbols = new Set(watchlist.map((item) => item.symbol))
    return WATCH_STOCK_QUIZZES.filter((quiz) => watchSymbols.has(quiz.symbol))
  }, [watchlist])

  const currentQuiz = useMemo(() => pickQuiz(quizPool, seed), [quizPool, seed])
  const selectedAnswer = currentQuiz ? answersByQuizId[currentQuiz.id] : undefined
  const isAnswered = selectedAnswer !== undefined
  const watchlistNames = watchlist.map((item) => item.name).join(', ')

  const showNextQuiz = () => {
    setSeed((current) => {
      if (!currentQuiz || quizPool.length <= 1) return current + 1
      let nextSeed = current + 1
      while (pickQuiz(quizPool, nextSeed)?.id === currentQuiz.id) nextSeed += 1
      return nextSeed
    })
  }

  return (
    <EditableWidgetShell widgetKey="stockQuiz" visible={!hiddenWidgets.includes('stockQuiz')} editMode={editMode} onToggle={onToggle}>
      <section className="card stock-quiz-card" data-tour="stock-quiz">
        <div className="card-head">
          <div className="card-head-left">
            <div className="card-num"><span className="card-num-dot">📊</span> 내 종목 한입 상식</div>
            <div className="card-title">관심종목 랜덤 퀴즈</div>
            {beginner && <div className="card-sub">관심종목에 들어있는 종목의 쉬운 상식만 보여줘요.</div>}
          </div>
          <span className="quiz-tag">관심종목</span>
        </div>

        {currentQuiz ? (
          <>
            <div className="quiz-meta">
              <span>{currentQuiz.stockName}</span>
              <span>{currentQuiz.category}</span>
            </div>
            <div className="quiz-q">{currentQuiz.question}</div>
            <div className="quiz-options">
              {currentQuiz.options.map((option, index) => {
                const isCorrectAnswer = index === currentQuiz.answerIndex
                const isSelectedWrong = selectedAnswer === index && !isCorrectAnswer
                const optionText = option === 'O' ? '맞아요' : option === 'X' ? '아니에요' : option
                let className = 'quiz-opt'
                if (isAnswered && isCorrectAnswer) className += ' correct'
                if (isAnswered && isSelectedWrong) className += ' wrong'
                return (
                  <button
                    key={`${currentQuiz.id}-${option}`}
                    className={className}
                    onClick={() => setAnswersByQuizId((current) => ({ ...current, [currentQuiz.id]: index }))}
                    disabled={isAnswered}
                  >
                    <span className="quiz-opt-letter">{option}</span>
                    {optionText}
                  </button>
                )
              })}
            </div>
            {isAnswered && (
              <div className={`quiz-feedback ${selectedAnswer === currentQuiz.answerIndex ? 'correct' : 'wrong'}`}>
                <div className="quiz-feedback-title">
                  {selectedAnswer === currentQuiz.answerIndex ? '정답입니다' : '오답입니다'}
                </div>
                <div className="quiz-feedback-text">{currentQuiz.explanation}</div>
              </div>
            )}
            <button className="btn-primary quiz-next-btn" onClick={showNextQuiz}>다른 문제 보기</button>
          </>
        ) : (
          <div className="stock-quiz-empty">
            <div className="quiz-feedback-title">관심종목 퀴즈가 없습니다</div>
            <div className="quiz-feedback-text">
              현재 관심종목: {watchlistNames || '없음'}<br />
              프로토타입 퀴즈가 준비된 종목을 관심종목에 추가하면 바로 표시됩니다.
            </div>
          </div>
        )}
      </section>
    </EditableWidgetShell>
  )
}
