import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';

const router = Router();

const RegisterSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
const LoginSchema = RegisterSchema;

router.post('/register', async (req, res) => {
  try {
    const { email, password } = RegisterSchema.parse(req.body);
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET || '', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Invalid input' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET || '', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Invalid input' });
  }
});

export default router;
