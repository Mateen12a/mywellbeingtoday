import { WellbeingReport, ActivityLog, MoodLog } from '../models/index.js';
import { analyzeWellbeing, generateRecommendations, classifyWellbeingLevel } from './aiService.js';

function getMostCommon(arr) {
  if (!arr || arr.length === 0) return null;
  const counts = {};
  arr.forEach(item => {
    if (item) counts[item] = (counts[item] || 0) + 1;
  });
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
}

export async function autoGenerateReport(userId) {
  try {
    const days = 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [activityLogs, moodLogs] = await Promise.all([
      ActivityLog.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 }),
      MoodLog.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 })
    ]);

    if (activityLogs.length === 0 && moodLogs.length === 0) {
      return null;
    }

    let wellbeingAnalysis, recommendations;
    try {
      wellbeingAnalysis = await analyzeWellbeing(activityLogs, moodLogs);
      recommendations = await generateRecommendations(wellbeingAnalysis);
    } catch (error) {
      console.error('[REPORT SERVICE] AI analysis error:', error.message);
      wellbeingAnalysis = {
        analysis: {
          summary: 'Your wellbeing data has been recorded.',
          strengths: ['Tracking your wellbeing'],
          areasForImprovement: [],
          patterns: [],
          trends: {}
        },
        generatedBy: 'fallback'
      };
      recommendations = [];
    }

    const avgMoodScore = moodLogs.length > 0 
      ? moodLogs.reduce((sum, m) => sum + (m.moodScore || 5), 0) / moodLogs.length 
      : 5;
    
    const overallScore = Math.round(avgMoodScore * 10);
    const wellbeingLevel = classifyWellbeingLevel(overallScore);

    const seekHelpRecommended = overallScore < 40 || 
      (moodLogs.some(m => m.stressLevel >= 8 || m.anxietyLevel >= 8));

    const analysisData = wellbeingAnalysis.analysis || {};

    const report = await WellbeingReport.create({
      userId,
      dateRange: { start: startDate, end: endDate },
      overallScore,
      wellbeingLevel,
      analysis: {
        summary: analysisData.summary || 'Report generated successfully.',
        strengths: analysisData.strengths || [],
        areasForImprovement: analysisData.areasForImprovement || [],
        patterns: analysisData.patterns || [],
        trends: analysisData.trends || {}
      },
      recommendations: recommendations || [],
      insights: analysisData.insights || [],
      dataPoints: {
        activityLogs: activityLogs.length,
        moodLogs: moodLogs.length,
        averageMoodScore: avgMoodScore,
        averageEnergyLevel: moodLogs.length > 0 
          ? moodLogs.reduce((sum, m) => sum + (m.energyLevel || 5), 0) / moodLogs.length 
          : null,
        averageStressLevel: moodLogs.length > 0 
          ? moodLogs.reduce((sum, m) => sum + (m.stressLevel || 5), 0) / moodLogs.length 
          : null,
        totalActivityMinutes: activityLogs.reduce((sum, a) => sum + (a.duration || 0), 0),
        mostCommonMood: getMostCommon(moodLogs.map(m => m.mood)),
        mostCommonActivity: getMostCommon(activityLogs.map(a => a.category))
      },
      seekHelpRecommended,
      helpRecommendation: seekHelpRecommended ? {
        reason: 'Based on your recent wellbeing data, connecting with a professional might be beneficial.',
        urgency: overallScore < 30 ? 'high' : 'moderate',
        suggestedSpecialties: ['mental_health', 'counseling']
      } : undefined,
      generatedBy: wellbeingAnalysis.generatedBy || 'fallback',
      aiModel: wellbeingAnalysis.aiModel || ''
    });

    console.log(`[REPORT SERVICE] Auto-generated report for user ${userId}`);
    return report;
  } catch (error) {
    console.error('[REPORT SERVICE] Auto-generate failed:', error.message);
    return null;
  }
}

export default { autoGenerateReport };
