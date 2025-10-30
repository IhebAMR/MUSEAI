import mongoose, { Schema, InferSchemaType } from 'mongoose';

const SongSchema = new Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  url: { type: String, required: true },
  albumArt: { type: String },
  genre: { type: String },
  moodTags: [{ type: String }]
}, { timestamps: true });

export type SongDoc = InferSchemaType<typeof SongSchema> & { _id: mongoose.Types.ObjectId };
export const Song = mongoose.model('Song', SongSchema);
