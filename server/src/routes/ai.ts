import { Router, Request, Response } from 'express';
import { interpretCommand } from '../services/openai';

const router = Router();

router.post('/interpret', async (req: Request, res: Response) => {
  const { transcript } = req.body as { transcript?: string };
  if (!transcript) return res.status(400).json({ error: 'transcript required' });
  const result = await interpretCommand(transcript);
  res.json(result);
});

export default router;
