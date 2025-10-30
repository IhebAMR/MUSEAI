import { Router, Request, Response } from 'express';
import { interpretCommand } from '../services/openai';
import OpenAI from 'openai';

const router = Router();

router.post('/interpret', async (req: Request, res: Response) => {
  const { transcript } = req.body as { transcript?: string };
  if (!transcript) return res.status(400).json({ error: 'transcript required' });
  const result = await interpretCommand(transcript);
  res.json(result);
});

// Simple health/status endpoint to debug OpenAI configuration
router.get('/status', async (_req: Request, res: Response) => {
  const keyPresent = !!process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if (!keyPresent) {
    return res.json({ ok: false, keyPresent, model, error: 'OPENAI_API_KEY missing' });
  }
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Reply with OK' }],
      temperature: 0,
    });
    const text = (completion.choices?.[0]?.message?.content || '').trim();
    const ok = /^OK$/i.test(text);
    res.json({ ok, keyPresent: true, model, sample: text });
  } catch (e: any) {
    const status = e?.status || e?.response?.status;
    const error = e?.error?.message || e?.message || 'Unknown error';
    res.json({ ok: false, keyPresent: true, model, status, error });
  }
});

export default router;
