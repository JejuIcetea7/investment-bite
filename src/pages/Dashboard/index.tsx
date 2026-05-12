import { useMemo, type Dispatch, type SetStateAction } from 'react'
import type { MarketData, WatchItem, PropensityResult, KnowledgeCard, DailyQuiz, DashboardWidgetKey, HoverHelp } from '../../types'
import ChartSection from './ChartSection'
import NewsSummarySection from './NewsSummarySection'
import WatchlistSection from './WatchlistSection'
import PropensitySection from './PropensitySection'
import KnowledgeSection from './KnowledgeSection'
import QuizSection from './QuizSection'

export default function DashboardPage({
  marketData,
  dataSource,
  beginner,
  selectedWatchItem,
  propensityResult,
  analysisLoading,
  hiddenWidgets,
  dashboardEditMode,
  knowledgeCards,
  dailyQuizzes,
  dailyQuizIndex,
  selectedDailyAnswer,
  dailyQuizCorrectCount,
  setHoverHelp,
  setSelectedWatchItem,
  onNavigateToNews,
  onRestartSurvey,
  onToggleWidget,
  onRefreshKnowledge,
  onPickQuizAnswer,
  onNextQuiz,
  onRestartQuiz,
}: {
  marketData: MarketData
  dataSource: string
  beginner: boolean
  selectedWatchItem: WatchItem | null
  propensityResult: PropensityResult | null
  analysisLoading: boolean
  hiddenWidgets: DashboardWidgetKey[]
  dashboardEditMode: boolean
  knowledgeCards: KnowledgeCard[]
  dailyQuizzes: DailyQuiz[]
  dailyQuizIndex: number
  selectedDailyAnswer: number | null
  dailyQuizCorrectCount: number
  setHoverHelp: Dispatch<SetStateAction<HoverHelp | null>>
  setSelectedWatchItem: (item: WatchItem | null) => void
  onNavigateToNews: () => void
  onRestartSurvey: () => void
  onToggleWidget: (key: DashboardWidgetKey) => void
  onRefreshKnowledge: () => void
  onPickQuizAnswer: (index: number) => void
  onNextQuiz: () => void
  onRestartQuiz: () => void
}) {
  const displayChart = useMemo(() => {
    if (!selectedWatchItem) return marketData.chart
    return {
      symbol: selectedWatchItem.symbol,
      name: selectedWatchItem.name,
      currency: selectedWatchItem.symbol.endsWith('.KS') ? 'KRW' : 'USD',
      price: selectedWatchItem.price,
      change: selectedWatchItem.chg,
      percent: selectedWatchItem.chg,
      series: selectedWatchItem.series,
      stats: marketData.chart.stats,
      note: marketData.chart.note,
    }
  }, [selectedWatchItem, marketData.chart])

  const currentDailyQuiz = dailyQuizzes[dailyQuizIndex] ?? null
  const isDailyQuizComplete = dailyQuizzes.length > 0 && dailyQuizIndex >= dailyQuizzes.length
  const isDailyQuizAnswered = selectedDailyAnswer !== null
  const dailyQuizSolvedCount = Math.min(dailyQuizIndex + (isDailyQuizAnswered ? 1 : 0), dailyQuizzes.length)
  const dailyQuizProgress = dailyQuizzes.length > 0 ? (dailyQuizSolvedCount / dailyQuizzes.length) * 100 : 0

  return (
    <>
      <ChartSection
        displayChart={displayChart}
        marketStatus={marketData.marketStatus}
        dataSource={dataSource}
        beginner={beginner}
        setHoverHelp={setHoverHelp}
      />
      <NewsSummarySection onNavigateToNews={onNavigateToNews} />
      <WatchlistSection
        watchlist={marketData.watchlist}
        selectedWatchItem={selectedWatchItem}
        beginner={beginner}
        hiddenWidgets={hiddenWidgets}
        editMode={dashboardEditMode}
        onSelect={setSelectedWatchItem}
        onToggle={() => onToggleWidget('watch')}
      />
      <PropensitySection
        propensityResult={propensityResult}
        analysisLoading={analysisLoading}
        beginner={beginner}
        hiddenWidgets={hiddenWidgets}
        editMode={dashboardEditMode}
        onRestartSurvey={onRestartSurvey}
        onToggle={() => onToggleWidget('propensity')}
      />
      <KnowledgeSection
        knowledgeCards={knowledgeCards}
        beginner={beginner}
        hiddenWidgets={hiddenWidgets}
        editMode={dashboardEditMode}
        onRefresh={onRefreshKnowledge}
        onToggle={() => onToggleWidget('know')}
      />
      <QuizSection
        dailyQuizzes={dailyQuizzes}
        currentDailyQuiz={currentDailyQuiz}
        isDailyQuizComplete={isDailyQuizComplete}
        isDailyQuizAnswered={isDailyQuizAnswered}
        dailyQuizSolvedCount={dailyQuizSolvedCount}
        dailyQuizProgress={dailyQuizProgress}
        dailyQuizCorrectCount={dailyQuizCorrectCount}
        selectedDailyAnswer={selectedDailyAnswer}
        beginner={beginner}
        hiddenWidgets={hiddenWidgets}
        editMode={dashboardEditMode}
        onPickAnswer={onPickQuizAnswer}
        onNextQuiz={onNextQuiz}
        onRestart={onRestartQuiz}
        onToggle={() => onToggleWidget('quiz')}
      />
    </>
  )
}
