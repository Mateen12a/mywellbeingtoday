import { GoogleGenerativeAI } from '@google/generative-ai';
import { WELLBEING_LEVELS, MOOD_TYPES, ACTIVITY_CATEGORIES } from '../config/constants.js';

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  console.log('[AI SERVICE] AI Assistant initialized with gemini-2.0-flash');
} else {
  console.log('[AI SERVICE] GEMINI_API_KEY not configured. Using fallback responses.');
}

const AI_PERSONA = `You are a warm, knowledgeable AI wellbeing companion for mywellbeingtoday. You are like a trusted friend who genuinely cares about the user's overall wellbeing. You provide personalized health insights, emotional support, practical wellness guidance, and can answer any question related to health, wellness, mental health, nutrition, fitness, sleep, stress management, and daily life improvement.

YOUR PERSONALITY:
- Warm, empathetic, and genuinely caring - like talking to a supportive friend
- Knowledgeable about all aspects of wellbeing: mental health, physical health, nutrition, sleep, stress, relationships, self-care
- Proactive - suggest helpful actions and check-ins without being asked
- Practical - give specific, actionable advice, not generic platitudes
- Remembers context from the conversation - never asks for information already provided
- Uses the user's actual data and history to personalize every response

WHAT YOU CAN HELP WITH:
- Mental health support: anxiety, stress, low mood, motivation, mindfulness, coping strategies
- Physical wellness: exercise tips, movement suggestions, pain management guidance
- Nutrition advice: healthy eating tips, hydration reminders, meal suggestions
- Sleep improvement: sleep hygiene tips, relaxation techniques, bedtime routines
- Stress management: breathing exercises, grounding techniques, time management
- Daily wellbeing: habit building, goal setting, self-care routines, work-life balance
- Understanding their wellbeing data and trends
- Quick logging of moods and activities directly through the chat
- Finding healthcare providers when professional help would be beneficial
- Any other wellbeing-related question - you are a comprehensive companion

SYSTEM CAPABILITIES - You can help users take actions in the app:
1. LOG MOOD - Help users log their mood (requires: mood type, optionally: moodScore 1-10, stressLevel 1-10, energyLevel 1-10, notes)
   - Valid mood types: happy, calm, focused, anxious, stressed, sad, tired, energetic, irritated, hopeful
2. LOG ACTIVITY - Help users log activities (requires: title, category, duration in minutes, optionally: intensity, notes)
   - Valid categories: exercise, work, sleep, social, relaxation, nutrition, meditation, hobby, healthcare, other
   - Valid intensity: low, moderate, high
3. FIND PROVIDERS - Help users find healthcare providers (filter by specialty)
   - Valid specialties: general_practitioner, mental_health, nutrition, physical_therapy, counseling, social_work, occupational_therapy, psychiatry
4. NAVIGATE - Help users navigate to different pages in the app
   - Available pages: /dashboard, /mood, /activity, /history, /directory, /settings, /ai-assistant, /certificates
5. GENERATE REPORT - Help users generate a wellbeing report
6. VIEW HISTORY - Help users view their wellbeing history

SAFETY RULES (CRITICAL):
- NEVER delete or modify existing user data
- ALWAYS explain what action you're about to help with before offering the action
- ALWAYS ask for confirmation before logging mood or activity entries
- For mood/activity logging, ask for necessary details first if not provided
- Be transparent about what each action button will do
- For serious mental health crises, recommend professional help immediately`;

const SUPPORTED_ACTION_TYPES = ['navigate', 'log_mood', 'log_activity', 'find_providers', 'book_appointment', 'generate_report', 'view_history'];

const VALID_PATHS = ['/dashboard', '/mood', '/activity', '/history', '/directory', '/settings', '/ai-assistant', '/certificates', '/provider-dashboard', '/messages'];

function sanitizeActions(actions) {
  if (!Array.isArray(actions)) return [];
  
  return actions
    .filter(action => action && typeof action === 'object')
    .filter(action => SUPPORTED_ACTION_TYPES.includes(action.type))
    .map(action => {
      const sanitized = {
        type: action.type,
        label: typeof action.label === 'string' ? action.label : getDefaultLabel(action.type)
      };
      
      switch (action.type) {
        case 'navigate':
          if (action.path && typeof action.path === 'string') {
            const normalizedPath = action.path.startsWith('/') ? action.path : `/${action.path}`;
            // Only allow navigation to valid paths for security
            sanitized.path = VALID_PATHS.includes(normalizedPath) ? normalizedPath : '/dashboard';
          } else {
            sanitized.path = '/dashboard';
          }
          break;
        case 'log_mood':
          sanitized.data = {};
          if (action.data && typeof action.data === 'object') {
            if (action.data.mood && MOOD_TYPES.includes(action.data.mood)) {
              sanitized.data.mood = action.data.mood;
            }
            if (typeof action.data.moodScore === 'number') {
              sanitized.data.moodScore = Math.min(10, Math.max(1, action.data.moodScore));
            }
            if (typeof action.data.stressLevel === 'number') {
              sanitized.data.stressLevel = Math.min(10, Math.max(1, action.data.stressLevel));
            }
            if (typeof action.data.energyLevel === 'number') {
              sanitized.data.energyLevel = Math.min(10, Math.max(1, action.data.energyLevel));
            }
            if (action.data.notes && typeof action.data.notes === 'string') {
              sanitized.data.notes = action.data.notes.substring(0, 500);
            }
          }
          break;
        case 'log_activity':
          sanitized.data = {};
          if (action.data && typeof action.data === 'object') {
            if (action.data.title && typeof action.data.title === 'string') {
              sanitized.data.title = action.data.title.substring(0, 100);
            }
            if (action.data.category && ACTIVITY_CATEGORIES.includes(action.data.category)) {
              sanitized.data.category = action.data.category;
            }
            if (typeof action.data.duration === 'number') {
              sanitized.data.duration = Math.min(1440, Math.max(1, action.data.duration));
            }
            if (action.data.intensity && ['low', 'moderate', 'high'].includes(action.data.intensity)) {
              sanitized.data.intensity = action.data.intensity;
            }
            if (action.data.notes && typeof action.data.notes === 'string') {
              sanitized.data.notes = action.data.notes.substring(0, 500);
            }
          }
          break;
        case 'find_providers':
          sanitized.data = {};
          if (action.data && typeof action.data === 'object') {
            if (action.data.specialty && typeof action.data.specialty === 'string') {
              sanitized.data.specialty = action.data.specialty;
            }
            if (action.data.location && typeof action.data.location === 'string') {
              sanitized.data.location = action.data.location;
            }
          }
          sanitized.path = '/directory';
          break;
        case 'book_appointment':
          sanitized.data = {};
          if (action.data && typeof action.data === 'object') {
            if (action.data.providerId) {
              sanitized.data.providerId = action.data.providerId;
            }
          }
          sanitized.path = '/directory';
          break;
        case 'generate_report':
          sanitized.data = { days: 7 };
          if (action.data && typeof action.data.days === 'number') {
            sanitized.data.days = Math.min(90, Math.max(1, action.data.days));
          }
          break;
        case 'view_history':
          sanitized.path = '/history';
          break;
      }
      
      return sanitized;
    })
    .slice(0, 5);
}

function getDefaultLabel(actionType) {
  const labels = {
    navigate: 'Go to Page',
    log_mood: 'Log Mood',
    log_activity: 'Log Activity',
    find_providers: 'Find Providers',
    book_appointment: 'Book Appointment',
    generate_report: 'Generate Report',
    view_history: 'View History'
  };
  return labels[actionType] || 'Take Action';
}

