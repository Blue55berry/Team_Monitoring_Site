import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  completed: { type: Boolean, default: false },
  completedAt: Date
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  projectManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    required: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  ragStatus: {
    type: String,
    enum: ['green', 'amber', 'red'],
    default: 'green'
  },
  milestones: [milestoneSchema],
  budget: {
    allocated: { type: Number, default: 0 },
    spent: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  tags: [String],
  techStack: [String]
}, {
  timestamps: true
});

// Auto-compute RAG status based on deadline proximity
projectSchema.pre('save', function(next) {
  if (this.deadline && this.status === 'active') {
    const now = new Date();
    const deadline = new Date(this.deadline);
    const totalDays = (deadline - new Date(this.startDate)) / (1000 * 60 * 60 * 24);
    const daysLeft = (deadline - now) / (1000 * 60 * 60 * 24);
    const expectedProgress = ((totalDays - daysLeft) / totalDays) * 100;

    if (this.progress >= expectedProgress - 10) {
      this.ragStatus = 'green';
    } else if (this.progress >= expectedProgress - 30) {
      this.ragStatus = 'amber';
    } else {
      this.ragStatus = 'red';
    }
  }
  next();
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
