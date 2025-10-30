import { atom } from 'jotai';
import type { Track } from '../types/music';

export const queueAtom = atom<Track[]>([]);
export const currentTrackAtom = atom<Track | null>(null);
export const isPlayingAtom = atom<boolean>(false);