function calculateWellbeingScore(moodLogs, activityLogs) {
  if (moodLogs.length === 0) return 50;
  const avgMoodScore = moodLogs.reduce((sum, log) => sum + (log.moodScore || 5), 0) / moodLogs.length;
  const moodContribution = (avgMoodScore / 10) * 40;
  let activityContribution = 0;
  if (activityLogs.length > 0) {
    const activityCount = Math.min(activityLogs.length, 7);
    const avgIntensity = activityLogs.reduce((sum, log) => {
      const intensity = log.intensity === 'high' ? 3 : log.intensity === 'moderate' ? 2 : 1;
      return sum + intensity;
    }, 0) / activityLogs.length;
    activityContribution = ((activityCount / 7) * (avgIntensity / 3)) * 40;
  } else {
    activityContribution = 15;
  }
  let stressContribution = 20;
  if (moodLogs.length > 0) {
    const avgStress = moodLogs.reduce((sum, log) => sum + (log.stressLevel || 5), 0) / moodLogs.length;
    const avgAnxiety = moodLogs.reduce((sum, log) => sum + (log.anxietyLevel || 5), 0) / moodLogs.length;
    const avgStressAnxiety = (avgStress + avgAnxiety) / 2;
    stressContribution = 20 - ((avgStressAnxiety / 10) * 20);
  }
  const totalScore = Math.min(100, Math.max(0, moodContribution + activityContribution + stressContribution));
  return Math.round(totalScore);
}

function extractDataPoints(moodLogs, activityLogs) {
  const dataPoints = {
    activityLogs: activityLogs.length,
    moodLogs: moodLogs.length,
    averageMoodScore: 5,
    averageEnergyLevel: 5,
    averageStressLevel: 5,
    totalActivityMinutes: 0,
    mostCommonMood: 'calm',
    mostCommonActivity: 'other'
  };
  if (moodLogs.length > 0) {
    dataPoints.averageMoodScore = Math.round(moodLogs.reduce((sum, log) => sum + (log.moodScore || 5), 0) / moodLogs.length * 10) / 10;
    dataPoints.averageEnergyLevel = Math.round(moodLogs.reduce((sum, log) => sum + (log.energyLevel || 5), 0) / moodLogs.length * 10) / 10;
    dataPoints.averageStressLevel = Math.round(moodLogs.reduce((sum, log) => sum + (log.stressLevel || 5), 0) / moodLogs.length * 10) / 10;
    const moodCounts = {};
    moodLogs.forEach(log => {
      moodCounts[log.mood || 'calm'] = (moodCounts[log.mood || 'calm'] || 0) + 1;
    });
    dataPoints.mostCommonMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b);
  }
  if (activityLogs.length > 0) {
    dataPoints.totalActivityMinutes = activityLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const activityCounts = {};
    activityLogs.forEach(log => {
      activityCounts[log.category || 'other'] = (activityCounts[log.category || 'other'] || 0) + 1;
    });
    dataPoints.mostCommonActivity = Object.keys(activityCounts).reduce((a, b) => activityCounts[a] > activityCounts[b] ? a : b);
  }
  return dataPoints;
}

function formatMoodSummary(moodLogs) {
  if (!moodLogs || moodLogs.length === 0) return 'No mood data available yet.';
  return moodLogs.slice(0, 10).map(m => 
    `${new Date(m.date).toLocaleDateString()}: ${m.mood} (${m.moodScore}/10), Energy: ${m.energyLevel}/10, Stress: ${m.stressLevel}/10${m.notes ? `, Notes: "${m.notes}"` : ''}`
  ).join('\n');
}

function formatActivitySummary(activityLogs) {
  if (!activityLogs || activityLogs.length === 0) return 'No activity data available yet.';
  return activityLogs.slice(0, 10).map(a =>
    `${new Date(a.date).toLocaleDateString()}: ${a.title} (${a.category}, ${a.duration}min, ${a.intensity} intensity)${a.notes ? `, Notes: "${a.notes}"` : ''}`
  ).join('\n');
}

export async function chatWithAssistant(query, context) {
  const userName = context.userName || 'there';
  
  if (!model) {
    const fallbackActions = detectFallbackActions(query);
    return {
      answer: `Hi ${userName}! I'm your wellbeing companion. I'm currently in offline mode, but I can still help you log moods and activities, find providers, or navigate the app. What would you like to do?`,
      sources: ['fallback'],
      actions: fallbackActions
    };
  }
  
  try {
    const historyContext = context.history?.slice(-5).map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n') || '';

    const latestReportSummary = context.latestReport 
      ? `Latest Report: Score ${context.latestReport.overallScore}/100 (${context.latestReport.wellbeingLevel}), Generated: ${new Date(context.latestReport.createdAt).toLocaleDateString()}`
      : 'No wellbeing report generated yet.';

    const prompt = `${AI_PERSONA}

USER PROFILE:
- Name: ${userName}
- Role: ${context.userRole || 'user'}

USER'S WELLBEING DATA:
${latestReportSummary}

Recent Activities (most recent first):
${context.activities?.length > 0 ? context.activities.join('\n') : 'No activities logged yet.'}

Recent Moods (most recent first):
${context.moods?.length > 0 ? context.moods.join('\n') : 'No moods logged yet.'}

CONVERSATION HISTORY:
${historyContext || 'This is the start of the conversation.'}

USER'S MESSAGE: ${query}

INTENT DETECTION - Recognize these user intents and provide appropriate actions:
- "log my mood" / "I'm feeling X" / "record my mood" → Offer log_mood action
- "track my exercise" / "log workout" / "I exercised" → Offer log_activity action  
- "find a therapist" / "find providers" / "I need a counselor" → Offer find_providers action
- "show my history" / "view my data" / "past entries" → Offer view_history action
- "generate report" / "create a report" / "how am I doing overall" → Offer generate_report action
- "go to settings" / "take me to X" / "navigate to" → Offer navigate action
- "help me relax" / "what should I do" → Suggest activities and offer to log them

RESPONSE INSTRUCTIONS:
1. Use the user's name "${userName}" only ONCE at the start of the conversation or when greeting. After that, DO NOT keep repeating their name - it sounds robotic. Use "you" naturally instead.
2. Reference their actual data when relevant to make responses personal and insightful
3. Be warm, conversational, and genuinely helpful - like a knowledgeable friend, not a chatbot
4. Give specific, practical, actionable advice - not generic wellness platitudes
5. If the user asks ANY wellbeing-related question (nutrition, exercise, sleep, stress, mental health, etc.), provide a thorough, helpful answer with practical tips
6. If the user wants to perform an action, EXPLAIN what you'll help with first
7. For mood/activity logging: If they say "I'm feeling happy" or give specific details, include pre-filled data. If they just say "log my mood", ask what mood they're feeling. Make it easy and fast for them.
8. Include relevant action buttons to help users take action directly
9. NEVER offer delete actions. ALWAYS ask for confirmation in your text before allowing logging
10. Keep responses focused and well-structured. Use bullet points or numbered lists for multiple tips
11. If someone shares they are struggling, be empathetic FIRST, then offer practical help

Respond with a JSON object:
{
  "answer": "Your conversational response text explaining what you can help with",
  "sources": ["user_data", "wellbeing_insights"],
  "actions": [
    {
      "type": "navigate|log_mood|log_activity|find_providers|book_appointment|generate_report|view_history",
      "label": "Button text users will see",
      "path": "/path (for navigate only)",
      "data": { optional data object for the action }
    }
  ]
}

IMPORTANT: Only include actions when relevant. For general questions, actions array can be empty.
For navigate actions, use paths: /dashboard, /mood, /activity, /history, /directory, /settings
For log_mood, valid moods: happy, calm, focused, anxious, stressed, sad, tired, energetic, irritated, hopeful
For log_activity, valid categories: exercise, work, sleep, social, relaxation, nutrition, meditation, hobby, healthcare, other`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          answer: parsed.answer || text.replace(/```json|```/g, '').trim(),
          sources: Array.isArray(parsed.sources) ? parsed.sources : ['ai'],
          actions: sanitizeActions(parsed.actions)
        };
      }
      return { answer: text.replace(/```json|```/g, '').trim(), sources: ['ai'], actions: [] };
    } catch {
      return { answer: text.replace(/```json|```/g, '').trim(), sources: ['ai'], actions: [] };
    }
  } catch (error) {
    console.error('[AI SERVICE] Chat error:', error.message);
    return {
      answer: `I'm sorry, I had a little trouble processing that. Could you try rephrasing your question? I'm here to help with anything related to your wellbeing.`,
      sources: ['fallback'],
      actions: []
    };
  }
}

