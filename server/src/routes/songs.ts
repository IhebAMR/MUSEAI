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

router.get('/', async (_req: Request, res: Response) => {
  // If not connected to Mongo, return mock songs immediately
  if (mongoose.connection.readyState !== 1) {
    return res.json(mockSongs);
  }
  const count = await Song.countDocuments();
  if (count === 0) {
    return res.json(mockSongs);
  }
  const songs = await Song.find().limit(100).lean();
  res.json(songs);
});

export default router;
