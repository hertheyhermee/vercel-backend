import mongoose from 'mongoose';
import { v7 as uuidv7 } from 'uuid';

const profileSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv7(),
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female', 'unknown'],
    },
    gender_probability: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    sample_size: {
      type: Number,
      required: true,
      min: 0,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
    },
    age_group: {
      type: String,
      required: true,
      enum: ['child', 'teenager', 'adult', 'senior', 'unknown'],
    },
    country_id: {
      type: String,
      required: true,
    },
    country_probability: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    created_at: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    versionKey: false,
  }
);

profileSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    return ret;
  },
});

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;