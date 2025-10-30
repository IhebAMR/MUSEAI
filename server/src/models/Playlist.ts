import mongoose, { Schema, InferSchemaType } from 'mongoose';

const PlaylistSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  trackIds: [{ type: Schema.Types.ObjectId, ref: 'Song' }]
}, { timestamps: true });

export type PlaylistDoc = InferSchemaType<typeof PlaylistSchema> & { _id: mongoose.Types.ObjectId };
export const Playlist = mongoose.model('Playlist', PlaylistSchema);
