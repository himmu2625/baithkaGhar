import mongoose, { Schema, type Document } from "mongoose"

export interface IStaffAttendance extends Document {
  staffId: mongoose.Types.ObjectId;
  date: Date;
  scheduleId?: mongoose.Types.ObjectId; // Reference to the staff schedule if available
  checkIn: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  totalHours?: number;
  overtimeHours?: number;
  breaks: [{
    startTime: Date;
    endTime?: Date;
    duration?: number; // in minutes
    type: 'lunch' | 'tea' | 'personal' | 'other';
  }];
  location?: string; // Location where attendance was marked
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffAttendanceSchema = new Schema<IStaffAttendance>(
  {
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    date: { type: Date, required: true },
    scheduleId: { type: Schema.Types.ObjectId, ref: "StaffSchedule" },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date },
    status: { 
      type: String, 
      enum: ['present', 'absent', 'late', 'half_day', 'on_leave'],
      default: 'present'
    },
    totalHours: { type: Number, min: 0 },
    overtimeHours: { type: Number, min: 0, default: 0 },
    breaks: [{
      startTime: { type: Date, required: true },
      endTime: { type: Date },
      duration: { type: Number, min: 0 }, // in minutes
      type: { 
        type: String, 
        enum: ['lunch', 'tea', 'personal', 'other'],
        default: 'lunch'
      }
    }],
    location: { type: String },
    notes: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvalStatus: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvalNotes: { type: String }
  },
  { 
    timestamps: true,
    collection: "staff_attendance"
  }
)

// Create indexes for faster queries
StaffAttendanceSchema.index({ staffId: 1 })
StaffAttendanceSchema.index({ date: 1 })
StaffAttendanceSchema.index({ scheduleId: 1 })
StaffAttendanceSchema.index({ status: 1 })
StaffAttendanceSchema.index({ approvalStatus: 1 })

// Create compound index for unique attendance records per staff per day
StaffAttendanceSchema.index({ staffId: 1, date: 1 }, { unique: true })

// Create compound index for date range queries
StaffAttendanceSchema.index({ staffId: 1, date: 1, status: 1 })

/**
 * StaffAttendance model for tracking detailed attendance records
 */
const StaffAttendance = (mongoose.models.StaffAttendance || mongoose.model<IStaffAttendance>("StaffAttendance", StaffAttendanceSchema)) as mongoose.Model<IStaffAttendance>

export default StaffAttendance