import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mic, Calendar as CalendarIcon, Save, CheckCircle, Dumbbell, Brain, Briefcase, Stethoscope, Loader2, Trash2, Edit2, Bed, Users, Sparkles, Apple, Flower2, Gamepad2, HeartPulse, MoreHorizontal, Smile, Bot, Lightbulb, ArrowRight, Frown, Meh, Zap, AlertCircle, Heart, FileText, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { SkeletonCard, FadeInContent } from "@/components/ui/skeleton-card";

const ACTIVITY_CATEGORIES = [
  { value: 'exercise', label: 'Exercise', icon: Dumbbell, color: 'orange' },
  { value: 'work', label: 'Work', icon: Briefcase, color: 'blue' },
  { value: 'sleep', label: 'Sleep', icon: Bed, color: 'indigo' },
  { value: 'social', label: 'Social', icon: Users, color: 'pink' },
  { value: 'relaxation', label: 'Relaxation', icon: Sparkles, color: 'cyan' },
  { value: 'nutrition', label: 'Nutrition', icon: Apple, color: 'green' },
  { value: 'meditation', label: 'Meditation', icon: Flower2, color: 'purple' },
  { value: 'hobby', label: 'Hobby', icon: Gamepad2, color: 'amber' },
  { value: 'healthcare', label: 'Healthcare', icon: HeartPulse, color: 'red' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'gray' },
];

const MOOD_OPTIONS = [
  { value: 'happy', label: 'Happy', emoji: '😊', score: 9, color: 'bg-green-100 text-green-600 hover:bg-green-200 border-green-200' },
  { value: 'calm', label: 'Calm', emoji: '😌', score: 7, color: 'bg-blue-100 text-blue-600 hover:bg-blue-200 border-blue-200' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', score: 5, color: 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200' },
  { value: 'tired', label: 'Tired', emoji: '😴', score: 4, color: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 border-indigo-200' },
  { value: 'stressed', label: 'Stressed', emoji: '😰', score: 3, color: 'bg-orange-100 text-orange-600 hover:bg-orange-200 border-orange-200' },
  { value: 'sad', label: 'Sad', emoji: '😢', score: 2, color: 'bg-purple-100 text-purple-600 hover:bg-purple-200 border-purple-200' },
];

function getCategoryInfo(category: string) {
  return ACTIVITY_CATEGORIES.find(c => c.value === category) || ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1];
}

function getCategoryIcon(category: string) {
  const info = getCategoryInfo(category);
  const Icon = info.icon;
  return <Icon className="w-5 h-5" />;
}

function getCategoryColor(category: string) {
  const info = getCategoryInfo(category);
  const colorMap: Record<string, string> = {
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    pink: 'bg-pink-100 text-pink-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
  };
  return colorMap[info.color] || colorMap.gray;
}

