import mongoose, { Schema, type Document } from "mongoose"

export interface IStaffSchedule extends Document {
  staffId: mongoose.Types.ObjectId;
  date: Date;
  shiftStart: Date;
  shiftEnd: Date;
  status: 'scheduled' | 'checked_in' | 'checked_out' | 'absent' | 'on_leave' | 'cancelled';
  actualCheckIn?: Date;
  actualCheckOut?: Date;
  breakTime?: number; // in minutes
  overtimeHours?: number;
  location?: string; // specific area or department within the property
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StaffScheduleSchema = new Schema<IStaffSchedule>(
  {
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    date: { type: Date, required: true },
    shiftStart: { type: Date, required: true },
    shiftEnd: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['scheduled', 'checked_in', 'checked_out', 'absent', 'on_leave', 'cancelled'],
      default: 'scheduled'
    },
    actualCheckIn: { type: Date },
    actualCheckOut: { type: Date },
    breakTime: { type: Number, min: 0 }, // in minutes
    overtimeHours: { type: Number, min: 0 },
    location: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { 
    timestamps: true,
    collection: "staff_schedules"
  }
)

// Create indexes for faster queries
StaffScheduleSchema.index({ staffId: 1 })
StaffScheduleSchema.index({ date: 1 })
StaffScheduleSchema.index({ status: 1 })
StaffScheduleSchema.index({ staffId: 1, date: 1 }, { unique: true }) // One schedule per staff per day

// Create compound index for date range queries
StaffScheduleSchema.index({ staffId: 1, shiftStart: 1, shiftEnd: 1 })

/**
 * StaffSchedule model for managing staff work schedules
 */
const StaffSchedule = (mongoose.models.StaffSchedule || mongoose.model<IStaffSchedule>("StaffSchedule", StaffScheduleSchema)) as mongoose.Model<IStaffSchedule>

export default StaffSchedule