// utils/matcher.js

/**
 * Enhanced job matching algorithm for GlobalHealth.Works
 * Calculates compatibility score between Solution Providers and Tasks
 */

const WEIGHTS = {
  skills: 10,           // High weight - core competency match
  focusAreas: 8,        // Important - domain alignment
  languages: 4,         // Useful for communication
  location: 3,          // Bonus for local expertise
  experienceLevel: 5,   // Experience tier matching
  availability: 4,      // Can start when needed
  budgetFit: 3,         // Budget expectations align
};

const EXPERIENCE_LEVELS = {
  'junior': 1,
  'entry': 1,
  'mid': 2,
  'intermediate': 2,
  'senior': 3,
  'expert': 4,
  'lead': 4,
};

/**
 * Calculate match score between a solution provider and task
 * @param {Object} sp - Solution Provider profile
 * @param {Object} task - Task details
 * @param {boolean} detailed - If true, returns full breakdown; if false, returns numeric score (backward compatible)
 * @returns {number|Object} - Numeric score (default) or full breakdown object
 */
function calculateMatchScore(sp, task, detailed = false) {
  const breakdown = {
    skills: 0,
    focusAreas: 0,
    languages: 0,
    location: 0,
    experienceLevel: 0,
    availability: 0,
    budgetFit: 0,
  };

  // Skills match - core competency alignment
  const spSkills = normalizeArray(sp.expertise || sp.skills || []);
  const taskSkills = normalizeArray(task.requiredSkills || []);
  
  if (taskSkills.length > 0) {
    const skillMatches = taskSkills.filter(skill => 
      spSkills.some(spSkill => fuzzyMatch(spSkill, skill))
    );
    const skillMatchRate = skillMatches.length / taskSkills.length;
    breakdown.skills = Math.round(skillMatchRate * WEIGHTS.skills * 10);
  }

  // Focus areas match - domain expertise
  const spFocusAreas = normalizeArray(sp.focusAreas || []);
  const taskFocusAreas = normalizeArray(task.focusAreas || []);
  
  if (taskFocusAreas.length > 0) {
    const focusMatches = taskFocusAreas.filter(area =>
      spFocusAreas.some(spArea => fuzzyMatch(spArea, area))
    );
    const focusMatchRate = focusMatches.length / taskFocusAreas.length;
    breakdown.focusAreas = Math.round(focusMatchRate * WEIGHTS.focusAreas * 10);
  }

  // Language match - communication capability
  const spLanguages = normalizeArray(sp.languages || []);
  const taskLanguages = normalizeArray(task.languages || []);
  
  if (taskLanguages.length > 0) {
    const langMatches = taskLanguages.filter(lang =>
      spLanguages.some(spLang => fuzzyMatch(spLang, lang))
    );
    const langMatchRate = langMatches.length / taskLanguages.length;
    breakdown.languages = Math.round(langMatchRate * WEIGHTS.languages * 10);
  }

  // Location match - local expertise bonus
  if (sp.country && task.location) {
    if (normalizeString(sp.country) === normalizeString(task.location)) {
      breakdown.location = WEIGHTS.location * 10;
    } else if (task.remote === true || task.isRemote === true) {
      breakdown.location = Math.round(WEIGHTS.location * 5); // Partial credit for remote tasks
    }
  } else if (task.remote === true || task.isRemote === true) {
    breakdown.location = Math.round(WEIGHTS.location * 8); // Remote-friendly bonus
  }

  // Experience level match
  const spLevel = EXPERIENCE_LEVELS[normalizeString(sp.experienceLevel)] || 2;
  const taskLevel = EXPERIENCE_LEVELS[normalizeString(task.experienceLevel)] || 2;
  
  if (spLevel >= taskLevel) {
    const levelDiff = spLevel - taskLevel;
    const levelScore = levelDiff === 0 ? 1 : levelDiff === 1 ? 0.8 : 0.6;
    breakdown.experienceLevel = Math.round(levelScore * WEIGHTS.experienceLevel * 10);
  } else {
    // Under-qualified but close
    const levelDiff = taskLevel - spLevel;
    breakdown.experienceLevel = Math.round((1 - levelDiff * 0.3) * WEIGHTS.experienceLevel * 5);
  }

  // Availability match
  if (sp.availability && task.startDate) {
    const spAvailable = sp.availability === 'immediate' || sp.availability === 'available';
    const taskUrgent = task.urgency === 'high' || task.urgency === 'urgent';
    
    if (spAvailable && taskUrgent) {
      breakdown.availability = WEIGHTS.availability * 10;
    } else if (spAvailable || !taskUrgent) {
      breakdown.availability = Math.round(WEIGHTS.availability * 7);
    }
  } else {
    breakdown.availability = Math.round(WEIGHTS.availability * 5); // Default neutral
  }

  // Budget fit (if both have budget info)
  if (sp.hourlyRate && task.budget) {
    const taskBudget = parseFloat(task.budget) || 0;
    const spRate = parseFloat(sp.hourlyRate) || 0;
    
    if (spRate > 0 && taskBudget > 0) {
      if (spRate <= taskBudget) {
        breakdown.budgetFit = WEIGHTS.budgetFit * 10;
      } else if (spRate <= taskBudget * 1.2) {
        breakdown.budgetFit = Math.round(WEIGHTS.budgetFit * 6);
      }
    }
  }

  // Calculate total score
  const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const maxPossible = Object.values(WEIGHTS).reduce((sum, w) => sum + w * 10, 0);
  const percentage = Math.round((totalScore / maxPossible) * 100);

  // Backward compatibility: return numeric score by default
  if (!detailed) {
    return totalScore;
  }

  return {
    score: totalScore,
    percentage,
    breakdown,
    matchLevel: getMatchLevel(percentage),
    matchedSkills: getMatchedItems(sp.expertise || sp.skills || [], task.requiredSkills || []),
    matchedFocusAreas: getMatchedItems(sp.focusAreas || [], task.focusAreas || []),
  };
}

