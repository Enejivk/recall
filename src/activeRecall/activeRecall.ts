import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import doteenv from "dotenv";
import router from "express";
import { systemPrompt, testing } from "./systemPrompt";
import pool from "../db";

import { z } from "zod";

doteenv.config();

const questionItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
  hasCode: z.boolean().optional().default(false),
});

const questionSchema = z.object({
  questions: z.array(questionItemSchema).min(1),
});

type QuestionItem = z.infer<typeof questionItemSchema>;
type QuestionType = z.infer<typeof questionSchema>;

const route = router();

async function generateQuestions(text: string): Promise<QuestionType> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not defined in environment variables");
  }

  const llm = new ChatOpenAI({
    model: "gpt-5-chat-latest",
    temperature: 0,
    apiKey: apiKey,
  });

  const result = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(testing),
  ]);

  try {
    const questions: QuestionType = questionSchema.parse(
      JSON.parse(result.content as string)
    );
    return questions;
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new TypeError("Response does not match expected schema");
    }
    throw new SyntaxError("Invalid JSON format");
  }
}

function saveQuestionsToDB(questions: QuestionType, userId: string) {
  const values: (string | boolean | number)[] = [];
  const placeholders: string[] = [];

  questions.questions.forEach((question, index) => {
    const base = index * 4;
    values.push(question.question, question.answer, question.hasCode, userId);
    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`
    );
  });

  const insertQuery = `
    INSERT INTO questions (question, official_answer, has_code, user_id)
    VALUES ${placeholders.join(", ")}
    RETURNING id
  `;

  try {
    pool.query(insertQuery, values);
  } catch (error) {
    console.error("Error saving questions to DB:", error);
  }
}

route.post("/generate", async (req, res) => {
  const { text } = req.body;
  try {
    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }
    const questions = await generateQuestions(text);
    const userId = (req as any).user.id;
    saveQuestionsToDB(questions, userId);
    return res.status(200).json({ questions });
  } catch (error) {
    console.error("Error generating questions:", error);
    return res
      .status(500)
      .json({ message: "Error generating questions", error });
  }
});

export default route;