import api from '@/lib/api';

export type AIWellbeingClassification = 'Asymptomatic' | 'Mild' | 'Moderate' | 'Severe';

export interface AIDailyLogInput {
  date: string;
  activityType: 'physical' | 'mental' | 'work' | 'leisure';
  context: 'home' | 'work' | 'travel' | 'school' | 'leisure';
  description: string;
  voiceEntry?: boolean;
  metrics?: {
    sleepHours?: number;
    stressLevel?: number;
    moodLevel?: number;
  };
}

export interface AIAnalysisResult {
  timestamp: string;
  classification: AIWellbeingClassification;
  confidenceScore: number;
  summary: string;
  indicators: {
    mood: 'stable' | 'improving' | 'declining';
    energy: 'high' | 'moderate' | 'low';
  };
  recommendedActions: AIActionRecommendation[];
}

export interface AIActionRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'monitor' | 'learn' | 'professional_help';
  priority: 'low' | 'medium' | 'high';
}

export interface AIWellbeingPlan {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  focusAreas: string[];
  steps: {
    day?: string;
    action: string;
    guidance: string;
  }[];
  generatedAt: string;
}

export interface WellbeingReport {
  _id: string;
  userId: string;
  dateRange: { start: string; end: string };
  overallScore: number;
  wellbeingLevel: string;
  analysis: {
    summary: string;
    strengths: string[];
    areasForImprovement: string[];
    patterns: { type: string; description: string; impact: string }[];
    trends: { mood?: string; activity?: string; sleep?: string; stress?: string };
  };
  recommendations: { category: string; title: string; description: string; priority: string }[];
  insights: string[];
  dataPoints: {
    activityLogs: number;
    moodLogs: number;
    averageMoodScore: number;
    averageEnergyLevel: number | null;
    averageStressLevel: number | null;
    totalActivityMinutes: number;
    mostCommonMood: string | null;
    mostCommonActivity: string | null;
  };
  seekHelpRecommended: boolean;
  helpRecommendation?: {
    reason: string;
    urgency: string;
    suggestedSpecialties: string[];
  };
  generatedBy: 'ai' | 'fallback' | 'client';
  aiModel: string;
  createdAt: string;
}

export interface ClientSideInsights {
  averageMoodScore: number;
  moodTrend: string;
  totalActivities: number;
  totalActivityMinutes: number;
  mostCommonMood: string;
  mostCommonActivity: string;
  averageStressLevel: number;
  summary: string;
  recommendations: { title: string; description: string; priority: string }[];
}

export function generateClientSideInsights(
  moodLogs: any[],
  activityLogs: any[]
): ClientSideInsights {
  const averageMoodScore = moodLogs.length > 0
    ? moodLogs.reduce((sum, log) => sum + (log.moodScore || 5), 0) / moodLogs.length
    : 5;
  
  const averageStressLevel = moodLogs.length > 0
    ? moodLogs.reduce((sum, log) => sum + (log.stressLevel || 5), 0) / moodLogs.length
    : 5;

  const totalActivityMinutes = activityLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

  const moodCounts: Record<string, number> = {};
  moodLogs.forEach(log => {
    const mood = log.mood || 'calm';
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  });
  const mostCommonMood = Object.keys(moodCounts).length > 0 
    ? Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b)
    : 'No data';

  const activityCounts: Record<string, number> = {};
  activityLogs.forEach(log => {
    const category = log.category || 'other';
    activityCounts[category] = (activityCounts[category] || 0) + 1;
  });
  const mostCommonActivity = Object.keys(activityCounts).length > 0
    ? Object.keys(activityCounts).reduce((a, b) => activityCounts[a] > activityCounts[b] ? a : b)
    : 'No data';

  let moodTrend = 'stable';
  if (moodLogs.length >= 3) {
    const recentMoods = moodLogs.slice(-3);
    const olderMoods = moodLogs.slice(0, Math.max(1, moodLogs.length - 3));
    const recentAvg = recentMoods.reduce((sum, log) => sum + (log.moodScore || 5), 0) / recentMoods.length;
    const olderAvg = olderMoods.reduce((sum, log) => sum + (log.moodScore || 5), 0) / olderMoods.length;
    if (recentAvg > olderAvg + 0.5) moodTrend = 'improving';
    else if (recentAvg < olderAvg - 0.5) moodTrend = 'declining';
  }

  let summary = '';
  if (moodLogs.length === 0 && activityLogs.length === 0) {
    summary = 'Start logging your moods and activities to receive personalized insights about your wellbeing patterns.';
  } else if (averageMoodScore >= 7) {
    summary = `Your average mood score is ${averageMoodScore.toFixed(1)}/10, which indicates you're doing well! Keep up your positive habits.`;
  } else if (averageMoodScore >= 5) {
    summary = `Your average mood score is ${averageMoodScore.toFixed(1)}/10. There's room for improvement, but you're on the right track.`;
  } else {
    summary = `Your average mood score is ${averageMoodScore.toFixed(1)}/10. Consider focusing on self-care and activities that bring you joy.`;
  }

  const recommendations = [];
  if (averageStressLevel > 6) {
    recommendations.push({
      title: 'Stress Management',
      description: 'Your stress levels appear elevated. Try relaxation techniques like deep breathing or a short walk.',
      priority: 'high'
    });
  }
  if (totalActivityMinutes < 60 && activityLogs.length < 3) {
    recommendations.push({
      title: 'Increase Activity',
      description: 'Consider adding more physical activity to your routine. Even 10-15 minutes of movement can help.',
      priority: 'medium'
    });
  }
  if (averageMoodScore < 5) {
    recommendations.push({
      title: 'Self-Care Focus',
      description: 'Prioritize activities that bring you comfort and joy. Small moments of self-care can make a big difference.',
      priority: 'high'
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Keep It Up',
      description: 'You\'re doing well! Continue your current habits and stay mindful of your wellbeing.',
      priority: 'low'
    });
  }

  return {
    averageMoodScore: Math.round(averageMoodScore * 10) / 10,
    moodTrend,
    totalActivities: activityLogs.length,
    totalActivityMinutes,
    mostCommonMood,
    mostCommonActivity,
    averageStressLevel: Math.round(averageStressLevel * 10) / 10,
    summary,
    recommendations
  };
}

