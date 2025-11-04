/**
 * Phone Number Formatting Utilities
 * 
 * Format Standards:
 * - DONOR (mobile): +63 912 345 6789
 * - BLOODBANK/ADMIN/HOSPITAL (landline): (02) 1234 5678
 */

/**
 * Format a mobile phone number for donors
 * @param {string} phone - Phone number (with or without country code)
 * @returns {string} Formatted phone number: +63 912 345 6789
 */
export const formatDonorPhone = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove country code if present
  if (cleaned.startsWith('63')) {
    cleaned = cleaned.substring(2);
  }
  
  // Ensure it starts with 9 (mobile prefix in Philippines)
  if (!cleaned.startsWith('9')) {
    return phone; // Return original if not a valid mobile number
  }
  
  // Format: +63 912 345 6789
  if (cleaned.length === 10) {
    return `+63 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  
  return phone; // Return original if length doesn't match
};

/**
 * Format a landline phone number for bloodbank/admin/hospital
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number: (02) 1234 5678
 */
export const formatLandlinePhone = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove country code if present (63)
  if (cleaned.startsWith('63')) {
    cleaned = cleaned.substring(2);
  }
  
  // Format: (02) 1234 5678
  // Assuming area code is 2 digits and number is 7-8 digits
  if (cleaned.length === 9) {
    // 2-digit area code + 7-digit number
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)} ${cleaned.substring(6)}`;
  } else if (cleaned.length === 10) {
    // 2-digit area code + 8-digit number
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)} ${cleaned.substring(6)}`;
  } else if (cleaned.length === 8) {
    // Just the number without area code (assume Metro Manila 02)
    return `(02) ${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
  }
  
  return phone; // Return original if format doesn't match
};

/**
 * Strip country code from phone number
 * @param {string} phone - Phone number
 * @returns {string} Phone number without country code
 */
export const stripCountryCode = (phone) => {
  if (!phone) return '';
  
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('63')) {
    return cleaned.substring(2);
  }
  
  return cleaned;
};

/**
 * Validate if a phone number is a valid Philippine mobile number
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid mobile number
 */
export const isValidMobileNumber = (phone) => {
  if (!phone) return false;
  
  const cleaned = stripCountryCode(phone);
  
  // Philippine mobile numbers start with 9 and are 10 digits long
  return /^9\d{9}$/.test(cleaned);
};

/**
 * Validate if a phone number is a valid Philippine landline number
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid landline number
 */
export const isValidLandlineNumber = (phone) => {
  if (!phone) return false;
  
  const cleaned = stripCountryCode(phone);
  
  // Philippine landline numbers are typically 8-10 digits
  // Area codes are 1-3 digits, local numbers are 7 digits
  return /^\d{8,10}$/.test(cleaned) && !cleaned.startsWith('9');
};

/**
 * Auto-detect and format phone number based on type
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const autoFormatPhone = (phone) => {
  if (!phone) return '';
  
  const cleaned = stripCountryCode(phone);
  
  if (cleaned.startsWith('9') && cleaned.length === 10) {
    return formatDonorPhone(phone);
  } else if (cleaned.length >= 8 && cleaned.length <= 10 && !cleaned.startsWith('9')) {
    return formatLandlinePhone(phone);
  }
  
  return phone;
};
