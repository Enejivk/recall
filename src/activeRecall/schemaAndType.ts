import { z } from "zod";

export const questionItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
  hasCode: z.boolean().optional().default(false),
});

// schema for question from db or cach
export const questionItemFromDb = z.object({
  id: z.string(),
  question: z.string(),
  official_answer: z.string(),
  has_code: z.boolean(),
  number_of_seen: z.number(),
  user_id: z.string(),
});

export const feedbackData = z.object({
  questionId: z.string(),
  userAnswer: z.string(),
});

export const questionFromDb = z.array(questionItemFromDb);
export type QuestionItemFromDb = z.infer<typeof questionItemFromDb>;
export const questionSchema = z.array(questionItemSchema).min(1);
export type QuestionType = z.infer<typeof questionSchema>;
