import mongoose, { Schema, type Document } from "mongoose"

export interface ITask extends Document {
  staffId: mongoose.Types.ObjectId;
  taskType: 'housekeeping' | 'maintenance' | 'guest_service' | 'administrative' | 'security' | 'other';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedDate: Date;
  dueDate?: Date;
  completedDate?: Date;
  location?: string; // Room number, area, or specific location
  propertyId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId; // If task is related to a specific booking
  roomId?: mongoose.Types.ObjectId; // If task is related to a specific room
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  notes?: string;
  attachments?: string[]; // URLs to images or documents
  feedback?: {
    rating: number;
    comment: string;
    givenBy: mongoose.Types.ObjectId;
    givenAt: Date;
  };
  assignedBy: mongoose.Types.ObjectId;
  reassignedTo?: mongoose.Types.ObjectId; // If task was reassigned to another staff
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    taskType: { 
      type: String, 
      enum: ['housekeeping', 'maintenance', 'guest_service', 'administrative', 'security', 'other'],
      required: true
    },
    description: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'in_progress', 'completed', 'cancelled', 'delayed'],
      default: 'pending'
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    assignedDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date },
    completedDate: { type: Date },
    location: { type: String },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    roomId: { type: Schema.Types.ObjectId, ref: "Room" },
    estimatedDuration: { type: Number, min: 0 }, // in minutes
    actualDuration: { type: Number, min: 0 }, // in minutes
    notes: { type: String },
    attachments: [{ type: String }], // URLs to images or documents
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      givenBy: { type: Schema.Types.ObjectId, ref: "User" },
      givenAt: { type: Date }
    },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reassignedTo: { type: Schema.Types.ObjectId, ref: "Staff" }
  },
  { 
    timestamps: true,
    collection: "tasks"
  }
)

// Create indexes for faster queries
TaskSchema.index({ staffId: 1 })
TaskSchema.index({ taskType: 1 })
TaskSchema.index({ status: 1 })
TaskSchema.index({ priority: 1 })
TaskSchema.index({ assignedDate: 1 })
TaskSchema.index({ dueDate: 1 })
TaskSchema.index({ propertyId: 1 })
TaskSchema.index({ bookingId: 1 })
TaskSchema.index({ roomId: 1 })

// Create compound indexes for common queries
TaskSchema.index({ staffId: 1, status: 1 })
TaskSchema.index({ propertyId: 1, status: 1 })
TaskSchema.index({ propertyId: 1, taskType: 1, status: 1 })

/**
 * Task model for managing tasks assigned to staff members
 */
const Task = (mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema)) as mongoose.Model<ITask>

export default Task