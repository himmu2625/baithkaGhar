import mongoose, { Schema, type Document } from "mongoose"

export interface IStaffPayroll extends Document {
  staffId: mongoose.Types.ObjectId;
  payPeriod: {
    startDate: Date;
    endDate: Date;
  };
  basicSalary: number;
  allowances: {
    housing?: number;
    transport?: number;
    medical?: number;
    food?: number;
    other?: number;
  };
  deductions: {
    tax?: number;
    insurance?: number;
    advance?: number;
    absence?: number;
    other?: number;
  };
  overtime: {
    hours: number;
    rate: number;
    amount: number;
  };
  bonus?: number;
  totalEarnings: number;
  totalDeductions: number;
  netPayable: number;
  currency: string;
  paymentMethod: 'bank_transfer' | 'cash' | 'check' | 'digital_wallet';
  paymentDetails?: {
    accountNumber?: string;
    bankName?: string;
    branchCode?: string;
    walletId?: string;
    transactionId?: string;
  };
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed';
  paymentDate?: Date;
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  processedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StaffPayrollSchema = new Schema<IStaffPayroll>(
  {
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    payPeriod: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    },
    basicSalary: { type: Number, required: true, min: 0 },
    allowances: {
      housing: { type: Number, min: 0, default: 0 },
      transport: { type: Number, min: 0, default: 0 },
      medical: { type: Number, min: 0, default: 0 },
      food: { type: Number, min: 0, default: 0 },
      other: { type: Number, min: 0, default: 0 }
    },
    deductions: {
      tax: { type: Number, min: 0, default: 0 },
      insurance: { type: Number, min: 0, default: 0 },
      advance: { type: Number, min: 0, default: 0 },
      absence: { type: Number, min: 0, default: 0 },
      other: { type: Number, min: 0, default: 0 }
    },
    overtime: {
      hours: { type: Number, min: 0, default: 0 },
      rate: { type: Number, min: 0, default: 0 },
      amount: { type: Number, min: 0, default: 0 }
    },
    bonus: { type: Number, min: 0, default: 0 },
    totalEarnings: { type: Number, required: true, min: 0 },
    totalDeductions: { type: Number, required: true, min: 0 },
    netPayable: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    paymentMethod: { 
      type: String, 
      enum: ['bank_transfer', 'cash', 'check', 'digital_wallet'],
      required: true
    },
    paymentDetails: {
      accountNumber: { type: String },
      bankName: { type: String },
      branchCode: { type: String },
      walletId: { type: String },
      transactionId: { type: String }
    },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    paymentDate: { type: Date },
    notes: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    processedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { 
    timestamps: true,
    collection: "staff_payroll"
  }
)

// Create indexes for faster queries
StaffPayrollSchema.index({ staffId: 1 })
StaffPayrollSchema.index({ 'payPeriod.startDate': 1, 'payPeriod.endDate': 1 })
StaffPayrollSchema.index({ paymentStatus: 1 })
StaffPayrollSchema.index({ paymentDate: 1 })

// Create compound index for unique payroll records per staff per pay period
StaffPayrollSchema.index({ staffId: 1, 'payPeriod.startDate': 1, 'payPeriod.endDate': 1 }, { unique: true })

/**
 * StaffPayroll model for managing staff salary payments and financial records
 */
const StaffPayroll = (mongoose.models.StaffPayroll || mongoose.model<IStaffPayroll>("StaffPayroll", StaffPayrollSchema)) as mongoose.Model<IStaffPayroll>

export default StaffPayroll