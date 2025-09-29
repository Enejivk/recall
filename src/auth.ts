import { json, object, z } from "zod";
import { Router } from "express";
import type { Request, Response } from "express";
import pool from "./db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
type TokenData = { id: string };
type DBUser = {
  email: string;
  id: string;
  password_hash: string;
};

type UserPayload = {
  id: string;
};

function createJwtToken(tokenData: TokenData) {
  const secretKey = process.env.JWT_SECRET;
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
      tokenType === "accessToken"
        ? 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000,
  });
}

async function getUser(email: string): Promise<DBUser> {
  const metadata = await pool.query(
    `SELECT email, id, password_hash FROM users WHERE email = $1`,
    [email]
  );
  return metadata.rows[0];
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
    // check if user not found in database
    const userExist = await getUser(body.email);
    if (userExist) {
      return res
        .status(409)
        .json({ message: `User with email ${body.email} already exist` });
    }

    console.log("Request went to the body well", body);
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await pool.query(
      `INSERT INTO users(email, password_hash) VALUES($1, $2) RETURNING id`,
      [body.email, passwordHash]
    );

    const accessToken = createJwtToken(user.rows[0]);
    const refreshToken = createJwtToken(user.rows[0]);
    setTokenCookies(res, accessToken, "accessToken");
    setTokenCookies(res, refreshToken, "refreshToken");

    return res.status(200).json({ message: "User created successful" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.json(error.message);
    }
  }
});

route.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await getUser(email);

  // check if the user is in the database
  if (!user) {
    return res.status(400).json({
      message: "Invalid username or password",
    });
  }

  // check if the password is correct
  const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordMatch) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const tokenData = { id: user.id };
  const accessToken = createJwtToken(tokenData);
  const refreshToken = createJwtToken(tokenData);

  setTokenCookies(res, accessToken, "accessToken");
  setTokenCookies(res, refreshToken, "refreshToken");
  return res.json({ message: "Login Successfully" });
});

route.get("/me", (req: Request, res: Response) => {
  console.log(Object.keys(req));
  console.log(req);
  return res.json({ message: "This is me boss" });
});

route.get("/refresh", (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken === undefined) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    return res.status(500).json({ message: "There is no secrete key found" });
  }

  let user: UserPayload;
  try {
    user = jwt.verify(refreshToken, secretKey) as UserPayload;
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid of expired refresh token" });
  }

  const tokenData = {
    id: user.id,
  };

  const accessToken = createJwtToken(tokenData);
  const newRefreshToken = createJwtToken(tokenData);

  setTokenCookies(res, accessToken, "accessToken");
  setTokenCookies(res, newRefreshToken, "refreshToken");

  return res.json({ message: "Token refresh successfully" });
});

export default route;
