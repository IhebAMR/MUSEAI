import OpenAI from 'openai';

export type MuseAIAction = {
  action: 'play' | 'pause' | 'skip' | 'queue' | 'create_playlist';
  payload?: {
    mood?: string;
    genre?: string;
    trackId?: string;
    playlistName?: string;
  };
};

const SYSTEM_PROMPT = `You are an assistant for a voice-controlled music player. 
Interpret the user's command and respond ONLY as compact JSON following this TypeScript type:
{
  action: 'play' | 'pause' | 'skip' | 'queue' | 'create_playlist',
  payload?: { mood?: string, genre?: string, trackId?: string, playlistName?: string }
}
Examples:
- "Play something relaxing" -> {"action":"play","payload":{"mood":"relaxing"}}
- "Skip this" -> {"action":"skip"}
- "Make a chill playlist" -> {"action":"create_playlist","payload":{"playlistName":"chill"}}
`;

export async function interpretCommand(transcript: string): Promise<MuseAIAction> {
  const input = transcript.trim();
  if (!input) return { action: 'play' };
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY missing');
    const client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    // Use Chat Completions for broad compatibility
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input },
      ],
      temperature: 0.2,
    });

    const output = (completion.choices?.[0]?.message?.content || '').trim();

    // Attempt to parse JSON; fallback to trivial mapping
    const jsonStart = output.indexOf('{');
    const jsonEnd = output.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const sliced = output.slice(jsonStart, jsonEnd + 1);
      return JSON.parse(sliced);
    }
  } catch (e: any) {
    const msg = e?.error?.message || e?.message || 'Unknown error';
    const status = e?.status || e?.response?.status;
    console.error('OpenAI error or missing key, using fallback heuristic', { status, msg });
  }
  // Fallback heuristic
  const lower = input.toLowerCase();
  if (lower.includes('pause')) return { action: 'pause' };
  if (lower.includes('skip')) return { action: 'skip' };
  if (lower.includes('playlist')) return { action: 'create_playlist', payload: { playlistName: 'My Playlist' } };
  return { action: 'play' };
}
