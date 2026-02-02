// Shared validation utilities for frontend
// Password, Email, and Phone validation with proper regex patterns

// Password Policy Requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
  };

  const errors: string[] = [];
  
  if (!checks.minLength) {
    errors.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }
  if (PASSWORD_REQUIREMENTS.requireUppercase && !checks.hasUppercase) {
    errors.push('At least one uppercase letter (A-Z)');
  }
  if (PASSWORD_REQUIREMENTS.requireLowercase && !checks.hasLowercase) {
    errors.push('At least one lowercase letter (a-z)');
  }
  if (PASSWORD_REQUIREMENTS.requireNumber && !checks.hasNumber) {
    errors.push('At least one number (0-9)');
  }
  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !checks.hasSpecialChar) {
    errors.push('At least one special character (!@#$%^&*...)');
  }

  // Calculate password strength
  const passedChecks = Object.values(checks).filter(Boolean).length;
  let strength: PasswordValidationResult['strength'] = 'weak';
  
  if (passedChecks === 5 && password.length >= 12) {
    strength = 'strong';
  } else if (passedChecks >= 4) {
    strength = 'good';
  } else if (passedChecks >= 3) {
    strength = 'fair';
  }

  return {
    isValid: errors.length === 0,
    errors,
    checks,
    strength
  };
}

// Email Validation
// RFC 5322 compliant email regex (simplified for practical use)
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export interface EmailValidationResult {
  isValid: boolean;
  error: string | null;
}

export function validateEmail(email: string): EmailValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email is too long (max 254 characters)' };
  }
  
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true, error: null };
}

// Phone Validation
// International phone number format with optional country code
// Supports formats: +44 7911 123456, +1 (555) 123-4567, 07911123456, etc.
export const PHONE_REGEX = /^(\+?\d{1,4}[\s.-]?)?(\(?\d{1,4}\)?[\s.-]?)?[\d\s.-]{6,14}$/;

// UK specific phone regex for more strict validation
export const UK_PHONE_REGEX = /^(\+44\s?|0)7\d{3}\s?\d{6}$/;

// US specific phone regex
export const US_PHONE_REGEX = /^(\+1\s?)?(\([0-9]{3}\)|[0-9]{3})[\s.-]?[0-9]{3}[\s.-]?[0-9]{4}$/;

export interface PhoneValidationResult {
  isValid: boolean;
  error: string | null;
  sanitized: string;
}

export function validatePhone(phone: string, countryCode?: string): PhoneValidationResult {
  if (!phone || phone.trim().length === 0) {
    return { isValid: false, error: 'Phone number is required', sanitized: '' };
  }
  
  // Remove all whitespace and common separators for validation
  const sanitized = phone.replace(/[\s.-]/g, '');
  
  // Check minimum length (at least 7 digits for short national numbers)
  const digitsOnly = sanitized.replace(/\D/g, '');
  if (digitsOnly.length < 7) {
    return { isValid: false, error: 'Phone number is too short', sanitized };
  }
  
  if (digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone number is too long', sanitized };
  }
  
  // Country-specific validation if country code provided
  if (countryCode?.toUpperCase() === 'GB' || countryCode?.toUpperCase() === 'UK') {
    if (!UK_PHONE_REGEX.test(phone.trim())) {
      // Allow general format but warn about UK format
      if (!PHONE_REGEX.test(phone.trim())) {
        return { isValid: false, error: 'Please enter a valid phone number', sanitized };
      }
    }
  } else if (countryCode?.toUpperCase() === 'US') {
    if (!US_PHONE_REGEX.test(phone.trim())) {
      if (!PHONE_REGEX.test(phone.trim())) {
        return { isValid: false, error: 'Please enter a valid phone number', sanitized };
      }
    }
  } else {
    // General international format validation
    if (!PHONE_REGEX.test(phone.trim())) {
      return { isValid: false, error: 'Please enter a valid phone number', sanitized };
    }
  }
  
  return { isValid: true, error: null, sanitized };
}

// Name validation (for first/last names)
export function validateName(name: string, fieldName: string = 'Name'): { isValid: boolean; error: string | null } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters` };
  }
  
  if (trimmed.length > 50) {
    return { isValid: false, error: `${fieldName} is too long (max 50 characters)` };
  }
  
  // Allow letters, spaces, hyphens, and apostrophes (for names like O'Brien, Mary-Jane)
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return { isValid: false, error: `${fieldName} contains invalid characters` };
  }
  
  return { isValid: true, error: null };
}

// Utility to format validation messages
export function getPasswordPolicyText(): string {
  return `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters and include uppercase, lowercase, number, and special character.`;
}