/**
 * Get match level label based on percentage
 */
function getMatchLevel(percentage) {
  if (percentage >= 85) return 'excellent';
  if (percentage >= 70) return 'strong';
  if (percentage >= 50) return 'good';
  if (percentage >= 30) return 'moderate';
  return 'low';
}

/**
 * Get list of matched items between two arrays
 */
function getMatchedItems(arr1, arr2) {
  const normalized1 = normalizeArray(arr1);
  const normalized2 = normalizeArray(arr2);
  
  return normalized2.filter(item => 
    normalized1.some(item1 => fuzzyMatch(item1, item))
  );
}

/**
 * Fuzzy string matching for skills/areas
 */
function fuzzyMatch(str1, str2) {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  // Exact match
  if (s1 === s2) return true;
  
  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return true;
  
  // Word overlap (for multi-word skills)
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w));
  
  if (commonWords.length >= Math.min(words1.length, words2.length) * 0.5) {
    return true;
  }
  
  return false;
}

/**
 * Normalize string for comparison
 */
function normalizeString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().trim().replace(/[-_]/g, ' ');
}

/**
 * Normalize array items
 */
function normalizeArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => normalizeString(item)).filter(Boolean);
}

/**
 * Find top matches for a task from a list of solution providers
 * @param {Array} providers - List of solution provider profiles
 * @param {Object} task - Task to match against
 * @param {number} limit - Maximum results to return
 * @returns {Array} - Sorted list of matches with scores
 */
function findTopMatches(providers, task, limit = 10) {
  const matches = providers
    .map(sp => ({
      provider: sp,
      ...calculateMatchScore(sp, task, true),
    }))
    .filter(match => match.percentage > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return matches;
}

/**
 * Find recommended tasks for a solution provider
 * @param {Object} provider - Solution provider profile
 * @param {Array} tasks - List of available tasks
 * @param {number} limit - Maximum results to return
 * @returns {Array} - Sorted list of recommended tasks with scores
 */
function findRecommendedTasks(provider, tasks, limit = 10) {
  const recommendations = tasks
    .map(task => ({
      task,
      ...calculateMatchScore(provider, task, true),
    }))
    .filter(rec => rec.percentage > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return recommendations;
}

/**
 * Get detailed match score (convenience function)
 * @param {Object} sp - Solution Provider profile
 * @param {Object} task - Task details
 * @returns {Object} - Full breakdown object with score, percentage, matchedSkills, etc.
 */
function getDetailedMatchScore(sp, task) {
  return calculateMatchScore(sp, task, true);
}

module.exports = { 
  calculateMatchScore, 
  getDetailedMatchScore,
  findTopMatches, 
  findRecommendedTasks,
  getMatchLevel,
  WEIGHTS,
};
