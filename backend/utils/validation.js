// Backend validation utilities
// These ensure data integrity even if frontend validation is bypassed

const validationRules = {
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
  },
  names: {
    minLength: 2,
    maxLength: 50,
  },
  organisationName: {
    minLength: 3,
    maxLength: 100,
  },
  bio: {
    minLength: 50,
    maxLength: 2000,
  },
  taskTitle: {
    minLength: 10,
    maxLength: 100,
  },
  taskDescription: {
    minLength: 50,
    maxLength: 10000,
  },
  taskSummary: {
    minLength: 20,
    maxLength: 500,
  },
  proposalMessage: {
    minLength: 50,
    maxLength: 5000,
  },
  professionalLink: {
    maxLength: 500,
  },
};

function validatePassword(password) {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < validationRules.password.minLength) {
    errors.push(`Password must be at least ${validationRules.password.minLength} characters`);
  }
  
  if (validationRules.password.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (validationRules.password.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (validationRules.password.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (validationRules.password.requireSpecial && !/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}

function validateName(name, fieldName = 'Name') {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < validationRules.names.minLength) {
    return { valid: false, error: `${fieldName} must be at least ${validationRules.names.minLength} characters` };
  }
  
  if (trimmed.length > validationRules.names.maxLength) {
    return { valid: false, error: `${fieldName} cannot exceed ${validationRules.names.maxLength} characters` };
  }
  
  if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmed)) {
    return { valid: false, error: `${fieldName} can only contain letters, spaces, hyphens, apostrophes, and periods` };
  }

  return { valid: true };
}

function validateOrganisationName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Organisation name is required' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < validationRules.organisationName.minLength) {
    return { valid: false, error: `Organisation name must be at least ${validationRules.organisationName.minLength} characters` };
  }
  
  if (trimmed.length > validationRules.organisationName.maxLength) {
    return { valid: false, error: `Organisation name cannot exceed ${validationRules.organisationName.maxLength} characters` };
  }

  return { valid: true };
}

function validateBio(bio, required = true) {
  if (!bio || typeof bio !== 'string') {
    if (required) {
      return { valid: false, error: 'Bio is required' };
    }
    return { valid: true };
  }
  
  const trimmed = bio.trim();
  
  if (required && trimmed.length < validationRules.bio.minLength) {
    return { valid: false, error: `Bio must be at least ${validationRules.bio.minLength} characters` };
  }
  
  if (trimmed.length > validationRules.bio.maxLength) {
    return { valid: false, error: `Bio cannot exceed ${validationRules.bio.maxLength} characters` };
  }

  return { valid: true };
}

function validateTaskTitle(title) {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: 'Task title is required' };
  }
  
  const trimmed = title.trim();
  
  if (trimmed.length < validationRules.taskTitle.minLength) {
    return { valid: false, error: `Task title must be at least ${validationRules.taskTitle.minLength} characters` };
  }
  
  if (trimmed.length > validationRules.taskTitle.maxLength) {
    return { valid: false, error: `Task title cannot exceed ${validationRules.taskTitle.maxLength} characters` };
  }

  return { valid: true };
}

function validateTaskDescription(description) {
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'Task description is required' };
  }
  
  const trimmed = description.trim();
  
  if (trimmed.length < validationRules.taskDescription.minLength) {
    return { valid: false, error: `Task description must be at least ${validationRules.taskDescription.minLength} characters` };
  }
  
  if (trimmed.length > validationRules.taskDescription.maxLength) {
    return { valid: false, error: `Task description cannot exceed ${validationRules.taskDescription.maxLength} characters` };
  }

  return { valid: true };
}

function validateTaskSummary(summary) {
  if (!summary || typeof summary !== 'string') {
    return { valid: false, error: 'Task summary is required' };
  }
  
  const trimmed = summary.trim();
  
  if (trimmed.length < validationRules.taskSummary.minLength) {
    return { valid: false, error: `Task summary must be at least ${validationRules.taskSummary.minLength} characters` };
  }
  
  if (trimmed.length > validationRules.taskSummary.maxLength) {
    return { valid: false, error: `Task summary cannot exceed ${validationRules.taskSummary.maxLength} characters` };
  }

  return { valid: true };
}

