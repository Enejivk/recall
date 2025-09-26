import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
declare global {
  namespace Express {
    interface Request {
      user?: string | jwt.JwtPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const accessToken = req.cookies.accessToken;
  const secretKey = process.env.JWT_SECRET;

  if (!secretKey) {
    return res.status(500).json({ message: "No secret key found" });
  }

  if (!accessToken) {
    return res.status(401).json({ message: "Access token missing" });
  }

  try {
    const payload = jwt.verify(accessToken, secretKey);
    req.user = payload;
    console.log(req.user)
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}
