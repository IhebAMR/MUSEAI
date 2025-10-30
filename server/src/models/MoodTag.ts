import mongoose, { Schema, InferSchemaType } from 'mongoose';

const MoodTagSchema = new Schema({
  name: { type: String, required: true, unique: true }
}, { timestamps: true });

export type MoodTagDoc = InferSchemaType<typeof MoodTagSchema> & { _id: mongoose.Types.ObjectId };
export const MoodTag = mongoose.model('MoodTag', MoodTagSchema);
