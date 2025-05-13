// Utility functions for handling property status changes consistently across the app

type StatusType = 'active' | 'inactive' | 'available' | 'pending' | 'maintenance' | 'deleted';

/**
 * Gets the corresponding MongoDB update fields when updating a property's status
 * This ensures that related fields like isPublished and isAvailable are updated correctly
 */
export function getStatusUpdateFields(newStatus: StatusType, verificationStatus?: string) {
  const updateFields: Record<string, any> = {
    status: newStatus
  };
  
  // Update related fields based on status
  switch(newStatus) {
    case 'active':
    case 'available':
      updateFields.isPublished = true;
      updateFields.isAvailable = true;
      
      // If not already approved, update verification status
      if (verificationStatus === 'pending') {
        updateFields.verificationStatus = 'approved';
        updateFields.verifiedAt = new Date();
      }
      break;
      
    case 'inactive':
      // Keep it published but not available
      updateFields.isAvailable = false;
      break;
      
    case 'pending':
      updateFields.isPublished = false;
      updateFields.verificationStatus = 'pending';
      break;
      
    case 'maintenance':
      updateFields.isAvailable = false;
      break;
      
    case 'deleted':
      updateFields.isPublished = false;
      updateFields.isAvailable = false;
      break;
  }
  
  return updateFields;
}

/**
 * Determines if a property should be visible in frontend listings
 * based on its status fields
 */
export function isPropertyVisible(property: any): boolean {
  // Property must be published
  if (!property.isPublished) return false;
  
  // Property must be approved
  if (property.verificationStatus !== 'approved') return false;
  
  // Status must be active or available
  if (property.status !== 'active' && property.status !== 'available') return false;
  
  return true;
}

/**
 * Gets a standardized query for fetching visible properties
 */
export function getVisiblePropertiesQuery(): Record<string, any> {
  return {
    isPublished: true,
    verificationStatus: 'approved',
    $or: [
      { status: 'available' },
      { status: 'active' }
    ]
  };
} 