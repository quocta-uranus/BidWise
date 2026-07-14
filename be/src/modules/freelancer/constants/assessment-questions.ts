export interface AssessmentQuestionDef {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  type: 'mcq' | 'coding';
}

export const ASSESSMENT_QUESTIONS: AssessmentQuestionDef[] = [
  {
    id: 'q1',
    type: 'mcq',
    question:
      'Which React Hook memoizes computed values to optimize performance?',
    options: ['useEffect', 'useCallback', 'useMemo', 'useRef'],
    correctIndex: 2,
  },
  {
    id: 'q2',
    type: 'mcq',
    question: 'What is the main difference between "==" and "===" in JavaScript?',
    options: [
      '"==" compares types, "===" compares values only',
      '"===" compares both type and value, "==" coerces types before comparing',
      'There is no difference',
      '"==" is for strings, "===" is for numbers',
    ],
    correctIndex: 1,
  },
  {
    id: 'q3',
    type: 'mcq',
    question: 'What is the result of `typeof null`?',
    options: ['"null"', '"undefined"', '"object"', '"function"'],
    correctIndex: 2,
  },
  {
    id: 'q4',
    type: 'mcq',
    question: 'How do you pass data from a child component to a parent in React?',
    options: [
      'Redux is required',
      'Pass a callback from parent to child as a prop, then invoke it from the child',
      'Use localStorage',
      'React does not support upward data flow',
    ],
    correctIndex: 1,
  },
  {
    id: 'q5',
    type: 'mcq',
    question: 'What mechanism do async/await in JavaScript build upon?',
    options: ['Call stack', 'Promises', 'Generators & Promises', 'Multithreading'],
    correctIndex: 2,
  },
  {
    id: 'q6',
    type: 'coding',
    question: 'What is the output of `[1, 2, 3].map((x) => x * 2).join("-")`?',
    options: ['"1-2-3"', '"2-4-6"', '"6"', '"123"'],
    correctIndex: 1,
  },
];

export function resolveAssessmentLevel(score: number): string {
  if (score >= 5) return 'Expert';
  if (score >= 3) return 'Intermediate';
  return 'Beginner';
}

export function gradeAssessment(
  answers: Record<string, number>,
  questions: AssessmentQuestionDef[] = ASSESSMENT_QUESTIONS,
): {
  score: number;
  maxScore: number;
  level: string;
  breakdown: Array<{ questionId: string; correct: boolean }>;
} {
  const breakdown = questions.map((q) => ({
    questionId: q.id,
    correct: answers[q.id] === q.correctIndex,
  }));
  const score = breakdown.filter((b) => b.correct).length;
  return {
    score,
    maxScore: questions.length,
    level: resolveAssessmentLevel(score),
    breakdown,
  };
}