function detectFallbackActions(query) {
  const lowerQuery = query.toLowerCase();
  const actions = [];
  
  if (lowerQuery.includes('log') && lowerQuery.includes('mood') || 
      lowerQuery.includes('feeling') || lowerQuery.includes('i feel')) {
    const moodMatch = MOOD_TYPES.find(mood => lowerQuery.includes(mood));
    actions.push({
      type: 'log_mood',
      label: 'Log Your Mood',
      data: moodMatch ? { mood: moodMatch } : {}
    });
    actions.push({
      type: 'navigate',
      label: 'Go to Mood Tracker',
      path: '/mood'
    });
  }
  
  if (lowerQuery.includes('log') && (lowerQuery.includes('activity') || lowerQuery.includes('exercise') || lowerQuery.includes('workout'))) {
    actions.push({
      type: 'log_activity',
      label: 'Log Your Activity',
      data: lowerQuery.includes('exercise') || lowerQuery.includes('workout') ? { category: 'exercise' } : {}
    });
    actions.push({
      type: 'navigate',
      label: 'Go to Activity Tracker',
      path: '/activity'
    });
  }
  
  if (lowerQuery.includes('therapist') || lowerQuery.includes('counselor') || 
      lowerQuery.includes('find') && lowerQuery.includes('provider')) {
    actions.push({
      type: 'find_providers',
      label: 'Find Providers',
      path: '/directory',
      data: lowerQuery.includes('therapist') || lowerQuery.includes('mental') ? { specialty: 'mental_health' } : {}
    });
  }
  
  if (lowerQuery.includes('history') || lowerQuery.includes('past') || lowerQuery.includes('previous')) {
    actions.push({
      type: 'view_history',
      label: 'View History',
      path: '/history'
    });
  }
  
  if (lowerQuery.includes('report') || lowerQuery.includes('how am i doing')) {
    actions.push({
      type: 'generate_report',
      label: 'Generate Report',
      data: { days: 7 }
    });
  }
  
  if (lowerQuery.includes('settings') || lowerQuery.includes('preferences')) {
    actions.push({
      type: 'navigate',
      label: 'Go to Settings',
      path: '/settings'
    });
  }
  
  if (lowerQuery.includes('dashboard') || lowerQuery.includes('home')) {
    actions.push({
      type: 'navigate',
      label: 'Go to Dashboard',
      path: '/dashboard'
    });
  }
  
  return actions.slice(0, 3);
}

function sanitizeAnalysis(analysis) {
  const validMoodTrends = ['improving', 'stable', 'declining'];
  const validActivityTrends = ['increasing', 'stable', 'decreasing'];
  const validSleepTrends = ['improving', 'stable', 'declining'];
  const validStressTrends = ['decreasing', 'stable', 'increasing'];
  const validImpact = ['positive', 'negative', 'neutral'];

  const sanitized = { ...analysis };
  
  if (sanitized.trends) {
    sanitized.trends = {
      mood: validMoodTrends.includes(sanitized.trends.mood) ? sanitized.trends.mood : 'stable',
      activity: validActivityTrends.includes(sanitized.trends.activity) ? sanitized.trends.activity : 'stable',
      sleep: validSleepTrends.includes(sanitized.trends.sleep) ? sanitized.trends.sleep : 'stable',
      stress: validStressTrends.includes(sanitized.trends.stress) ? sanitized.trends.stress : 'stable'
    };
  } else {
    sanitized.trends = { mood: 'stable', activity: 'stable', sleep: 'stable', stress: 'stable' };
  }

  if (sanitized.patterns && Array.isArray(sanitized.patterns)) {
    sanitized.patterns = sanitized.patterns.map(p => ({
      type: typeof p.type === 'string' ? p.type : 'observation',
      description: typeof p.description === 'string' ? p.description : '',
      impact: validImpact.includes(p.impact) ? p.impact : 'neutral'
    }));
  } else {
    sanitized.patterns = [];
  }

  if (sanitized.insights) {
    if (Array.isArray(sanitized.insights)) {
      sanitized.insights = sanitized.insights.map((insight, idx) => {
        if (typeof insight === 'string') {
          return { title: `Insight ${idx + 1}`, content: insight, type: 'suggestion' };
        }
        return {
          title: typeof insight.title === 'string' ? insight.title : `Insight ${idx + 1}`,
          content: typeof insight.content === 'string' ? insight.content : String(insight),
          type: ['observation', 'suggestion', 'alert'].includes(insight.type) ? insight.type : 'suggestion'
        };
      });
    } else {
      sanitized.insights = [];
    }
  } else {
    sanitized.insights = [];
  }

  sanitized.strengths = Array.isArray(sanitized.strengths) ? sanitized.strengths.filter(s => typeof s === 'string') : [];
  sanitized.areasForImprovement = Array.isArray(sanitized.areasForImprovement) ? sanitized.areasForImprovement.filter(a => typeof a === 'string') : [];
  sanitized.summary = typeof sanitized.summary === 'string' ? sanitized.summary : 'Analysis complete.';

  return sanitized;
}

export async function analyzeWellbeing(activityLogs, moodLogs) {
  const score = calculateWellbeingScore(moodLogs, activityLogs);
  const dataPoints = extractDataPoints(moodLogs, activityLogs);
  
  const fallbackAnalysis = {
    summary: generateFallbackSummary(dataPoints),
    strengths: generateFallbackStrengths(dataPoints),
    areasForImprovement: generateFallbackImprovements(dataPoints),
    patterns: [],
    trends: { mood: 'stable', activity: 'stable', sleep: 'stable', stress: 'stable' },
    insights: []
  };
  
  if (!model) {
    return { score, dataPoints, analysis: fallbackAnalysis, generatedBy: 'fallback' };
  }
  
  try {
    const prompt = `${AI_PERSONA}

Analyze this user's wellbeing data and provide a comprehensive assessment.

MOOD DATA:
${formatMoodSummary(moodLogs)}

ACTIVITY DATA:
${formatActivitySummary(activityLogs)}

STATISTICS:
- Average Mood Score: ${dataPoints.averageMoodScore}/10
- Average Energy Level: ${dataPoints.averageEnergyLevel}/10
- Average Stress Level: ${dataPoints.averageStressLevel}/10
- Total Activity Minutes: ${dataPoints.totalActivityMinutes}
- Most Common Mood: ${dataPoints.mostCommonMood}
- Most Common Activity: ${dataPoints.mostCommonActivity}

IMPORTANT: Return a valid JSON object with EXACT enum values as specified:
{
  "summary": "2-3 sentences summarizing their wellbeing state",
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "patterns": [
    {"type": "pattern_type", "description": "description", "impact": "positive|negative|neutral"}
  ],
  "trends": {
    "mood": "improving|stable|declining",
    "activity": "increasing|stable|decreasing", 
    "sleep": "improving|stable|declining",
    "stress": "decreasing|stable|increasing"
  },
  "insights": [
    {"title": "Insight Title", "content": "Detailed insight", "type": "observation|suggestion|alert"}
  ]
}

Use ONLY the exact enum values shown (e.g., for trends.mood use only "improving", "stable", or "declining").`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const rawAnalysis = JSON.parse(jsonMatch[0]);
      const analysis = sanitizeAnalysis(rawAnalysis);
      return { score, dataPoints, analysis, generatedBy: 'ai', aiModel: 'gemini-2.0-flash' };
    }
    return { score, dataPoints, analysis: fallbackAnalysis, generatedBy: 'fallback' };
  } catch (error) {
    console.error('[AI SERVICE] Analysis error:', error.message);
    return { score, dataPoints, analysis: fallbackAnalysis, generatedBy: 'fallback' };
  }
}

