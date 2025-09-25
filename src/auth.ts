import express from "express"
import type { Response, Request } from "express";

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    res.status(201).json({ message: 'User registered successfully.' });
});

export default router;