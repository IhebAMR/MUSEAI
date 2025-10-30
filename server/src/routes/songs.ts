import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import { Song } from '../models/Song';

const router = Router();

// Mock songs if DB empty
const mockSongs = [
  { title: 'Ocean Breeze', artist: 'Ayla', url: 'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav', albumArt: '', genre: 'ambient', moodTags: ['relaxing', 'calm'] },
  { title: 'Night Drive', artist: 'Nova', url: 'https://www2.cs.uic.edu/~i101/SoundFiles/PinkPanther30.wav', albumArt: '', genre: 'synthwave', moodTags: ['focus', 'cool'] },
  { title: 'Sunny Mornings', artist: 'Lumo', url: 'https://www2.cs.uic.edu/~i101/SoundFiles/ImperialMarch60.wav', albumArt: '', genre: 'acoustic', moodTags: ['happy', 'warm'] }
];

router.get('/', async (req: Request, res: Response) => {
  const { mood, genre } = req.query as { mood?: string; genre?: string };

  // Helper to filter mocks when DB is not available
  const filterMocks = () => {
    let results = mockSongs;
    if (genre) results = results.filter((s) => (s.genre || '').toLowerCase() === String(genre).toLowerCase());
    if (mood) results = results.filter((s) => (s.moodTags || []).map((m) => m.toLowerCase()).includes(String(mood).toLowerCase()));
    return results;
  };

  // 0) If a sources.json file exists, serve remote sources defined there
  const MEDIA_DIR = process.env.MEDIA_DIR || path.resolve(__dirname, '..', '..', 'media');
  const sourcesPath = path.join(MEDIA_DIR, 'sources.json');
  if (fs.existsSync(sourcesPath)) {
    try {
      const raw = fs.readFileSync(sourcesPath, 'utf-8');
      const list = JSON.parse(raw) as Array<{ title: string; artist: string; url: string; albumArt?: string; genre?: string; moodTags?: string[] }>;
      if (Array.isArray(list) && list.length > 0) {
        let items = list;
        if (genre) items = items.filter((s) => (s.genre || '').toLowerCase() === String(genre).toLowerCase());
        if (mood) items = items.filter((s) => (s.moodTags || []).map((m) => m.toLowerCase()).includes(String(mood).toLowerCase()));
        if (items.length > 0) return res.json(items);
      }
    } catch {
      // ignore malformed JSON and continue fallbacks
    }
  }

  // 1) If there are local media files to serve, use those
  if (fs.existsSync(MEDIA_DIR)) {
    const files = fs.readdirSync(MEDIA_DIR).filter(f => /\.(mp3|ogg|wav)$/i.test(f));
    if (files.length > 0) {
      let local = files.map(f => ({
        title: path.parse(f).name,
        artist: 'Local',
        url: `/media/${f}`,
        albumArt: '',
        genre: undefined,
        moodTags: [] as string[]
      }));
      if (genre) local = local.filter(s => s.title.toLowerCase().includes(String(genre).toLowerCase()));
      if (mood) local = local.filter(s => s.title.toLowerCase().includes(String(mood).toLowerCase()));
      if (local.length > 0) return res.json(local);
    }
  }

  // 2) If not connected to Mongo, return filtered mocks
  if (mongoose.connection.readyState !== 1) {
    return res.json(filterMocks());
  }

  const query: any = {};
  if (genre) query.genre = new RegExp(`^${String(genre)}$`, 'i');
  if (mood) query.moodTags = { $in: [new RegExp(`^${String(mood)}$`, 'i')] };

  const count = await Song.countDocuments();
  if (count === 0) {
    return res.json(filterMocks());
  }

  const songs = await Song.find(query).limit(100).lean();
  res.json(songs);
});

export default router;