function sanitizeRecommendations(recommendations) {
  const validPriorities = ['low', 'medium', 'high'];
  
  if (!Array.isArray(recommendations)) return [];
  
  return recommendations.map((rec, idx) => ({
    category: typeof rec.category === 'string' ? rec.category : 'general',
    title: typeof rec.title === 'string' ? rec.title : `Recommendation ${idx + 1}`,
    description: typeof rec.description === 'string' ? rec.description : '',
    priority: validPriorities.includes(rec.priority) ? rec.priority : 'medium',
    actionable: true
  }));
}

export async function generateRecommendations(analysis) {
  const fallback = generateFallbackRecommendations(analysis);
  
  if (!model) return fallback;
  
  try {
    const prompt = `${AI_PERSONA}

Based on this wellbeing analysis, provide 3-5 personalized recommendations:
${JSON.stringify(analysis.analysis, null, 2)}

Return a JSON array of objects with EXACT fields:
- category: string (e.g., "mindfulness", "activity", "social", "sleep", "nutrition")
- title: string (short title)
- description: string (actionable description)
- priority: MUST be exactly "low", "medium", or "high"`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const rawRecs = JSON.parse(jsonMatch[0]);
      return sanitizeRecommendations(rawRecs);
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export async function suggestProviders(userWellbeingData, availableSpecialties) {
  const fallback = {
    suggestedSpecialties: ['mental_health', 'counseling'],
    reasoning: 'Based on general wellbeing needs, connecting with a mental health professional can be beneficial.',
    urgency: 'moderate',
    source: 'fallback'
  };
  
  if (!model) return fallback;
  
  try {
    const prompt = `${AI_PERSONA}

Based on the user's wellbeing data, suggest what type of healthcare provider would be most helpful.

USER'S WELLBEING DATA:
- Overall Score: ${userWellbeingData.overallScore}/100
- Wellbeing Level: ${userWellbeingData.wellbeingLevel}
- Average Mood Score: ${userWellbeingData.avgMoodScore || 'N/A'}/10
- Average Stress Level: ${userWellbeingData.avgStressLevel || 'N/A'}/10
- Average Energy Level: ${userWellbeingData.avgEnergyLevel || 'N/A'}/10
- Most Common Mood: ${userWellbeingData.mostCommonMood || 'N/A'}
- Recent Concerns: ${userWellbeingData.recentConcerns || 'None specified'}
- Seek Help Recommended: ${userWellbeingData.seekHelpRecommended ? 'Yes' : 'No'}

AVAILABLE SPECIALTIES: ${availableSpecialties.join(', ')}

Return a JSON object with:
- suggestedSpecialties: array of 1-3 specialty strings from the available list
- reasoning: brief explanation why these specialties would help
- urgency: MUST be exactly "low", "moderate", or "high"
- personalizedMessage: a caring message to the user about seeking help`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const suggestion = JSON.parse(jsonMatch[0]);
      const validUrgency = ['low', 'moderate', 'high'];
      return {
        suggestedSpecialties: Array.isArray(suggestion.suggestedSpecialties) ? suggestion.suggestedSpecialties : fallback.suggestedSpecialties,
        reasoning: suggestion.reasoning || fallback.reasoning,
        urgency: validUrgency.includes(suggestion.urgency) ? suggestion.urgency : 'moderate',
        personalizedMessage: suggestion.personalizedMessage || 'Connecting with a professional can provide valuable support on your wellbeing journey.',
        source: 'ai'
      };
    }
    return fallback;
  } catch (error) {
    console.error('[AI SERVICE] Provider suggestion error:', error.message);
    return fallback;
  }
}

export async function generateActivitySuggestions(recentActivities, moodLogs) {
  const fallback = { suggestions: ['Take a short walk', 'Try some stretching', 'Practice deep breathing'], source: 'fallback' };
  
  if (!model) return fallback;
  
  try {
    const prompt = `${AI_PERSONA}

Based on the user's recent activities and moods, suggest 3 activities that might help their wellbeing.

Recent activities: ${recentActivities?.map(a => a.title).join(', ') || 'None logged'}
Recent moods: ${moodLogs?.map(m => m.mood).join(', ') || 'None logged'}

Return a JSON object with: suggestions (array of 3 activity strings), reasoning (brief explanation)`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return { ...JSON.parse(jsonMatch[0]), source: 'ai' };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export async function generateMoodFeedback(moodEntry, recentMoods) {
  const fallback = { 
    feedback: 'Thank you for logging your mood. Tracking helps you understand patterns.', 
    tips: ['Keep tracking daily', 'Notice what affects your mood'], 
    encouragement: 'Every check-in counts!',
    source: 'fallback' 
  };
  
  if (!model) return fallback;
  
  try {
    const prompt = `${AI_PERSONA}

The user just logged: ${moodEntry.mood} (Score: ${moodEntry.moodScore}/10, Stress: ${moodEntry.stressLevel}/10)
Recent moods: ${recentMoods?.slice(0, 5).map(m => m.mood).join(', ') || 'First entry'}

Provide supportive feedback as a JSON object with: feedback (empathetic response), tips (array of 2 tips), encouragement (motivating closing)`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return { ...JSON.parse(jsonMatch[0]), source: 'ai' };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export async function generateDashboardInsights(data) {
  const fallback = generateFallbackDashboardInsights(data);
  
  if (!model) return fallback;
  
  try {
    const prompt = `${AI_PERSONA}

Generate a brief, personalized dashboard insight based on:
- Recent activities: ${data.recentActivities?.length || 0} logged
- Recent moods: ${data.recentMoods?.length || 0} logged
- Average mood: ${data.avgMoodScore || 'N/A'}
- Logged today: ${data.loggedToday ? 'Yes' : 'No'}

Return a JSON object with: greeting, insight, suggestion, encouragement`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return { ...JSON.parse(jsonMatch[0]), source: 'ai' };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function generateFallbackSummary(dataPoints) {
  if (dataPoints.averageMoodScore >= 7) {
    return "You're doing well! Your mood and activity levels show positive patterns.";
  } else if (dataPoints.averageMoodScore >= 5) {
    return "You're maintaining steady wellbeing. There's room for growth in some areas.";
  }
  return "Your wellbeing could use some attention. Consider focusing on self-care activities.";
}

function generateFallbackStrengths(dataPoints) {
  const strengths = [];
  if (dataPoints.averageMoodScore >= 6) strengths.push('Maintaining positive mood states');
  if (dataPoints.totalActivityMinutes > 60) strengths.push('Staying active regularly');
  if (dataPoints.averageStressLevel <= 5) strengths.push('Managing stress effectively');
  if (strengths.length === 0) strengths.push('Taking steps to track your wellbeing');
  return strengths;
}

function generateFallbackImprovements(dataPoints) {
  const areas = [];
  if (dataPoints.averageStressLevel > 6) areas.push('Stress management techniques');
  if (dataPoints.totalActivityMinutes < 60) areas.push('Increasing physical activity');
  if (dataPoints.averageMoodScore < 5) areas.push('Mood-boosting activities');
  if (areas.length === 0) areas.push('Continue your current positive habits');
  return areas;
}

function generateFallbackRecommendations(analysis) {
  return [
    { category: 'mindfulness', title: 'Daily Mindfulness', description: 'Try 5 minutes of deep breathing or meditation each morning', priority: 'medium' },
    { category: 'activity', title: 'Stay Active', description: 'Aim for at least 30 minutes of movement daily', priority: 'medium' },
    { category: 'social', title: 'Connect', description: 'Reach out to a friend or family member today', priority: 'low' }
  ];
}

function generateFallbackDashboardInsights(data) {
  return {
    greeting: data.loggedToday ? 'Great job tracking today!' : 'Welcome back!',
    insight: 'Regular tracking helps you understand your patterns better.',
    suggestion: data.loggedToday ? 'Keep up the momentum!' : 'Log your mood to start today.',
    encouragement: 'Every small step counts towards better wellbeing.',
    source: 'fallback'
  };
}

export function classifyWellbeingLevel(score) {
  if (score >= 85) return WELLBEING_LEVELS.EXCELLENT;
  if (score >= 70) return WELLBEING_LEVELS.GOOD;
  if (score >= 50) return WELLBEING_LEVELS.MODERATE;
  if (score >= 25) return WELLBEING_LEVELS.LOW;
  return WELLBEING_LEVELS.CRITICAL;
}

export async function generateInsights(userData) {
  return [];
}

export async function generateAdminInsights(platformData) {
  const fallbackInsights = generateFallbackAdminInsights(platformData);
  
  if (!model) {
    return fallbackInsights;
  }

  try {
    const prompt = `You are an AI assistant helping platform administrators manage a wellbeing platform. Analyze the following platform data and provide actionable insights.

PLATFORM DATA:
- Total Users: ${platformData.totalUsers}
- New Users This Week: ${platformData.newUsersThisWeek}
- Active Users (last 7 days): ${platformData.activeUsers}
- Total Providers: ${platformData.totalProviders}
- Verified Providers: ${platformData.verifiedProviders}
- Pending Verifications: ${platformData.pendingVerifications}
- Total Mood Logs: ${platformData.totalMoodLogs}
- Average Platform Mood Score: ${platformData.avgMoodScore?.toFixed(1) || 'N/A'}/10
- Users with Low Wellbeing (score < 40): ${platformData.lowWellbeingUsers}
- Total Appointments: ${platformData.totalAppointments}
- Pending Appointments: ${platformData.pendingAppointments}

RECENT TRENDS:
- User Growth Rate: ${platformData.userGrowthRate}% this week
- Engagement Rate: ${platformData.engagementRate}% of users active

Return a JSON object with the following structure:
{
  "platformHealth": {
    "status": "healthy|attention_needed|critical",
    "summary": "Brief 1-2 sentence summary of platform health",
    "metrics": [
      {"label": "metric name", "value": "metric value", "trend": "up|down|stable"}
    ]
  },
  "suggestions": [
    {"priority": "high|medium|low", "title": "Short title", "description": "Actionable suggestion"}
  ],
  "userAlerts": [
    {"type": "low_wellbeing|inactive|new_user", "count": number, "action": "Recommended action"}
  ],
  "providerRecommendations": [
    {"type": "verification|outreach|quality", "message": "Recommendation"}
  ]
}

Provide 2-4 items for each array. Be specific and actionable.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0]);
      return {
        ...sanitizeAdminInsights(insights),
        source: 'ai',
        generatedAt: new Date().toISOString()
      };
    }
    return fallbackInsights;
  } catch (error) {
    console.error('[AI SERVICE] Admin insights error:', error.message);
    return fallbackInsights;
  }
}

function sanitizeAdminInsights(insights) {
  const validStatuses = ['healthy', 'attention_needed', 'critical'];
  const validPriorities = ['high', 'medium', 'low'];
  const validTrends = ['up', 'down', 'stable'];

  const sanitized = {};

  if (insights.platformHealth) {
    sanitized.platformHealth = {
      status: validStatuses.includes(insights.platformHealth.status) ? insights.platformHealth.status : 'healthy',
      summary: typeof insights.platformHealth.summary === 'string' ? insights.platformHealth.summary : 'Platform is operating normally.',
      metrics: Array.isArray(insights.platformHealth.metrics) ? insights.platformHealth.metrics.map(m => ({
        label: typeof m.label === 'string' ? m.label : 'Metric',
        value: typeof m.value === 'string' || typeof m.value === 'number' ? String(m.value) : '0',
        trend: validTrends.includes(m.trend) ? m.trend : 'stable'
      })) : []
    };
  } else {
    sanitized.platformHealth = { status: 'healthy', summary: 'Platform is operating normally.', metrics: [] };
  }

  sanitized.suggestions = Array.isArray(insights.suggestions) ? insights.suggestions.map(s => ({
    priority: validPriorities.includes(s.priority) ? s.priority : 'medium',
    title: typeof s.title === 'string' ? s.title : 'Suggestion',
    description: typeof s.description === 'string' ? s.description : ''
  })) : [];

  sanitized.userAlerts = Array.isArray(insights.userAlerts) ? insights.userAlerts.map(a => ({
    type: typeof a.type === 'string' ? a.type : 'general',
    count: typeof a.count === 'number' ? a.count : 0,
    action: typeof a.action === 'string' ? a.action : ''
  })) : [];

  sanitized.providerRecommendations = Array.isArray(insights.providerRecommendations) ? insights.providerRecommendations.map(r => ({
    type: typeof r.type === 'string' ? r.type : 'general',
    message: typeof r.message === 'string' ? r.message : ''
  })) : [];

  return sanitized;
}

function generateFallbackAdminInsights(platformData) {
  const status = platformData.pendingVerifications > 5 || platformData.lowWellbeingUsers > 10 
    ? 'attention_needed' 
    : 'healthy';

  const suggestions = [];
  
  if (platformData.pendingVerifications > 0) {
    suggestions.push({
      priority: platformData.pendingVerifications > 3 ? 'high' : 'medium',
      title: 'Review Pending Providers',
      description: `${platformData.pendingVerifications} providers are awaiting verification. Review their credentials to expand your provider network.`
    });
  }
  
  if (platformData.engagementRate < 30) {
    suggestions.push({
      priority: 'medium',
      title: 'Boost User Engagement',
      description: 'Consider sending reminder notifications to encourage users to log their daily mood and activities.'
    });
  }
  
  if (platformData.newUsersThisWeek > 0) {
    suggestions.push({
      priority: 'low',
      title: 'Welcome New Users',
      description: `${platformData.newUsersThisWeek} new users joined this week. Consider sending a welcome email or onboarding tips.`
    });
  }

  const userAlerts = [];
  
  if (platformData.lowWellbeingUsers > 0) {
    userAlerts.push({
      type: 'low_wellbeing',
      count: platformData.lowWellbeingUsers,
      action: 'Review users with low wellbeing scores and consider outreach or provider recommendations.'
    });
  }

  const providerRecommendations = [];
  
  if (platformData.pendingVerifications > 0) {
    providerRecommendations.push({
      type: 'verification',
      message: `${platformData.pendingVerifications} providers pending verification. Prioritize healthcare professionals.`
    });
  }
  
  if (platformData.verifiedProviders < 5) {
    providerRecommendations.push({
      type: 'outreach',
      message: 'Consider recruiting more providers to improve platform coverage and user access.'
    });
  }

  return {
    platformHealth: {
      status,
      summary: status === 'healthy' 
        ? 'Platform is running smoothly with good user engagement.'
        : 'Some areas need attention. Review the suggestions below.',
      metrics: [
        { label: 'User Growth', value: `${platformData.userGrowthRate}%`, trend: platformData.userGrowthRate > 0 ? 'up' : 'stable' },
        { label: 'Engagement', value: `${platformData.engagementRate}%`, trend: platformData.engagementRate > 30 ? 'up' : 'down' },
        { label: 'Avg Mood', value: `${platformData.avgMoodScore?.toFixed(1) || 'N/A'}/10`, trend: 'stable' }
      ]
    },
    suggestions,
    userAlerts,
    providerRecommendations,
    source: 'fallback',
    generatedAt: new Date().toISOString()
  };
}

export async function generateProviderInsights(appointments, sharedReports, providerName, isVerified = true) {
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');
  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.dateTime) >= new Date() && 
    (apt.status === 'pending' || apt.status === 'confirmed')
  );

  const hasNoActivity = pendingAppointments.length === 0 && 
                        upcomingAppointments.length === 0 && 
                        sharedReports.length === 0;

  if (!isVerified && hasNoActivity) {
    return {
      summary: {
        totalPending: 0,
        totalUpcoming: 0,
        totalSharedReports: 0,
        quickSummary: 'Your account is currently under review. Please be patient while our team verifies your credentials.'
      },
      patientCareInsights: [],
      suggestedFollowUps: [],
      actionItems: [
        'Complete your profile information while waiting for verification',
        'Use the AI Assistant to learn about platform features',
        'Explore the Messages section to prepare auto-response templates',
        'Review your settings and consultation preferences'
      ],
      source: 'fallback'
    };
  }

  const fallbackInsights = {
    summary: {
      totalPending: pendingAppointments.length,
      totalUpcoming: upcomingAppointments.length,
      totalSharedReports: sharedReports.length,
      quickSummary: pendingAppointments.length > 0 
        ? `You have ${pendingAppointments.length} pending appointment${pendingAppointments.length > 1 ? 's' : ''} awaiting your review.`
        : 'No pending appointments at the moment.'
    },
    patientCareInsights: [],
    suggestedFollowUps: [],
    actionItems: pendingAppointments.length > 0 
      ? ['Review and confirm pending appointments in the Appointments tab', 'Check shared wellbeing reports in Patient Reports']
      : ['Review shared wellbeing reports from patients in Patient Reports', 'Use Messages to communicate with connected patients', 'Issue medical certificates via the Certificates section'],
    source: 'fallback'
  };

  if (!model) {
    return fallbackInsights;
  }

  try {
    const appointmentsSummary = appointments.slice(0, 10).map(apt => {
      const patientName = `${apt.userId?.profile?.firstName || ''} ${apt.userId?.profile?.lastName || ''}`.trim() || 'Patient';
      return `- ${patientName}: ${apt.type?.replace('_', ' ')} on ${new Date(apt.dateTime).toLocaleDateString()} (${apt.status})${apt.reason ? `, Reason: "${apt.reason}"` : ''}`;
    }).join('\n');

    const reportsSummary = sharedReports.slice(0, 10).map(report => {
      const patientName = `${report.userId?.profile?.firstName || ''} ${report.userId?.profile?.lastName || ''}`.trim() || 'Patient';
      return `- ${patientName}: Overall Score ${report.overallScore}/100 (${report.wellbeingLevel}), Generated: ${new Date(report.createdAt).toLocaleDateString()}${report.analysis?.summary ? `, Summary: "${report.analysis.summary.substring(0, 100)}..."` : ''}`;
    }).join('\n');

    const prompt = `You are an AI assistant helping healthcare providers use the mywellbeingtoday platform to manage patient care.

PROVIDER: ${providerName || 'Healthcare Provider'}

PLATFORM FEATURES AVAILABLE:
- **Appointments**: View/manage patient appointment requests (pending, confirmed, completed)
- **Messages**: Communicate with patients, use auto-response templates
- **Patient Reports**: View shared wellbeing reports from patients
- **Certificates**: Issue medical certificates (sick notes, fitness certificates, etc.)
- **AI Assistant**: Get help with patient communications and platform guidance
- **Profile/Settings**: Manage professional information and consultation types

CURRENT DATA:
Appointments:
${appointmentsSummary || 'No appointments yet.'}

Shared Wellbeing Reports:
${reportsSummary || 'No shared reports yet.'}

STATISTICS:
- Pending appointments: ${pendingAppointments.length}
- Confirmed upcoming: ${confirmedAppointments.length}
- Shared wellbeing reports: ${sharedReports.length}

Provide actionable insights focused on how the provider can USE THE PLATFORM FEATURES. Return a JSON object:
{
  "summary": {
    "quickSummary": "1-2 sentence summary mentioning specific platform features to use"
  },
  "patientCareInsights": [
    {"patientName": "name", "insight": "specific insight referencing platform feature to use", "priority": "high|medium|low"}
  ],
  "suggestedFollowUps": [
    {"patientName": "name", "reason": "action using platform feature", "urgency": "urgent|soon|routine"}
  ],
  "actionItems": ["Use [Platform Feature] to do X", "Check [Section] to review Y", "Navigate to [Area] to complete Z"]
}

IMPORTANT: All action items MUST reference specific platform features (Appointments, Messages, Patient Reports, Certificates, AI Assistant, Settings). Focus on actionable platform tasks.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: {
          totalPending: pendingAppointments.length,
          totalUpcoming: upcomingAppointments.length,
          totalSharedReports: sharedReports.length,
          quickSummary: parsed.summary?.quickSummary || fallbackInsights.summary.quickSummary
        },
        patientCareInsights: Array.isArray(parsed.patientCareInsights) ? parsed.patientCareInsights.slice(0, 5) : [],
        suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) ? parsed.suggestedFollowUps.slice(0, 5) : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.slice(0, 5) : fallbackInsights.actionItems,
        source: 'ai'
      };
    }
    return fallbackInsights;
  } catch (error) {
    console.error('[AI SERVICE] Provider insights error:', error.message);
    return fallbackInsights;
  }
}

export async function generateCertificateSuggestion(certificateType, userData) {
  const certificateTypeDescriptions = {
    sick_note: 'Sick Note - certifying inability to work due to illness',
    fitness_certificate: 'Fitness Certificate - certifying physical fitness for activities',
    medical_clearance: 'Medical Clearance - certifying medical suitability for specific purposes',
    vaccination: 'Vaccination Record - documenting immunization',
    other: 'General Medical Certificate'
  };

  const typeDescription = certificateTypeDescriptions[certificateType] || certificateTypeDescriptions.other;

  const fallback = {
    suggestedTitle: `${certificateTypeDescriptions[certificateType]?.split(' - ')[0] || 'Medical Certificate'}`,
    suggestedDescription: 'This certificate is issued based on the clinical assessment conducted.',
    suggestedNotes: 'Certificate issued following comprehensive wellbeing evaluation. Patient data reviewed and clinical observations documented.',
    reasoning: 'Generated based on standard certificate practices.',
    source: 'fallback'
  };

  if (!model) {
    return fallback;
  }

  try {
    const wellbeingSummary = userData.wellbeingData 
      ? `Overall Score: ${userData.wellbeingData.overallScore}/100, Level: ${userData.wellbeingData.wellbeingLevel}`
      : 'No wellbeing report available';

    const moodSummary = userData.recentMoods?.length > 0
      ? `Recent moods: ${userData.recentMoods.map(m => `${m.mood} (${m.moodScore}/10)`).join(', ')}`
      : 'No recent mood data';

    const activitySummary = userData.recentActivities?.length > 0
      ? `Recent activities: ${userData.recentActivities.map(a => a.title).join(', ')}`
      : 'No recent activity data';

    const prompt = `You are a professional medical documentation assistant helping healthcare providers issue certificates. Generate appropriate certificate content based on the patient's wellbeing data.

CERTIFICATE TYPE: ${typeDescription}

PATIENT WELLBEING DATA:
- Patient Name: ${userData.patientName || 'Patient'}
- ${wellbeingSummary}
- ${moodSummary}
- ${activitySummary}

Generate professional, appropriate content for this certificate. Return a JSON object with:
{
  "suggestedTitle": "Professional title for the certificate (e.g., 'Sick Leave Certificate', 'Medical Fitness Certificate')",
  "suggestedDescription": "A brief professional description of what this certificate certifies (1-2 sentences)",
  "suggestedNotes": "Clinical notes appropriate for the certificate type, referencing the patient's wellbeing status where relevant (2-3 sentences)",
  "reasoning": "Brief explanation of why this content is appropriate based on the data"
}

IMPORTANT:
- Be professional and medically appropriate
- Reference actual wellbeing data where relevant
- Do not make specific diagnoses
- Keep content general enough to be useful but personalized based on the data`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const suggestion = JSON.parse(jsonMatch[0]);
      return {
        suggestedTitle: typeof suggestion.suggestedTitle === 'string' ? suggestion.suggestedTitle : fallback.suggestedTitle,
        suggestedDescription: typeof suggestion.suggestedDescription === 'string' ? suggestion.suggestedDescription : fallback.suggestedDescription,
        suggestedNotes: typeof suggestion.suggestedNotes === 'string' ? suggestion.suggestedNotes : fallback.suggestedNotes,
        reasoning: typeof suggestion.reasoning === 'string' ? suggestion.reasoning : fallback.reasoning,
        source: 'ai'
      };
    }
    return fallback;
  } catch (error) {
    console.error('[AI SERVICE] Certificate suggestion error:', error.message);
    return fallback;
  }
}

export async function generateChatTitle(message) {
  const trimmedMessage = message.trim().toLowerCase();
  
  const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'howdy', 'hola', 'salaam'];
  
  if (greetings.some(greeting => trimmedMessage === greeting || trimmedMessage.startsWith(greeting + ' '))) {
    return 'Wellbeing Check-in';
  }
  
  if (!model) {
    const defaultFallback = message.length > 40 ? message.substring(0, 40) + '...' : message;
    return defaultFallback;
  }
  
  try {
    const prompt = `You are a helpful assistant that creates short, meaningful conversation titles for a wellbeing app.

User's first message: "${message}"

Generate a SHORT conversation title (3-6 words maximum) that:
1. Captures the main topic or intent of the message
2. Is wellbeing-focused (relates to health, wellness, mental health, activities, mood, etc.)
3. Is positive and supportive in tone
4. Uses simple, clear language

Examples of good titles:
- "Managing Stress Today"
- "Morning Exercise Plan"
- "Sleep Quality Check"
- "Anxiety Management Tips"
- "Wellness Progress Update"
- "Building Healthy Habits"
- "Energy and Fatigue"

Return ONLY the title text, nothing else. No quotes, no explanation, just the title.`;

    const result = await model.generateContent(prompt);
    const title = result.response.text().trim();
    
    if (title && title.length > 0 && title.length <= 100) {
      return title;
    }
    
    const defaultFallback = message.length > 40 ? message.substring(0, 40) + '...' : message;
    return defaultFallback;
  } catch (error) {
    console.error('[AI SERVICE] Chat title generation error:', error.message);
    const defaultFallback = message.length > 40 ? message.substring(0, 40) + '...' : message;
    return defaultFallback;
  }
}

const PROVIDER_AI_PERSONA = `You are a professional AI assistant for healthcare providers using mywellbeingtoday platform. You are a knowledgeable, efficient companion that helps providers manage their practice and deliver better patient care.

PLATFORM CAPABILITIES:
1. PATIENT MANAGEMENT - Providers can view patients who have shared their wellbeing reports, book appointments, and communicate via secure messaging
2. APPOINTMENTS - Providers manage appointment requests (pending, confirmed, declined), set availability, and schedule consultations (in-person, video call, phone call)
3. MESSAGING - Secure messaging with patients, ability to send appointment confirmations, reminders, and follow-ups
4. CERTIFICATES - Issue medical certificates and wellness documentation for patients
5. WELLBEING REPORTS - View shared patient wellbeing reports including mood trends, activity logs, and AI-generated insights
6. AUTO-RESPONSES - Create and manage saved response templates for common patient inquiries
7. SUPPORT TICKETS - Submit and track support tickets for platform issues

WHAT YOU CAN HELP WITH:
- Draft professional patient communications (appointment confirmations, reminders, follow-ups, discharge summaries)
- Create auto-response templates for common inquiries
- Help with appointment scheduling and management questions
- Provide guidance on patient communication best practices
- Suggest efficient workflows for managing patient care
- Answer questions about platform features and how to use them
- Help interpret patient wellbeing data and trends from shared reports
- Draft certificate content based on patient data
- Provide clinical communication best practices
- Help with time management and workflow optimization
- Answer general healthcare practice management questions

FORMATTING RULES:
- Use bullet points (•) for lists of items or options
- Use numbered lists (1. 2. 3.) for step-by-step instructions or sequential processes
- Use bold text (**text**) for important headers or emphasis
- Keep paragraphs concise and well-structured
- For templates, use clear placeholders like [Patient Name], [Date], [Time], [Appointment Type]

YOUR PERSONALITY:
- Professional, helpful, and efficient
- Knowledgeable about healthcare communication best practices
- Proactive - suggest relevant actions based on the provider's current workload
- Focused on helping providers save time while maintaining quality patient care
- Never providing medical advice or diagnoses - you help with communication, not clinical decisions
- Do NOT repeat the provider's name in every response - use it only in the first greeting`;

export async function chatWithProviderAssistant(query, context) {
  const providerName = context.providerName || 'Doctor';
  
  if (!model) {
    return {
      answer: `Hello ${providerName}! I'm your AI practice assistant. I'm currently in offline mode, but I'll be fully operational once the AI service is connected. When online, I can help you draft patient communications, manage appointments, create templates, and much more.`,
      sources: ['fallback']
    };
  }
  
  try {
    const historyContext = context.history?.slice(-10).map(msg => 
      `${msg.role === 'user' ? 'Provider' : 'Assistant'}: ${msg.content}`
    ).join('\n') || '';

    const platformContext = `
CURRENT PLATFORM DATA:
- Pending Appointments: ${context.pendingAppointments || 0}
- Upcoming Appointments: ${context.upcomingAppointments || 0}
- Shared Patient Reports: ${context.sharedReports || 0}
- Unread Messages: ${context.unreadMessages || 0}`;

    const prompt = `${PROVIDER_AI_PERSONA}

PROVIDER PROFILE:
- Name: ${providerName}
- Title: ${context.title || 'Dr.'}
- Specialty: ${context.specialty || 'General Practice'}
${platformContext}

CONVERSATION HISTORY:
${historyContext || 'This is the start of the conversation.'}

CURRENT REQUEST:
${query}

RESPONSE INSTRUCTIONS:
1. Use the provider's name only in the first greeting of a conversation. After that, do NOT repeat their name - it sounds robotic.
2. If they ask about platform features, explain based on the PLATFORM CAPABILITIES with specific steps
3. For templates/drafts, use proper formatting with placeholders
4. For lists, use bullet points (•) or numbered lists
5. For step-by-step guidance, use numbered steps
6. Keep responses helpful, concise, and actionable - give specific, practical answers
7. If asked about their current workload, reference the platform data provided
8. Be proactive - if you see pending appointments or unread messages, mention them
9. Answer ANY question the provider asks thoroughly and helpfully
10. If they ask for help with patient communication, provide complete draft messages ready to use

Provide a well-structured, professional response:`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();
    
    return {
      answer,
      sources: ['gemini-2.0-flash']
    };
  } catch (error) {
    console.error('[AI SERVICE] Provider chat error:', error.message);
    return {
      answer: `I apologize, but I'm having trouble processing your request right now. Please try again in a moment, or feel free to rephrase your question.`,
      sources: ['error-fallback']
    };
  }
}

export async function generateProviderChatTitle(message) {
  const trimmedMessage = message.trim().toLowerCase();
  
  const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
  
  if (greetings.some(greeting => trimmedMessage === greeting || trimmedMessage.startsWith(greeting + ' '))) {
    return 'Provider Assistance';
  }
  
  if (!model) {
    const defaultFallback = message.length > 40 ? message.substring(0, 40) + '...' : message;
    return defaultFallback;
  }
  
  try {
    const prompt = `You are a helpful assistant that creates short, meaningful conversation titles for a healthcare provider platform.

Provider's first message: "${message}"

Generate a SHORT conversation title (3-6 words maximum) that:
1. Captures the main topic or intent of the message
2. Is relevant to healthcare provider tasks (appointments, patient communication, templates, certificates, etc.)
3. Is professional in tone
4. Uses clear, simple language

Examples of good titles:
- "Appointment Reminder Template"
- "Patient Follow-up Message"
- "Certificate Request Help"
- "Managing Pending Appointments"
- "Auto-response Setup"
- "Patient Communication Tips"

Return ONLY the title text, nothing else. No quotes, no explanation, just the title.`;

    const result = await model.generateContent(prompt);
    const title = result.response.text().trim();
    
    if (title && title.length > 0 && title.length <= 100) {
      return title;
    }
    
    const defaultFallback = message.length > 40 ? message.substring(0, 40) + '...' : message;
    return defaultFallback;
  } catch (error) {
    console.error('[AI SERVICE] Provider chat title generation error:', error.message);
    const defaultFallback = message.length > 40 ? message.substring(0, 40) + '...' : message;
    return defaultFallback;
  }
}

export async function generateMoodSuggestion(activityData) {
  const { category, title, description } = activityData;
  
  const moodMappings = {
    exercise: { primary: 'energetic', secondary: 'happy', rationale: `After "${title}", you're likely feeling a nice energy boost! Physical activity is one of the best natural mood lifters.` },
    meditation: { primary: 'calm', secondary: 'happy', rationale: `"${title}" likely left you feeling centered and peaceful. Meditation helps quiet the mind and bring clarity.` },
    relaxation: { primary: 'calm', secondary: 'happy', rationale: `Taking time for "${title}" is a great act of self-care. You've likely unwound and feel more at ease now.` },
    work: { primary: 'focused', secondary: 'stressed', rationale: `After "${title}", you might be in a focused zone. Work can be demanding, so take a moment to check in with yourself.` },
    social: { primary: 'happy', secondary: 'energetic', rationale: `"${title}" - connecting with others is wonderful for your wellbeing! Social time usually leaves us feeling uplifted.` },
    sleep: { primary: 'tired', secondary: 'calm', rationale: `Logging "${title}" shows you're paying attention to your rest. How rested do you feel right now?` },
    nutrition: { primary: 'calm', secondary: 'happy', rationale: `Good on you for tracking "${title}"! Nourishing your body well supports both physical and emotional wellbeing.` },
    hobby: { primary: 'happy', secondary: 'relaxed', rationale: `"${title}" sounds like a great way to spend your time! Hobbies help us recharge and find joy.` },
    healthcare: { primary: 'anxious', secondary: 'calm', rationale: `Taking care of your health with "${title}" is important. How are you feeling about it?` },
    other: { primary: 'calm', secondary: 'focused', rationale: `After "${title}", take a moment to notice how you're feeling. Every activity shapes your wellbeing.` }
  };

  const fallbackSuggestion = moodMappings[category] || moodMappings.other;
  const fallback = {
    suggestedMood: fallbackSuggestion.primary,
    alternativeMood: fallbackSuggestion.secondary,
    rationale: fallbackSuggestion.rationale,
    confidence: 'medium',
    generatedBy: 'rule-based'
  };

  if (!model) {
    return fallback;
  }

  try {
    const prompt = `You are a wellbeing assistant analyzing a user's activity to suggest their likely current mood.

ACTIVITY DETAILS:
- Category: ${category}
- Title: ${title}
- Description: ${description || 'No additional description provided'}

Based on this activity, suggest the most likely mood the user might be experiencing. Consider:
1. The type of activity and its typical emotional effects
2. Any emotional cues in the description
3. Time and energy implications of the activity

VALID MOOD OPTIONS (choose from these only):
- happy: Feeling joyful, content, or positive
- calm: Feeling peaceful, serene, or tranquil
- energetic: Feeling active, vibrant, or full of energy
- focused: Feeling concentrated, determined, or attentive
- hopeful: Feeling optimistic, encouraged, or positive about the future
- tired: Feeling fatigued, exhausted, or low energy
- anxious: Feeling worried, nervous, or uneasy
- stressed: Feeling overwhelmed, pressured, or tense
- sad: Feeling down, melancholy, or unhappy

Return a JSON object:
{
  "suggestedMood": "one of the valid mood options above",
  "alternativeMood": "another possible mood option",
  "rationale": "A brief, encouraging explanation (1-2 sentences) of why this mood might fit their activity",
  "confidence": "high|medium|low"
}

Be supportive and positive in your rationale. If the activity suggests the person might be struggling, be empathetic and encouraging.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const validMoods = ['happy', 'calm', 'energetic', 'focused', 'hopeful', 'tired', 'anxious', 'stressed', 'sad'];
      
      const suggestedMood = validMoods.includes(parsed.suggestedMood) ? parsed.suggestedMood : fallbackSuggestion.primary;
      const alternativeMood = validMoods.includes(parsed.alternativeMood) ? parsed.alternativeMood : fallbackSuggestion.secondary;
      
      return {
        suggestedMood,
        alternativeMood,
        rationale: typeof parsed.rationale === 'string' ? parsed.rationale : fallbackSuggestion.rationale,
        confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
        generatedBy: 'ai'
      };
    }
    return fallback;
  } catch (error) {
    console.error('[AI SERVICE] Mood suggestion error:', error.message);
    return fallback;
  }
}

export async function generateSimpleInsights(dataPoints) {
  if (!model) {
    return generateFallbackSimpleInsights(dataPoints);
  }
  
  try {
    const prompt = `You are a friendly wellbeing assistant. Based on the user's data, give 2-4 simple, easy-to-understand suggestions. Write like you're talking to a friend - no jargon, no medical terms, keep each suggestion to 1-2 short sentences.

USER DATA:
- Average Mood: ${dataPoints.avgMood}/10
- Average Stress: ${dataPoints.avgStress || 'unknown'}/10  
- Average Energy: ${dataPoints.avgEnergy || 'unknown'}/10
- Activities Logged: ${dataPoints.totalActivities}
- Mood Trend: ${dataPoints.moodTrend || 'unknown'}
- Stress Trend: ${dataPoints.stressTrend || 'unknown'}

Return a JSON array of objects with:
- "title": very short title (2-4 words)
- "description": simple advice in plain everyday language (1-2 sentences max)
- "type": one of "mood", "activity", "stress", "sleep"
- "priority": "high", "medium", or "low"

Example good descriptions:
- "Your mood has been going up lately. Keep doing what makes you feel good!"
- "You seem stressed. Try taking a few slow deep breaths when things feel heavy."
- "You haven't logged much activity. Even a short walk can help you feel better."

Return ONLY the JSON array, no other text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0]);
      return insights.slice(0, 4).map(i => ({
        title: i.title || 'Tip',
        description: i.description || '',
        type: i.type || 'mood',
        priority: ['high', 'medium', 'low'].includes(i.priority) ? i.priority : 'medium'
      }));
    }
    return generateFallbackSimpleInsights(dataPoints);
  } catch (error) {
    console.error('[AI SERVICE] Simple insights error:', error.message);
    return generateFallbackSimpleInsights(dataPoints);
  }
}

