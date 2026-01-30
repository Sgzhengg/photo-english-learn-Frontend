// =============================================================================
// PhotoEnglish - Practice & Review Page
// =============================================================================

import { useState } from 'react';
import { DailyTaskHome } from '@/sections/practice-review/components/DailyTaskHome';
import { ReviewSchedule } from '@/sections/practice-review/components/ReviewSchedule';
import { WrongAnswersReview } from '@/sections/practice-review/components/WrongAnswersReview';
import { ProgressStats as ProgressStatsView } from '@/sections/practice-review/components/ProgressStats';
import practiceData from '@/../product/sections/practice-review/data.json';

// Use the types from the product design
import type { DailyTask, ProgressStats } from '@/../product/sections/practice-review/types';

type PracticeView = 'home' | 'review-schedule' | 'wrong-answers' | 'progress-stats';

export function PracticeReviewPage() {
  const [currentView, setCurrentView] = useState<PracticeView>('home');
  const [currentWrongIndex, setCurrentWrongIndex] = useState(0);

  // Get data from mock data - use type assertions for JSON data
  const dailyTask = practiceData.dailyTask as DailyTask;
  const progressStats = practiceData.progressStats as ProgressStats;
  const wrongAnswersQueue = practiceData.wrongAnswersQueue as any[];
  const reviewSchedule = practiceData.reviewSchedule as any[];

  // Event handlers
  const handleStartPractice = () => {
    // Navigate to practice questions view
    setCurrentView('practice-questions' as PracticeView);
  };

  const handleViewReviewSchedule = () => {
    setCurrentView('review-schedule');
  };

  const handleReviewWrongAnswers = () => {
    setCurrentIndex(0);
    setCurrentView('wrong-answers');
  };

  const handleViewProgressStats = () => {
    // Navigate to progress dashboard page
    window.location.href = '/app/progress';
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  const handleReviewWrongAnswer = (_wordId: string, correct: boolean) => {
    // Move to next wrong answer
    if (correct && currentWrongIndex < wrongAnswersQueue.length - 1) {
      setCurrentWrongIndex(currentWrongIndex + 1);
    }
  };

  const setCurrentIndex = (index: number) => {
    setCurrentWrongIndex(index);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {currentView === 'home' && (
        <DailyTaskHome
          dailyTask={dailyTask}
          progressStats={progressStats}
          wrongAnswersCount={wrongAnswersQueue.length}
          onStartPractice={handleStartPractice}
          onViewReviewSchedule={handleViewReviewSchedule}
          onViewProgressStats={handleViewProgressStats}
          onReviewWrongAnswers={handleReviewWrongAnswers}
        />
      )}

      {currentView === 'review-schedule' && (
        <ReviewSchedule
          reviewSchedule={reviewSchedule}
          onBackToHome={handleBackToHome}
        />
      )}

      {currentView === 'wrong-answers' && (
        <WrongAnswersReview
          wrongAnswersQueue={wrongAnswersQueue}
          currentWrongIndex={currentWrongIndex}
          onReviewWrongAnswer={handleReviewWrongAnswer}
          onBackToHome={handleBackToHome}
        />
      )}

      {currentView === 'progress-stats' && (
        <ProgressStatsView
          progressStats={progressStats}
          onBackToHome={handleBackToHome}
        />
      )}
    </div>
  );
}
