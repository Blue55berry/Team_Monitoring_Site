import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  globalLocation: {
    lat: Number,
    lng: Number,
    radius: { type: Number, default: 100 },
    address: String
  }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