function generateFallbackSimpleInsights(dataPoints) {
  const insights = [];
  if (dataPoints.avgMood > 0 && dataPoints.avgMood < 5) {
    insights.push({ title: 'Lift Your Mood', description: 'Your mood has been a bit low. Try doing something you enjoy, even for just a few minutes.', type: 'mood', priority: 'high' });
  } else if (dataPoints.avgMood >= 7) {
    insights.push({ title: 'Keep It Up', description: 'You have been feeling good lately. Whatever you are doing is working!', type: 'mood', priority: 'low' });
  }
  if (dataPoints.avgStress && dataPoints.avgStress > 6) {
    insights.push({ title: 'Ease the Stress', description: 'Your stress seems high. Try taking a few slow breaths or stepping away for a moment.', type: 'stress', priority: 'high' });
  }
  if (dataPoints.totalActivities < 3) {
    insights.push({ title: 'Get Moving', description: 'You have not logged many activities. Even a short walk can help you feel better.', type: 'activity', priority: 'medium' });
  }
  if (insights.length === 0) {
    insights.push({ title: 'Keep Tracking', description: 'Log your mood and activities regularly to get better suggestions.', type: 'mood', priority: 'low' });
  }
  return insights;
}

export default {
  analyzeWellbeing,
  generateRecommendations,
  generateInsights,
  classifyWellbeingLevel,
  chatWithAssistant,
  chatWithProviderAssistant,
  generateActivitySuggestions,
  generateMoodFeedback,
  generateDashboardInsights,
  suggestProviders,
  generateProviderInsights,
  generateCertificateSuggestion,
  generateChatTitle,
  generateProviderChatTitle,
  generateMoodSuggestion,
  generateSimpleInsights
};
