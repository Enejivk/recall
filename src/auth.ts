import { z } from "zod";
import { Router } from "express";
import type { Request, Response } from "express";
import pool from "./db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Define the user schema
type TokenData = { id: string };

function createJwtToken(tokenData: TokenData) {
  const secretKey = process.env.JWT_SECRETE;
  if (!secretKey || typeof secretKey !== "string") {
    throw new Error("JWT secret key is not defined");
  }
  return jwt.sign(tokenData, secretKey);
}

function setTokenCookies(
  res: Response,
  token: string,
  tokenType: "refreshToken" | "accessToken"
) {
  res.cookie(tokenType, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:
      tokenType === "accessToken" ? 15 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
  });
}

const registerSchema = z
  .object({
    email: z.email(),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Generating the data type
type User = z.infer<typeof registerSchema>;
const route = Router();

// Register Route
route.post("/register", async (req: Request, res: Response) => {
  const body: User = req.body;
  try {
    // Validating data
    registerSchema.parse(body);
    const userExist = await pool.query(
      `SELECT email FROM users WHERE email = $1`,
      [body.email]
    );

    // check if user not found in database
    if (userExist.rows.length > 0) {
      return res
        .status(409)
        .json({ message: `User with ${body.email} already exist` });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    console.log("After hash");
    const user = await pool.query(
      `INSERT INTO users(email, passwordHash) VALUES($1, $2) RETURNING id`,
      [body.email, passwordHash]
    );

    const token = createJwtToken(user.rows[0]);

    return res.status(200).json({ message: "User created successful", token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.json(error.message);
    }
  }
});

export default route;
