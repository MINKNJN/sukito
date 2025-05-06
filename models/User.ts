// /models/User.ts
import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  nickname: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

const User = models.User || model('User', UserSchema);
export default User;
