/**
 * User Types
 * Shared types matching the backend User model
 */

export type UserRole = 'super_admin' | 'admin' | 'user' | 'travel_agent' | 'property_owner';
export type BusinessType = 'individual' | 'company' | 'partnership';
export type KYCStatus = 'pending' | 'verified' | 'rejected';

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ContactPerson {
  name: string;
  designation: string;
  phone: string;
  email: string;
}

export interface KYCDocument {
  type: string;
  number: string;
  documentUrl: string;
  verifiedAt?: string;
}

export interface OwnerProfile {
  propertyIds: string[];
  businessName?: string;
  businessType?: BusinessType;
  gstNumber?: string;
  panNumber?: string;
  bankDetails?: BankDetails;
  address?: Address;
  contactPerson?: ContactPerson;
  kycStatus?: KYCStatus;
  kycDocuments?: KYCDocument[];
  registeredAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  dob?: string;
  isAdmin: boolean;
  role: UserRole;
  permissions?: string[];
  googleId?: string;
  profileComplete: boolean;
  isSpam: boolean;
  ownerProfile?: OwnerProfile;
  createdAt: string;
  updatedAt: string;
}
