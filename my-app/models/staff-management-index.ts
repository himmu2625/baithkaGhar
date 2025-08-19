/**
 * Staff Management Models Index
 * 
 * This file exports all staff management related models for easy importing
 * in other parts of the application.
 */

import Staff from './Staff';
import StaffRole from './StaffRole';
import StaffSchedule from './StaffSchedule';
import Task from './Task';
import Department from './Department';
import StaffAttendance from './StaffAttendance';
import StaffPayroll from './StaffPayroll';
import StaffPerformance from './StaffPerformance';
import StaffTraining from './StaffTraining';

// Export models only - interfaces can be imported directly from individual files
export {
  Staff,
  StaffRole,
  StaffSchedule,
  Task,
  Department,
  StaffAttendance,
  StaffPayroll,
  StaffPerformance,
  StaffTraining
};

// Re-export interfaces individually to avoid build issues
export type { IStaff } from './Staff';
export type { IStaffRole } from './StaffRole';
export type { IStaffSchedule } from './StaffSchedule';
export type { ITask } from './Task';
export type { IDepartment } from './Department';
export type { IStaffAttendance } from './StaffAttendance';
export type { IStaffPayroll } from './StaffPayroll';
export type { IStaffPerformance } from './StaffPerformance';
export type { IStaffTraining } from './StaffTraining';