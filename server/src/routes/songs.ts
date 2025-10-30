import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
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

  // If not connected to Mongo, return filtered mocks
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
