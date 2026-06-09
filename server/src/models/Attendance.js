import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date
  },
  checkInDevice: {
    type: String,
    enum: ['mobile', 'web'],
    default: 'web'
  },
  checkOut: {
    type: Date
  },
  checkOutDevice: {
    type: String,
    enum: ['mobile', 'web']
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'leave', 'holiday'],
    default: 'present'
  },
  workHours: {
    type: Number,
    default: 0
  },
  overtime: {
    type: Number,
    default: 0
  },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Optimize read queries for concurrent 300+ user traffic and admin dashboard
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

// Auto-calculate work hours
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const hours = (this.checkOut - this.checkIn) / (1000 * 60 * 60);
    this.workHours = Math.round(hours * 100) / 100;
    this.overtime = Math.max(0, this.workHours - 8);
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
