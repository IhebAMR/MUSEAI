import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Playlist } from '../models/Playlist';

const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name } = req.body as { name?: string };
  if (!name) return res.status(400).json({ error: 'name required' });
  const userId = req.user!.id;
  const playlist = await Playlist.create({ userId, name, trackIds: [] });
  res.json(playlist);
});

router.post('/:id/add', requireAuth, async (req: AuthRequest, res: Response) => {
  const { trackId } = req.body as { trackId?: string };
  if (!trackId) return res.status(400).json({ error: 'trackId required' });
  const playlist = await Playlist.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.id },
    { $addToSet: { trackIds: trackId } },
    { new: true }
  );
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
  res.json(playlist);
});

router.post('/:id/remove', requireAuth, async (req: AuthRequest, res: Response) => {
  const { trackId } = req.body as { trackId?: string };
  if (!trackId) return res.status(400).json({ error: 'trackId required' });
  const playlist = await Playlist.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.id },
    { $pull: { trackIds: trackId } },
    { new: true }
  );
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
  res.json(playlist);
});

export default router;
