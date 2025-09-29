import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import doteenv from "dotenv";
import router from "express";
import { systemPrompt, testing, feedbackSystemPrompt } from "./systemPrompt";
import pool from "../db";
import { z, ZodError } from "zod";
import Cache from "../catch";
import { questionSchema, feedbackData, questionFromDb } from "./schemaAndType";
import type { QuestionItemFromDb, QuestionType } from "./schemaAndType";

doteenv.config();

const route = router();

// generate the configuration for the ai
function getAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not defined in environment variables");
  }
  return new ChatOpenAI({
    model: "gpt-5-chat-latest",
    temperature: 0,
    apiKey: apiKey,
  });
}

// generate the question from the ai p
async function generateQuestions(text: string): Promise<QuestionType> {
  const llm = getAiConfig();
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

async function getSpecificQuestionFromCache(
  userId: string,
  questionId: string
): Promise<QuestionItemFromDb> {
  try {
    const questions: QuestionItemFromDb[] = await Cache.get(
      `${userId}questions`
    );
    questionFromDb.parse(questions);
    return questions.find(
      (question) => question.id === questionId
    ) as QuestionItemFromDb;
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(error);
      throw new Error("Error getting Question from Cache");
    }
    throw error;
  }
}

async function saveAnswerToDb(
  questionId: string,
  userId: string,
  userAnswer: string,
  feedback: string
) {
  const query = `
    INSERT INTO answers (question_id, user_id, user_answer, feedback)
    VALUES ($1, $2, $3, $4)
  `;
  const values = [questionId, userId, userAnswer, feedback];

  try {
    await pool.query(query, values);
  } catch (error) {
    throw new Error("Error saving answer to the database: " + error);
  }
}

async function generateFeedBack(
  userId: string,
  questionId: string,
  userAnswer: string
) {
  const llm = getAiConfig();

  const question = await getSpecificQuestionFromCache(userId, questionId);

  const prompt = `the question that was ask is ${question.question}
  and the correct answer is ${question.official_answer} and if it has code ${question.has_code}
  and the answer provided by the user was ${userAnswer}
  `;

  try {
    const feedback = await llm.invoke([
      new SystemMessage(feedbackSystemPrompt),
      new HumanMessage(prompt),
    ]);

    saveAnswerToDb(questionId, userId, userAnswer, feedback.content as string);
    return feedback.content;
  } catch (error) {
    throw new Error("There was an error trying to get the feedback");
  }
}

async function saveQuestionsToDB(questions: QuestionType, userId: string) {
  const values: (string | boolean | number)[] = [];
  const placeholders: string[] = [];

  questions.forEach((question, index) => {
    const base = index * 4;
    values.push(question.question, question.answer, question.hasCode, userId);
    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`
    );
  });
  const insertQuery = `
    INSERT INTO questions (question, official_answer, has_code, user_id)
    VALUES ${placeholders.join(", ")}
  `;

  try {
    await pool.query(insertQuery, values);
  } catch (error) {
    throw new Error("Error saving questions to the database: " + error);
  }
}

async function getQuestion(userId: string): Promise<QuestionItemFromDb[]> {
  const data = await pool.query(
    `SELECT id, question, official_answer, has_code, number_of_seen, user_id FROM questions
    WHERE user_id = $1 `,
    [userId]
  );
  return data.rows as QuestionItemFromDb[];
}

route.post("/generate", async (req, res) => {
  const { text } = req.body;
  try {
    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }
    const questions = await generateQuestions(text);
    const userId = (req as any).user.id;
    await saveQuestionsToDB(questions, userId);
    return res.json({ message: "Question created successfully" });
  } catch (error) {
    console.error("Error generating questions:", error);
    return res
      .status(500)
      .json({ message: "Error generating questions", error });
  }
});

route.get("/", async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const questions = await getQuestion(userId);
    Cache.set(`${userId}questions`, questions);
    const userQuestions = questions.map(
      ({ user_id, number_of_seen, official_answer, ...rest }) => rest
    );
    console.log("user message", userQuestions);
    return res.json(userQuestions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return res.status(500).json({ message: "Error fetching questions", error });
  }
});

route.post("/feedback", async (req, res) => {
  const body = req.body;
  try {
    const validatedData = feedbackData.parse(body);

    const userId = (req as any).user.id;
    const feedback = await generateFeedBack(
      userId,
      validatedData.questionId,
      validatedData.userAnswer
    );
    return res.json({ feedback: feedback });
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(error);
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }

    console.error("Unexpected error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

route.get("/feedbackAndAnswer", async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const data = await pool.query(
      `SELECT id, feedback, user_answer FROM answers
      WHERE user_id = $1 `,
      [userId]
    );
    return res.json(data.rows);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return res.status(500).json({ message: "Error fetching questions", error });
  }
});

export default route;