export interface ConversationData {
  _id: string;
  userId: string;
  title: string;
  lastMessageAt: string;
  createdAt: string;
}

export type AIAction = {
  type: 'navigate' | 'log_mood' | 'log_activity' | 'find_providers' | 'book_appointment' | 'generate_report' | 'view_history';
  label: string;
  path?: string;
  data?: any;
};

export interface ChatMessageData {
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  actions?: AIAction[];
  createdAt: string;
}

export const AIService = {
  searchKnowledgeBase: async (query: string, conversationId?: string): Promise<{ answer: string; sources: string[]; conversationId?: string }> => {
    try {
      const response = await api.post<any>('/wellbeing/chat', { query, conversationId });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Invalid response from AI assistant');
    } catch (error) {
      console.error('Error in AI Assistant search:', error);
      throw error;
    }
  },

  getConversations: async (): Promise<ConversationData[]> => {
    const response = await api.get<any>('/wellbeing/conversations');
    if (response.success && response.data) {
      return response.data.conversations || [];
    }
    return [];
  },

  createConversation: async (): Promise<ConversationData> => {
    const response = await api.post<any>('/wellbeing/conversations', {});
    if (response.success && response.data) {
      return response.data.conversation;
    }
    throw new Error('Failed to create conversation');
  },

  getConversation: async (conversationId: string): Promise<{ conversation: ConversationData; messages: ChatMessageData[] }> => {
    const response = await api.get<any>(`/wellbeing/conversations/${conversationId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('Failed to load conversation');
  },

  updateConversationTitle: async (conversationId: string, title: string): Promise<ConversationData> => {
    const response = await api.patch<any>(`/wellbeing/conversations/${conversationId}`, { title });
    if (response.success && response.data) {
      return response.data.conversation;
    }
    throw new Error('Failed to update conversation');
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await api.delete(`/wellbeing/conversations/${conversationId}`);
  },

  sendMessage: async (conversationId: string, message: string): Promise<{ userMessage: ChatMessageData; assistantMessage: ChatMessageData & { answer: string; sources: string[]; actions?: AIAction[] } }> => {
    const response = await api.post<any>(`/wellbeing/conversations/${conversationId}/messages`, { message });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('Failed to send message');
  },

  generateWellbeingReport: async (days: number = 7) => {
    const response = await api.generateWellbeingReport(days);
    if (!response.success) {
      throw new Error(response.message || 'Failed to generate report');
    }
    return response.data?.report as WellbeingReport;
  },

  getWellbeingReports: async (params?: { page?: number; limit?: number }) => {
    const response = await api.getWellbeingReports(params);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch reports');
    }
    return {
      reports: response.data?.reports as WellbeingReport[],
      pagination: response.data?.pagination
    };
  },

  getLatestReport: async () => {
    const response = await api.getLatestReport();
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch latest report');
    }
    return response.data?.report as WellbeingReport | null;
  },

  getDashboardSummary: async () => {
    const response = await api.getDashboardSummary();
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch dashboard summary');
    }
    return response.data?.summary;
  },

  getMoodStats: async (days: number = 30) => {
    const response = await api.getMoodStats(days);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch mood stats');
    }
    return response.data;
  },

  getActivityStats: async (days: number = 30) => {
    const response = await api.getActivityStats(days);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch activity stats');
    }
    return response.data;
  }
};
