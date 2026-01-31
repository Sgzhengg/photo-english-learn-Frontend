// =============================================================================
// PhotoEnglish - Practice & Review Page
// =============================================================================

import { useState } from 'react';
import { DailyTaskHome } from '@/sections/practice-review/components/DailyTaskHome';
import { ReviewSchedule } from '@/sections/practice-review/components/ReviewSchedule';
import { WrongAnswersReview } from '@/sections/practice-review/components/WrongAnswersReview';
import { ProgressStats as ProgressStatsView } from '@/sections/practice-review/components/ProgressStats';
import { PracticeQuestionView } from '@/sections/practice-review/components/PracticeQuestionView';
import { PracticeResultSummary } from '@/sections/practice-review/components/PracticeResultSummary';
import practiceData from '@/../product/sections/practice-review/data.json';

// Use the types from the product design
import type { DailyTask, ProgressStats, PracticeQuestion } from '@/../product/sections/practice-review/types';

type PracticeView = 'home' | 'practice-questions' | 'practice-results' | 'review-schedule' | 'wrong-answers' | 'progress-stats';

export function PracticeReviewPage() {
  const [currentView, setCurrentView] = useState<PracticeView>('home');
  const [currentWrongIndex, setCurrentWrongIndex] = useState(0);

  // Practice questions state
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<string, string>>(new Map());
  const [practiceResult, setPracticeResult] = useState<any | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Get data from mock data - use type assertions for JSON data
  const dailyTask = practiceData.dailyTask as DailyTask;
  const progressStats = practiceData.progressStats as ProgressStats;
  const wrongAnswersQueue = practiceData.wrongAnswersQueue as any[];
  const reviewSchedule = practiceData.reviewSchedule as any[];
  const sampleQuestions = practiceData.sampleQuestions as PracticeQuestion[];

  // Event handlers
  const handleStartPractice = () => {
    // Initialize practice questions
    setQuestions(sampleQuestions.slice(0, 10)); // Take first 10 questions
    setCurrentQuestionIndex(0);
    setUserAnswers(new Map());
    setPracticeResult(null);
    setCurrentView('practice-questions');
  };

  const handleSubmitAnswer = (questionId: string, answer: string) => {
    const newAnswers = new Map(userAnswers);
    newAnswers.set(questionId, answer);
    setUserAnswers(newAnswers);

    // Auto-advance to next question after submitting
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // All questions answered, show results
        handleCompletePractice();
      }
    }, 1600); // Wait for feedback to show (1.5s) + small buffer
  };

  const handleSkipQuestion = (_questionId: string) => {
    // Skip to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, show results
      handleCompletePractice();
    }
  };

  const handlePlayAudio = (_audioUrl: string) => {
    // Mock audio playback
    setIsPlayingAudio(true);
    setTimeout(() => setIsPlayingAudio(false), 2000);
  };

  const handleStopAudio = () => {
    setIsPlayingAudio(false);
  };

  const handleCompletePractice = () => {
    // Calculate results
    const correctCount = Array.from(userAnswers.entries()).filter(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      return question && question.correctAnswer === answer;
    }).length;

    // Build wrong answers list
    const wrongAnswers = Array.from(userAnswers.entries())
      .filter(([questionId, answer]) => {
        const question = questions.find(q => q.id === questionId);
        return question && question.correctAnswer !== answer;
      })
      .map(([questionId, answer]) => {
        const question = questions.find(q => q.id === questionId);
        return {
          questionId,
          userAnswer: answer,
          correctAnswer: question?.correctAnswer || '',
          wordId: question?.wordId || '',
        };
      });

    const result = {
      id: `practice-${Date.now()}`,
      taskId: dailyTask.id,
      completedAt: new Date().toISOString(),
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      score: Math.round((correctCount / questions.length) * 100),
      accuracy: correctCount / questions.length,
      durationSeconds: Math.floor(Math.random() * 300) + 60,
      wrongAnswers,
    };

    setPracticeResult(result);
    setCurrentView('practice-results');
  };

  const handleRestartPractice = () => {
    handleStartPractice();
  };

  const handleBackToHomeFromResults = () => {
    setPracticeResult(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers(new Map());
    setCurrentView('home');
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

      {currentView === 'practice-questions' && questions.length > 0 && (
        <PracticeQuestionView
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          userAnswers={userAnswers}
          isPlayingAudio={isPlayingAudio}
          onSubmitAnswer={handleSubmitAnswer}
          onSkipQuestion={handleSkipQuestion}
          onPlayAudio={handlePlayAudio}
          onStopAudio={handleStopAudio}
        />
      )}

      {currentView === 'practice-results' && practiceResult && (
        <PracticeResultSummary
          practiceResult={practiceResult}
          questions={questions}
          onRestartPractice={handleRestartPractice}
          onBackToHome={handleBackToHomeFromResults}
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
