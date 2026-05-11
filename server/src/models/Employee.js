import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    unique: true,
    required: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  salary: {
    base: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 }
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  skills: [{
    type: String,
    trim: true
  }],
  ragStatus: {
    type: String,
    enum: ['green', 'amber', 'red'],
    default: 'green'
  },
  performanceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  workType: {
    type: String,
    enum: ['office', 'remote', 'hybrid'],
    default: 'office'
  },
  bio: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Auto-generate employee ID
employeeSchema.pre('save', async function(next) {
  if (this.isNew && !this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeId = `EMP-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
