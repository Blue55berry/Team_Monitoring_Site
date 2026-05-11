import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['auth', 'employee', 'project', 'task', 'attendance', 'leave', 'client', 'department'],
    required: true
  },
  action: {
    type: String,
    required: true // e.g., 'created', 'updated', 'deleted', 'approved'
  },
  message: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Map,
    of: String
  }
}, {
  timestamps: true
});

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
