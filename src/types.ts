export type ModuleType = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'M4_GOAL';

export interface UserProgress {
  streak: number;
  scoreToday: number;
  subjectsToReview: string[];
  dailyGoalProgress: number;
  completedLessons: string[]; // IDs of finished lessons
  activeGoal: string | null;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  hint?: string;
}

export interface GameResult {
  score: number;
  correct: number;
  total: number;
  timeTaken: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  interval: number; // in days
  repetition: number;
  efactor: number;
  nextReview: number; // timestamp
}

export interface LearningStep {
  id: string;
  day: string;
  label: string;
  time: string;
  type: 'cours' | 'exo' | 'rev' | 'repos';
  moduleId: ModuleType;
  status: 'pending' | 'completed' | 'locked';
  difficulty?: number; // 0-5 for SM2
}
