export interface Answer {
  id: number;
  text: string;
}

export interface Question {
  id: number;
  text: string;
  image?: string;
  answers: Answer[];
  correctAnswerId: number;
  explanation?: string;
  category?: string;
}

export interface UserAnswer {
  questionId: number;
  answerId: number;
  isCorrect: boolean;
}