function validateProposalMessage(message) {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Proposal message is required' };
  }
  
  const trimmed = message.trim();
  
  if (trimmed.length < validationRules.proposalMessage.minLength) {
    return { valid: false, error: `Proposal message must be at least ${validationRules.proposalMessage.minLength} characters` };
  }
  
  if (trimmed.length > validationRules.proposalMessage.maxLength) {
    return { valid: false, error: `Proposal message cannot exceed ${validationRules.proposalMessage.maxLength} characters` };
  }

  return { valid: true };
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  if (email.includes('..')) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
}

function validateRole(role) {
  const validRoles = ['taskOwner', 'solutionProvider'];
  
  if (!role || !validRoles.includes(role)) {
    return { valid: false, error: 'Invalid role. Must be taskOwner or solutionProvider' };
  }

  return { valid: true };
}

function validateProfessionalLink(link) {
  if (!link) {
    return { valid: true };
  }

  if (typeof link !== 'string') {
    return { valid: false, error: 'Professional link must be a string' };
  }

  if (link.length > validationRules.professionalLink.maxLength) {
    return { valid: false, error: `Professional link cannot exceed ${validationRules.professionalLink.maxLength} characters` };
  }

  try {
    new URL(link);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Professional link must be a valid URL' };
  }
}

function validateTaskOwnerRegistration(data) {
  const errors = [];

  const firstNameResult = validateName(data.firstName, 'First name');
  if (!firstNameResult.valid) errors.push(firstNameResult.error);

  const lastNameResult = validateName(data.lastName, 'Last name');
  if (!lastNameResult.valid) errors.push(lastNameResult.error);

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) errors.push(emailResult.error);

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.valid) errors.push(...passwordResult.errors);

  const orgResult = validateOrganisationName(data.organisationName);
  if (!orgResult.valid) errors.push(orgResult.error);

  if (!data.organisationType) {
    errors.push('Organisation type is required');
  }

  if (!data.country) {
    errors.push('Country is required');
  }

  return { valid: errors.length === 0, errors };
}

function validateSolutionProviderRegistration(data) {
  const errors = [];

  const firstNameResult = validateName(data.firstName, 'First name');
  if (!firstNameResult.valid) errors.push(firstNameResult.error);

  const lastNameResult = validateName(data.lastName, 'Last name');
  if (!lastNameResult.valid) errors.push(lastNameResult.error);

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) errors.push(emailResult.error);

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.valid) errors.push(...passwordResult.errors);

  const bioResult = validateBio(data.bio, true);
  if (!bioResult.valid) errors.push(bioResult.error);

  if (!data.country) {
    errors.push('Country is required');
  }

  if (!data.expertise || !Array.isArray(data.expertise) || data.expertise.length === 0) {
    if (typeof data.expertise === 'string' && data.expertise.trim()) {
    } else {
      errors.push('At least one area of expertise is required');
    }
  }

  const linkResult = validateProfessionalLink(data.professionalLink);
  if (!linkResult.valid) errors.push(linkResult.error);

  return { valid: errors.length === 0, errors };
}

function validateTaskCreation(data) {
  const errors = [];

  const titleResult = validateTaskTitle(data.title);
  if (!titleResult.valid) errors.push(titleResult.error);

  const summaryResult = validateTaskSummary(data.summary);
  if (!summaryResult.valid) errors.push(summaryResult.error);

  const descriptionResult = validateTaskDescription(data.description);
  if (!descriptionResult.valid) errors.push(descriptionResult.error);

  if (!data.location) {
    errors.push('Location is required');
  }

  if (!data.duration) {
    errors.push('Duration is required');
  }

  return { valid: errors.length === 0, errors };
}

function validateProposalCreation(data) {
  const errors = [];

  if (!data.task) {
    errors.push('Task ID is required');
  }

  const messageResult = validateProposalMessage(data.message);
  if (!messageResult.valid) errors.push(messageResult.error);

  return { valid: errors.length === 0, errors };
}

module.exports = {
  validationRules,
  validatePassword,
  validateName,
  validateOrganisationName,
  validateBio,
  validateTaskTitle,
  validateTaskDescription,
  validateTaskSummary,
  validateProposalMessage,
  validateEmail,
  validateRole,
  validateProfessionalLink,
  validateTaskOwnerRegistration,
  validateSolutionProviderRegistration,
  validateTaskCreation,
  validateProposalCreation,
};