function getCurrentTime() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function getActivitySuggestion(category: string, description: string): { showHealthSuggestion: boolean; affirmation: string } {
  const lowerDesc = description.toLowerCase();
  const healthKeywords = ['unwell', 'sick', 'pain', 'hurt', 'ache', 'fever', 'headache', 'nausea', 'tired', 'fatigue', 'ill', 'symptom'];
  const hasHealthConcern = category === 'healthcare' || healthKeywords.some(keyword => lowerDesc.includes(keyword));
  
  if (hasHealthConcern) {
    return { showHealthSuggestion: true, affirmation: "" };
  }
  
  const affirmations: Record<string, string> = {
    exercise: "Great job staying active! Physical activity is key to overall wellbeing.",
    meditation: "Mindfulness is great for your wellbeing! Keep nurturing your inner peace.",
    sleep: "Quality rest is essential! Good sleep habits support your health.",
    social: "Social connections are so important! Keep nurturing those relationships.",
    relaxation: "Taking time to relax is wonderful for your mental health!",
    nutrition: "Great choice focusing on nutrition! You are what you eat.",
    work: "Productive work brings satisfaction! Remember to take breaks too.",
    hobby: "Hobbies bring joy and creativity to life! Keep exploring your passions.",
    other: "Every activity matters! Keep tracking your journey.",
  };
  
  return { 
    showHealthSuggestion: false, 
    affirmation: affirmations[category] || affirmations.other 
  };
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function ActivityLog() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState(getCurrentTime());
  const [category, setCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [savedActivity, setSavedActivity] = useState<{ category: string; description: string } | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{
    feedback?: string;
    nextSteps?: string[];
    relatedActivities?: string[];
    wellbeingTip?: string;
    generatedBy?: 'ai' | 'rules';
  } | null>(null);

  const [moodFlowState, setMoodFlowState] = useState<'idle' | 'saving' | 'generating' | 'complete'>('idle');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [reportData, setReportData] = useState<{
    overallScore?: number;
    wellbeingLevel?: string;
    recommendations?: any[];
    seekHelpRecommended?: boolean;
    analysis?: {
      summary?: string;
      strengths?: string[];
      areasForImprovement?: string[];
    };
  } | null>(null);

  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editDate, setEditDate] = useState<Date | undefined>(new Date());
  const [editTime, setEditTime] = useState("09:00");
  const [editCategory, setEditCategory] = useState<string>("");
  const [editCustomCategory, setEditCustomCategory] = useState<string>("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditRecording, setIsEditRecording] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [editConfirmDialogOpen, setEditConfirmDialogOpen] = useState(false);
  const [pendingEditActivity, setPendingEditActivity] = useState<any>(null);

  const recognitionRef = useRef<any>(null);
  const editRecognitionRef = useRef<any>(null);
  const recentActivityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.location.hash === '#recent' && recentActivityRef.current) {
      setTimeout(() => {
        recentActivityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (editRecognitionRef.current) {
        editRecognitionRef.current.stop();
      }
    };
  }, []);

  const { data: activitiesData, isLoading, error } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const response = await api.getActivities({ limit: 20 });
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.createActivity(data);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setSavedActivity({ category, description });
      const aiData = data?.aiSuggestions || data?.activity?.aiSuggestions;
      if (aiData) {
        setAiSuggestions(aiData);
      } else {
        setAiSuggestions(null);
      }
      setShowSuccessDialog(true);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save activity",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.updateActivity(id, data);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowEditDialog(false);
      setEditingActivity(null);
      toast({
        title: "Success",
        description: "Activity updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update activity",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.deleteActivity(id);
      if (!response.success) throw new Error(response.message);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({
        title: "Success",
        description: "Activity deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete activity",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setDate(new Date());
    setTime(getCurrentTime());
    setCategory("");
    setCustomCategory("");
    setTitle("");
    setDescription("");
  };

  const resetMoodFlow = () => {
    setMoodFlowState('idle');
    setSelectedMood(null);
    setReportData(null);
  };

  const handleMoodSelect = async (mood: typeof MOOD_OPTIONS[0]) => {
    setSelectedMood(mood.value);
    setMoodFlowState('saving');

    try {
      const moodResponse = await api.quickMoodLog(mood.score, mood.value);
      if (!moodResponse.success) {
        throw new Error(moodResponse.message || 'Failed to save mood');
      }

      setMoodFlowState('generating');

      const reportResponse = await api.generateWellbeingReport(7);
      if (!reportResponse.success) {
        throw new Error(reportResponse.message || 'Failed to generate report');
      }

      const report = reportResponse.data?.report;
      setReportData({
        overallScore: report?.overallScore,
        wellbeingLevel: report?.wellbeingLevel,
        recommendations: report?.recommendations || [],
        seekHelpRecommended: report?.seekHelpRecommended,
        analysis: report?.analysis,
      });
      setMoodFlowState('complete');
      
      queryClient.invalidateQueries({ queryKey: ['moods'] });
      queryClient.invalidateQueries({ queryKey: ['moodStats'] });
      queryClient.invalidateQueries({ queryKey: ['wellbeing'] });
      queryClient.invalidateQueries({ queryKey: ['wellbeingReports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      setMoodFlowState('idle');
      setSelectedMood(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setShowSuccessDialog(false);
      resetMoodFlow();
    }
  };

  const handleSave = () => {
    if (!date || !category || !title) {
      toast({
        title: "Missing fields",
        description: "Please fill in date, category, and title",
        variant: "destructive",
      });
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const activityDate = new Date(date);
    activityDate.setHours(hours, minutes, 0, 0);

    createMutation.mutate({
      date: activityDate.toISOString(),
      category: category,
      title: category === 'other' && customCategory ? customCategory : title,
      description,
      inputMethod: 'manual',
    });
  };

  const handleEditClick = (activity: any) => {
    setPendingEditActivity(activity);
    setEditConfirmDialogOpen(true);
  };

  const confirmEdit = () => {
    if (pendingEditActivity) {
      setEditingActivity(pendingEditActivity);
      setEditDate(new Date(pendingEditActivity.date));
      const activityTime = new Date(pendingEditActivity.date);
      setEditTime(`${activityTime.getHours().toString().padStart(2, '0')}:${activityTime.getMinutes().toString().padStart(2, '0')}`);
      setEditCategory(pendingEditActivity.category);
      setEditTitle(pendingEditActivity.title);
      setEditDescription(pendingEditActivity.description || "");
      setEditCustomCategory("");
      setShowEditDialog(true);
    }
    setEditConfirmDialogOpen(false);
    setPendingEditActivity(null);
  };

  const handleUpdateActivity = () => {
    if (!editingActivity || !editDate || !editCategory || !editTitle) return;

    const [hours, minutes] = editTime.split(':').map(Number);
    const activityDate = new Date(editDate);
    activityDate.setHours(hours, minutes, 0, 0);

    updateMutation.mutate({
      id: editingActivity._id,
      data: {
        date: activityDate.toISOString(),
        category: editCategory,
        title: editCategory === 'other' && editCustomCategory ? editCustomCategory : editTitle,
        description: editDescription,
      },
    });
  };

  const handleDeleteClick = (id: string) => {
    setActivityToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (activityToDelete) {
      deleteMutation.mutate(activityToDelete);
    }
    setDeleteDialogOpen(false);
    setActivityToDelete(null);
  };

  const startVoiceRecognition = (isEdit: boolean = false) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in your browser. Please try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (isEdit) {
        setEditDescription(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsEditRecording(false);
      } else {
        setDescription(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsRecording(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (isEdit) {
        setIsEditRecording(false);
      } else {
        setIsRecording(false);
      }
      toast({
        title: "Error",
        description: `Voice recognition error: ${event.error}`,
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      if (isEdit) {
        setIsEditRecording(false);
      } else {
        setIsRecording(false);
      }
    };

    if (isEdit) {
      editRecognitionRef.current = recognition;
    } else {
      recognitionRef.current = recognition;
    }

    recognition.start();
    if (isEdit) {
      setIsEditRecording(true);
    } else {
      setIsRecording(true);
    }
  };

  const stopVoiceRecognition = (isEdit: boolean = false) => {
    if (isEdit && editRecognitionRef.current) {
      editRecognitionRef.current.stop();
      setIsEditRecording(false);
    } else if (!isEdit && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleVoice = (isEdit: boolean = false) => {
    const recording = isEdit ? isEditRecording : isRecording;
    if (recording) {
      stopVoiceRecognition(isEdit);
    } else {
      startVoiceRecognition(isEdit);
    }
  };

  const activities = activitiesData?.activities || [];
  const suggestion = savedActivity ? getActivitySuggestion(savedActivity.category, savedActivity.description) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-foreground">Log Activity</h1>
        <p className="text-muted-foreground">Record your daily habits, thoughts, and small wins.</p>
      </div>

      <Card className="border-secondary/50 shadow-lg">
        <CardHeader>
          <CardTitle>New Entry</CardTitle>
          <CardDescription>What have you been up to today?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal rounded-xl border-input",
                      !date && "text-muted-foreground"
                    )}
                  >
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col space-y-2">
              <Label>Time</Label>
              <Input 
                type="time" 
                value={time} 
                onChange={(e) => setTime(e.target.value)} 
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(val) => {
              setCategory(val);
              if (val !== 'other') setCustomCategory("");
            }}>
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="w-4 h-4" /> {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {category === 'other' && (
            <div className="flex flex-col space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label>Please specify</Label>
              <Input 
                placeholder="Enter custom category..." 
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="rounded-xl"
              />
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <Label>Activity Title</Label>
            <Input 
              placeholder="e.g., Morning yoga, Team meeting, etc." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Description / Notes</Label>
            <div className="relative">
              <Textarea 
                placeholder="Describe your experience..." 
                className="min-h-[150px] rounded-xl resize-none pr-12"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button
                size="icon"
                variant={isRecording ? "destructive" : "secondary"}
                className={cn(
                  "absolute bottom-4 right-4 rounded-full transition-all duration-300",
                  isRecording && "animate-pulse"
                )}
                onClick={() => toggleVoice(false)}
                title="Voice Input"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            {isRecording && (
              <p className="text-xs text-primary animate-pulse font-medium">Listening...</p>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={!title || !date || !category || createMutation.isPending} 
              className="w-full sm:w-auto min-w-[140px]"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Entry
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showSuccessDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl font-serif">Entry Saved Successfully!</DialogTitle>
            <DialogDescription className="text-center">
              Great job logging your activity. Keeping track is the first step to improvement.
            </DialogDescription>
          </DialogHeader>
          
          {aiSuggestions && moodFlowState === 'idle' && (
            <div className="space-y-3 my-2 animate-in fade-in duration-300">
              <div className="flex justify-center">
                <Badge variant={aiSuggestions.generatedBy === 'ai' ? 'default' : 'secondary'} className="gap-1">
                  <Bot className="w-3 h-3" />
                  {aiSuggestions.generatedBy === 'ai' ? 'AI Generated' : 'Rule-based'}
                </Badge>
              </div>
              
              {aiSuggestions.feedback && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full shrink-0">
                      <Smile className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900 text-sm">Feedback</h4>
                      <p className="text-xs text-green-800 mt-1">{aiSuggestions.feedback}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {aiSuggestions.nextSteps && aiSuggestions.nextSteps.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full shrink-0">
                      <ArrowRight className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-900 text-sm">Next Steps</h4>
                      <ul className="text-xs text-blue-800 mt-1 space-y-1">
                        {aiSuggestions.nextSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-blue-500">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {aiSuggestions.wellbeingTip && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-full shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">Wellbeing Tip</h4>
                      <p className="text-xs text-amber-800 mt-1">{aiSuggestions.wellbeingTip}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!aiSuggestions && moodFlowState === 'idle' && (
            suggestion?.showHealthSuggestion ? (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 my-2 animate-in fade-in duration-300">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-full shrink-0">
                    <Stethoscope className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm">Feeling unwell?</h4>
                    <p className="text-xs text-amber-800 mt-1">
                      If you're experiencing physical symptoms, it's good to track those too.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 my-2 animate-in fade-in duration-300">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full shrink-0">
                    <Smile className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-900 text-sm">Keep it up!</h4>
                    <p className="text-xs text-green-800 mt-1">
                      {suggestion?.affirmation}
                    </p>
                  </div>
                </div>
              </div>
            )
          )}

          {moodFlowState === 'idle' && (
            <div className="space-y-3 pt-2 border-t mt-4 animate-in fade-in duration-300">
              <div className="text-center">
                <h4 className="font-semibold text-foreground text-sm">Quick Mood Check</h4>
                <p className="text-xs text-muted-foreground mt-1">How are you feeling right now?</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => handleMoodSelect(mood)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95",
                      mood.color
                    )}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-xs font-medium">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(moodFlowState === 'saving' || moodFlowState === 'generating') && (
            <div className="py-8 flex flex-col items-center gap-4 animate-in fade-in duration-300">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                {selectedMood && (
                  <div className="absolute -top-1 -right-1 text-2xl animate-bounce">
                    {MOOD_OPTIONS.find(m => m.value === selectedMood)?.emoji}
                  </div>
                )}
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium text-foreground">
                  {moodFlowState === 'saving' ? 'Saving your mood...' : 'Analyzing your wellbeing...'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {moodFlowState === 'saving' 
                    ? 'Just a moment' 
                    : 'Generating personalized insights'}
                </p>
              </div>
              <div className="flex gap-1">
                <div className={cn("h-2 w-2 rounded-full bg-primary", moodFlowState === 'saving' ? 'animate-pulse' : 'opacity-30')} />
                <div className={cn("h-2 w-2 rounded-full bg-primary", moodFlowState === 'generating' ? 'animate-pulse' : 'opacity-30')} />
                <div className="h-2 w-2 rounded-full bg-primary opacity-30" />
              </div>
            </div>
          )}

          {moodFlowState === 'complete' && reportData && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Mood logged & report generated!
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/5 to-secondary/10 rounded-xl p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Your Wellbeing Summary
                  </h4>
                  {reportData.overallScore !== undefined && (
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs font-bold",
                      reportData.overallScore >= 70 ? "bg-green-100 text-green-700" :
                      reportData.overallScore >= 40 ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      Score: {reportData.overallScore}%
                    </div>
                  )}
                </div>
                
                {reportData.analysis?.summary && (
                  <p className="text-sm text-muted-foreground mb-3">{reportData.analysis.summary}</p>
                )}

                {reportData.recommendations && reportData.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" /> AI Recommendations
                    </h5>
                    <ul className="space-y-1.5">
                      {reportData.recommendations.slice(0, 3).map((rec: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{typeof rec === 'string' ? rec : rec.title || rec.description || rec.recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {reportData.analysis?.strengths && reportData.analysis.strengths.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-primary/10">
                    <h5 className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-1">
                      <Heart className="w-3 h-3" /> Your Strengths
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      {reportData.analysis.strengths.slice(0, 2).join(' • ')}
                    </p>
                  </div>
                )}
              </div>

              {reportData.seekHelpRecommended && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-in fade-in duration-300">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-full shrink-0">
                      <HelpCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-amber-900 text-sm">You might benefit from support</h4>
                      <p className="text-xs text-amber-700 mt-1 mb-3">
                        Based on your recent wellbeing data, connecting with a professional might be helpful.
                      </p>
                      <Button 
                        size="sm" 
                        className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                        onClick={() => { handleDialogClose(false); setLocation("/directory"); }}
                      >
                        <Users className="w-4 h-4" /> Find Support
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-col gap-2 mt-4">
            {moodFlowState === 'complete' ? (
              <>
                <Button className="w-full gap-2" onClick={() => { handleDialogClose(false); setLocation("/dashboard"); }}>
                  <FileText className="w-4 h-4" /> View Full Dashboard
                </Button>
                {!reportData?.seekHelpRecommended && (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2" 
                    onClick={() => { handleDialogClose(false); setLocation("/directory"); }}
                  >
                    <Users className="w-4 h-4" /> Browse Providers
                  </Button>
                )}
                <Button variant="ghost" className="w-full" onClick={() => handleDialogClose(false)}>
                  Done
                </Button>
              </>
            ) : moodFlowState === 'idle' ? (
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => handleDialogClose(false)}>
                Skip for now
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your activity log entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={editConfirmDialogOpen} onOpenChange={setEditConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to edit this activity? Your changes will update the original entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEdit}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>
              Update your activity details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal rounded-xl border-input",
                        !editDate && "text-muted-foreground"
                      )}
                    >
                      {editDate ? format(editDate, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={setEditDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col space-y-2">
                <Label>Time</Label>
                <Input 
                  type="time" 
                  value={editTime} 
                  onChange={(e) => setEditTime(e.target.value)} 
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Label>Category</Label>
              <Select value={editCategory} onValueChange={(val) => {
                setEditCategory(val);
                if (val !== 'other') setEditCustomCategory("");
              }}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="w-4 h-4" /> {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editCategory === 'other' && (
              <div className="flex flex-col space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label>Please specify</Label>
                <Input 
                  placeholder="Enter custom category..." 
                  value={editCustomCategory}
                  onChange={(e) => setEditCustomCategory(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}

            <div className="flex flex-col space-y-2">
              <Label>Activity Title</Label>
              <Input 
                placeholder="e.g., Morning yoga" 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <div className="relative">
                <Textarea 
                  placeholder="Describe your experience..." 
                  className="min-h-[100px] rounded-xl resize-none pr-12"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
                <Button
                  size="icon"
                  variant={isEditRecording ? "destructive" : "secondary"}
                  className={cn(
                    "absolute bottom-4 right-4 rounded-full transition-all duration-300",
                    isEditRecording && "animate-pulse"
                  )}
                  onClick={() => toggleVoice(true)}
                  title="Voice Input"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              {isEditRecording && (
                <p className="text-xs text-primary animate-pulse font-medium">Listening...</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateActivity} 
              disabled={!editTitle || !editDate || !editCategory || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Update
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div id="recent" ref={recentActivityRef} className="space-y-4 pt-4 scroll-mt-4">
        <h2 className="text-xl font-serif font-bold text-foreground px-1">Recent Activity</h2>
        
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} variant="activity" />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-destructive">Failed to load activities. Please try again.</p>
            </CardContent>
          </Card>
        ) : activities.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No activities logged yet. Start by adding your first entry above!</p>
            </CardContent>
          </Card>
        ) : (
          <FadeInContent className="grid gap-4">
            {activities.map((activity: any) => (
              <Card key={activity._id} className="hover:bg-secondary/10 transition-colors group">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                    getCategoryColor(activity.category)
                  )}>
                    {getCategoryIcon(activity.category)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-foreground truncate">{activity.title}</h3>
                      <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                        {format(new Date(activity.date), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{activity.description || activity.notes || "No description"}</p>
                    <div className="flex items-center gap-1 pt-1">
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-full capitalize">
                        {getCategoryInfo(activity.category).label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEditClick(activity)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(activity._id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </FadeInContent>
        )}
      </div>
    </div>
  );
}
