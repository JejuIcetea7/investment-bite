import type { DailyQuiz, DashboardWidgetKey } from '../../types'
import EditableWidgetShell from '../../components/EditableWidgetShell'

export default function QuizSection({
  dailyQuizzes,
  currentDailyQuiz,
  isDailyQuizComplete,
  isDailyQuizAnswered,
  dailyQuizSolvedCount,
  dailyQuizProgress,
  dailyQuizCorrectCount,
  selectedDailyAnswer,
  beginner,
  hiddenWidgets,
  editMode,
  onPickAnswer,
  onNextQuiz,
  onRestart,
  onToggle,
}: {
  dailyQuizzes: DailyQuiz[]
  currentDailyQuiz: DailyQuiz | null
  isDailyQuizComplete: boolean
  isDailyQuizAnswered: boolean
  dailyQuizSolvedCount: number
  dailyQuizProgress: number
  dailyQuizCorrectCount: number
  selectedDailyAnswer: number | null
  beginner: boolean
  hiddenWidgets: DashboardWidgetKey[]
  editMode: boolean
  onPickAnswer: (index: number) => void
  onNextQuiz: () => void
  onRestart: () => void
  onToggle: () => void
}) {
  return (
    <EditableWidgetShell widgetKey="quiz" visible={!hiddenWidgets.includes('quiz')} editMode={editMode} onToggle={onToggle}>
      <section className="card" data-tour="quiz">
        <div className="card-head">
          <div className="card-head-left">
            <div className="card-num"><span className="card-num-dot">6</span> 투자 기초 퀴즈</div>
            <div className="card-title">데일리 챌린지</div>
            {beginner && <div className="card-sub">짧은 퀴즈로 경제 지식을 늘려보세요.</div>}
          </div>
          <span className="quiz-tag">
            {dailyQuizzes.length > 0 ? `${dailyQuizSolvedCount}/${dailyQuizzes.length}` : 'Loading'}
          </span>
        </div>
        {isDailyQuizComplete ? (
          <div className="quiz-complete">
            <div className="quiz-complete-label">데일리 챌린지 완료</div>
            <div className="quiz-complete-score">{dailyQuizCorrectCount}/{dailyQuizzes.length}</div>
            <div className="quiz-feedback-text">오늘의 투자 상식 퀴즈를 모두 풀었어요!</div>
            <button className="btn-primary quiz-next-btn" onClick={onRestart}>다시 풀기</button>
          </div>
        ) : currentDailyQuiz ? (
          <>
            <div className="quiz-meta">
              <span>{currentDailyQuiz.category}</span>
              <span>{currentDailyQuiz.type === 'ox' ? 'O/X' : '3지선다'}</span>
            </div>
            <div className="quiz-q">{currentDailyQuiz.question}</div>
            <div className="quiz-options">
              {currentDailyQuiz.options.map((option, index) => {
                const isCorrectAnswer = index === currentDailyQuiz.answerIndex
                const isSelectedWrong = selectedDailyAnswer === index && !isCorrectAnswer
                const optionLetter = currentDailyQuiz.type === 'ox' ? option : String.fromCharCode(65 + index)
                let className = 'quiz-opt'
                if (isDailyQuizAnswered && isCorrectAnswer) className += ' correct'
                if (isDailyQuizAnswered && isSelectedWrong) className += ' wrong'
                return (
                  <button
                    key={`${currentDailyQuiz.id}-${option}`}
                    className={className}
                    onClick={() => onPickAnswer(index)}
                    disabled={isDailyQuizAnswered}
                  >
                    <span className="quiz-opt-letter">{optionLetter}</span>
                    {option}
                  </button>
                )
              })}
            </div>
            {isDailyQuizAnswered && (
              <div className={`quiz-feedback ${selectedDailyAnswer === currentDailyQuiz.answerIndex ? 'correct' : 'wrong'}`}>
                <div className="quiz-feedback-title">
                  {selectedDailyAnswer === currentDailyQuiz.answerIndex ? '정답입니다' : '오답입니다'}
                </div>
                <div className="quiz-feedback-text">{currentDailyQuiz.explanation}</div>
                <button className="btn-primary quiz-next-btn" onClick={onNextQuiz}>다음 문제</button>
              </div>
            )}
          </>
        ) : (
          <div className="quiz-feedback">
            <div className="quiz-feedback-title">퀴즈를 불러오는 중입니다</div>
            <div className="quiz-feedback-text">잠시 후 다시 확인해주세요.</div>
          </div>
        )}
        <div className="quiz-progress">
          <span>오늘 진행</span>
          <div className="quiz-progress-track">
            <div className="quiz-progress-fill" style={{ width: `${dailyQuizProgress}%` }} />
          </div>
          <span>{dailyQuizSolvedCount}/{dailyQuizzes.length || 10}</span>
        </div>
      </section>
    </EditableWidgetShell>
  )
}
