import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Smile,
  Meh,
  Frown,
  ThumbsUp,
  Activity,
  AlertCircle,
  Calendar,
  Trash2,
  Edit2,
  Loader2,
  Sun,
  Moon,
  Cloud,
  Zap,
  Heart,
  Brain,
  Coffee,
  Flame,
  Sparkles,
  Target,
  MoreHorizontal,
  Mic,
  MicOff,
  Bot,
  Lightbulb,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation, useSearch } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCard, FadeInContent } from "@/components/ui/skeleton-card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/upgrade-prompt";

const MOOD_TYPES = [
  {
    id: "happy",
    label: "Happy",
    icon: Smile,
    color: "text-yellow-500 bg-yellow-50 border-yellow-200",
  },
  {
    id: "calm",
    label: "Calm",
    icon: Cloud,
    color: "text-blue-500 bg-blue-50 border-blue-200",
  },
  {
    id: "focused",
    label: "Focused",
    icon: Target,
    color: "text-purple-500 bg-purple-50 border-purple-200",
  },
  {
    id: "anxious",
    label: "Anxious",
    icon: Zap,
    color: "text-orange-500 bg-orange-50 border-orange-200",
  },
  {
    id: "stressed",
    label: "Stressed",
    icon: Flame,
    color: "text-red-500 bg-red-50 border-red-200",
  },
  {
    id: "sad",
    label: "Sad",
    icon: Frown,
    color: "text-indigo-500 bg-indigo-50 border-indigo-200",
  },
  {
    id: "tired",
    label: "Tired",
    icon: Coffee,
    color: "text-gray-500 bg-gray-50 border-gray-200",
  },
  {
    id: "energetic",
    label: "Energetic",
    icon: Sparkles,
    color: "text-green-500 bg-green-50 border-green-200",
  },
  {
    id: "irritated",
    label: "Irritated",
    icon: AlertCircle,
    color: "text-rose-500 bg-rose-50 border-rose-200",
  },
  {
    id: "hopeful",
    label: "Hopeful",
    icon: Sun,
    color: "text-amber-500 bg-amber-50 border-amber-200",
  },
  {
    id: "other",
    label: "Other",
    icon: MoreHorizontal,
    color: "text-slate-500 bg-slate-50 border-slate-200",
  },
];

const FACTORS = [
  { id: "work", label: "Work" },
  { id: "relationships", label: "Relationships" },
  { id: "health", label: "Health" },
  { id: "finances", label: "Finances" },
  { id: "sleep", label: "Sleep" },
  { id: "exercise", label: "Exercise" },
  { id: "weather", label: "Weather" },
  { id: "social", label: "Social" },
  { id: "news", label: "News" },
  { id: "family", label: "Family" },
  { id: "other", label: "Other" },
];

interface MoodLog {
  _id: string;
  mood: string;
  moodScore: number;
  energyLevel?: number;
  stressLevel?: number;
  factors?: string[];
  notes?: string;
  date: string;
  createdAt: string;
}

export default function MoodTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { plan, isNearLimit, isAtLimit, getRemaining, getLimit } = useSubscription();
  const searchString = useSearch();

  const [moodScore, setMoodScore] = useState([7]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [customMood, setCustomMood] = useState("");
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [customFactor, setCustomFactor] = useState("");
  const [notes, setNotes] = useState("");
  const [energyLevel, setEnergyLevel] = useState([5]);
  const [stressLevel, setStressLevel] = useState([5]);

  const [editingLog, setEditingLog] = useState<MoodLog | null>(null);
  const [editConfirmLog, setEditConfirmLog] = useState<MoodLog | null>(null);
  const [deleteConfirmLog, setDeleteConfirmLog] = useState<MoodLog | null>(
    null,
  );

  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingEdit, setIsRecordingEdit] = useState(false);

  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{
    feedback?: string;
    insight?: string;
    copingTip?: string;
    encouragement?: string;
    generatedBy?: "ai" | "rules";
  } | null>(null);

  const [fromActivity, setFromActivity] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const prefillMood = params.get("prefillMood");
    const prefillScore = params.get("prefillScore");
    const isFromActivity = params.get("fromActivity") === "true";
    const rationale = params.get("rationale");

    if (prefillMood) {
      const validMood = MOOD_TYPES.find((m) => m.id === prefillMood);
      if (validMood) {
        setSelectedMood(prefillMood);
      }
    }
    if (prefillScore) {
      const score = parseInt(prefillScore, 10);
      if (!isNaN(score) && score >= 1 && score <= 10) {
        setMoodScore([score]);
      }
    }
    if (isFromActivity) {
      setFromActivity(true);
    }
    if (rationale) {
      setAiRationale(rationale);
    }
  }, [searchString]);

  const startVoiceInput = (
    setter: (val: string) => void,
    currentValue: string,
    isEdit = false,
  ) => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    if (isEdit) {
      setIsRecordingEdit(true);
    } else {
      setIsRecording(true);
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setter(currentValue ? `${currentValue} ${transcript}` : transcript);
    };

    recognition.onerror = () => {
      if (isEdit) {
        setIsRecordingEdit(false);
      } else {
        setIsRecording(false);
      }
      toast({
        title: "Voice input error",
        description: "Could not recognize speech. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      if (isEdit) {
        setIsRecordingEdit(false);
      } else {
        setIsRecording(false);
      }
    };

    recognition.start();
  };

  const {
    data: moodLogsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["moodLogs"],
    queryFn: async () => {
      const response = await api.getMoodLogs({ limit: 10 });
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.createMoodLog(data);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["moodLogs"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-usage"] });
      const aiData = data?.aiFeedback || data?.moodLog?.aiFeedback;
      if (aiData) {
        setAiFeedback(aiData);
        setShowFeedbackDialog(true);
      } else {
        toast({ title: "Mood logged successfully!" });
      }
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.updateMoodLog(id, data);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moodLogs"] });
      toast({ title: "Mood log updated!" });
      setEditingLog(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.deleteMoodLog(id);
      if (!response.success) throw new Error(response.message);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moodLogs"] });
      toast({ title: "Mood log deleted" });
      setDeleteConfirmLog(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setMoodScore([7]);
    setSelectedMood(null);
    setCustomMood("");
    setSelectedFactors([]);
    setCustomFactor("");
    setNotes("");
    setEnergyLevel([5]);
    setStressLevel([5]);
  };

  const handleFactorToggle = (factorId: string) => {
    setSelectedFactors((prev) =>
      prev.includes(factorId)
        ? prev.filter((f) => f !== factorId)
        : [...prev, factorId],
    );
  };

  const handleSubmit = () => {
    if (!selectedMood) {
      toast({ title: "Please select a mood", variant: "destructive" });
      return;
    }

    if (selectedMood === "other" && !customMood.trim()) {
      toast({ title: "Please enter your custom mood", variant: "destructive" });
      return;
    }

    let finalNotes = notes;
    if (selectedFactors.includes("other") && customFactor) {
      finalNotes = `${notes}${notes ? " | " : ""}Custom factor: ${customFactor}`;
    }

    const data = {
      mood: selectedMood === "other" ? customMood.trim() : selectedMood,
      moodScore: moodScore[0],
      energyLevel: energyLevel[0],
      stressLevel: stressLevel[0],
      factors: selectedFactors,
      notes: finalNotes,
      date: new Date().toISOString(),
    };

    createMutation.mutate(data);
  };

  const handleEditSave = () => {
    if (!editingLog) return;

    updateMutation.mutate({
      id: editingLog._id,
      data: {
        mood: editingLog.mood,
        moodScore: editingLog.moodScore,
        energyLevel: editingLog.energyLevel,
        stressLevel: editingLog.stressLevel,
        factors: editingLog.factors,
        notes: editingLog.notes,
      },
    });
  };

  const getMoodLabel = (val: number) => {
    if (val >= 8)
      return { text: "Excellent", icon: ThumbsUp, color: "text-green-600" };
    if (val >= 6) return { text: "Good", icon: Smile, color: "text-teal-600" };
    if (val >= 4) return { text: "Okay", icon: Meh, color: "text-yellow-600" };
    if (val >= 2) return { text: "Low", icon: Frown, color: "text-orange-600" };
    return { text: "Very Low", icon: AlertCircle, color: "text-red-600" };
  };

  const moodData = getMoodLabel(moodScore[0]);
  const MoodIcon = moodData.icon;

  // Handle both possible data structures: moodLogsData could be the array directly or { moodLogs: [...] }
  const moodLogs = Array.isArray(moodLogsData)
    ? moodLogsData
    : Array.isArray(moodLogsData?.moodLogs)
      ? moodLogsData.moodLogs
      : [];

  const getMoodConfig = (moodId: string) =>
    MOOD_TYPES.find((m) => m.id === moodId) || MOOD_TYPES[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 md:space-y-12 animate-in fade-in duration-500 pb-20 relative px-4 sm:px-6">
      <div className="text-center space-y-2 sm:space-y-3 max-w-2xl mx-auto pt-2 md:pt-0">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">
          How are you feeling today?
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
          Track your emotional and physical state.
        </p>
      </div>

      <div className="hidden md:block absolute right-0 top-2">
        <Link href="/history">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="w-4 h-4" /> View History
          </Button>
        </Link>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
          <div className="flex justify-center">
            <div
              className={cn(
                "h-20 sm:h-24 w-20 sm:w-24 rounded-full bg-white shadow-xl flex items-center justify-center transition-all duration-300",
                moodData.color,
              )}
            >
              <MoodIcon className="w-10 sm:w-12 h-10 sm:h-12" />
            </div>
          </div>
          <div className="text-center">
            <h2
              className={cn(
                "text-xl sm:text-2xl font-bold font-serif mb-1 sm:mb-2",
                moodData.color,
              )}
            >
              {moodData.text}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Level {moodScore[0]}/10
            </p>
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <Slider
              max={10}
              min={1}
              step={1}
              value={moodScore}
              onValueChange={setMoodScore}
              className="py-4 cursor-pointer"
            />
            <div className="flex justify-between px-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
              <span>Struggling</span>
              <span>Thriving</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {fromActivity && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={() => setLocation("/activity")}
            data-testid="button-back-to-activity"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Activity
          </Button>
          {aiRationale && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Sparkles className="w-3 h-3" /> AI Suggested
            </Badge>
          )}
        </div>
      )}

      {fromActivity && aiRationale && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded-full shrink-0">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-900 text-sm">
                AI Mood Suggestion
              </h4>
              <p className="text-xs text-purple-800 mt-1">{aiRationale}</p>
              <p className="text-xs text-purple-600 mt-2">
                We've pre-selected a mood based on your activity. Feel free to
                adjust if you're feeling differently.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2">
          <Heart className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-serif font-bold">Your Mood</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
          {MOOD_TYPES.map((mood) => {
            const Icon = mood.icon;
            const isSelected = selectedMood === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                data-testid={`button-mood-${mood.id}`}
                className={cn(
                  "p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[100px] touch-manipulation",
                  isSelected
                    ? `${mood.color} ring-2 ring-offset-2 ring-primary`
                    : "border-gray-200 hover:border-gray-300 bg-white",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 sm:w-6 h-5 sm:h-6",
                    isSelected ? "" : "text-gray-400",
                  )}
                />
                <span className="text-xs sm:text-sm font-medium text-center leading-tight">
                  {mood.label}
                </span>
              </button>
            );
          })}
        </div>

        {selectedMood === "other" && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <Label
              htmlFor="customMood"
              className="text-sm font-medium mb-2 block"
            >
              Please describe your mood:
            </Label>
            <Input
              id="customMood"
              placeholder="Enter your custom mood..."
              value={customMood}
              onChange={(e) => setCustomMood(e.target.value)}
              className="max-w-md"
            />
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-serif">
              Energy Level
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              value={energyLevel}
              onValueChange={setEnergyLevel}
              max={10}
              min={1}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
              <span>Low Energy</span>
              <span className="font-medium">{energyLevel[0]}/10</span>
              <span>High Energy</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-serif">
              Stress Level
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Slider
              value={stressLevel}
              onValueChange={setStressLevel}
              max={10}
              min={1}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
              <span>Relaxed</span>
              <span className="font-medium">{stressLevel[0]}/10</span>
              <span>Stressed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-serif font-bold">
            Contributing Factors
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {FACTORS.map((factor) => (
            <button
              key={factor.id}
              onClick={() => handleFactorToggle(factor.id)}
              data-testid={`button-factor-${factor.id}`}
              className={cn(
                "px-3 sm:px-4 py-2 rounded-full border transition-all duration-200 text-xs sm:text-sm font-medium min-h-[36px] touch-manipulation flex items-center",
                selectedFactors.includes(factor.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white border-gray-200 hover:border-gray-300 text-gray-700",
              )}
            >
              {factor.label}
            </button>
          ))}
        </div>

        {selectedFactors.includes("other") && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <Label
              htmlFor="customFactor"
              className="text-sm font-medium mb-2 block"
            >
              Please specify other factor:
            </Label>
            <Input
              id="customFactor"
              placeholder="Enter your custom factor..."
              value={customFactor}
              onChange={(e) => setCustomFactor(e.target.value)}
              className="max-w-md"
            />
          </div>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="notes"
            className="text-base sm:text-lg font-serif font-bold flex items-center gap-2"
          >
            <Brain className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
            Additional Notes
          </Label>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Mic className="h-3 w-3" /> Voice available
          </span>
        </div>
        <div className="relative">
          <Textarea
            id="notes"
            placeholder="Any thoughts or observations... (tap the mic to use voice)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="pr-12 text-sm sm:text-base"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-2 top-2 h-8 w-8",
              isRecording && "text-red-500 animate-pulse",
            )}
            onClick={() => startVoiceInput(setNotes, notes)}
            title={isRecording ? "Recording..." : "Voice input"}
            data-testid="button-voice-notes"
          >
            {isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {isAtLimit("moodLogs") && (
        <UpgradePrompt
          feature="moodLogs"
          currentPlan={plan}
          limit={getLimit("moodLogs")}
        />
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between pt-6 sm:pt-8 gap-3 sm:gap-4">
        {!isAtLimit("moodLogs") && (
          <p className={cn(
            "text-xs",
            isNearLimit("moodLogs") ? "text-amber-600 font-medium" : "text-muted-foreground"
          )}>
            {isNearLimit("moodLogs") && <AlertCircle className="inline w-3 h-3 mr-1" />}
            {getRemaining("moodLogs") === Infinity
              ? "Unlimited mood logs"
              : `${getRemaining("moodLogs")} of ${getLimit("moodLogs")} mood logs remaining`}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <Link href="/history" className="sm:hidden w-full">
            <Button variant="outline">View History</Button>
          </Link>
          <Button
            className="rounded-xl"
            disabled={!selectedMood || createMutation.isPending || isAtLimit("moodLogs")}
            onClick={handleSubmit}
            data-testid="button-save-mood"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Check-in"
            )}
          </Button>
        </div>
      </div>

      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader className="space-y-3 sm:space-y-4">
            <div className="mx-auto h-10 sm:h-12 w-10 sm:w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Heart className="h-5 sm:h-6 w-5 sm:w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center text-lg sm:text-xl font-serif">
              Mood Logged Successfully!
            </DialogTitle>
            <DialogDescription className="text-center text-sm sm:text-base">
              Thank you for checking in. Here's some personalized feedback for
              you.
            </DialogDescription>
          </DialogHeader>

          {aiFeedback && (
            <div className="space-y-3 my-2">
              <div className="flex justify-center">
                <Badge
                  variant={
                    aiFeedback.generatedBy === "ai" ? "default" : "secondary"
                  }
                  className="gap-1"
                >
                  <Bot className="w-3 h-3" />
                  {aiFeedback.generatedBy === "ai"
                    ? "AI Generated"
                    : "Rule-based"}
                </Badge>
              </div>

              {aiFeedback.feedback && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full shrink-0">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900 text-sm">
                        Feedback
                      </h4>
                      <p className="text-xs text-green-800 mt-1">
                        {aiFeedback.feedback}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {aiFeedback.insight && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full shrink-0">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 text-sm">
                        Insight
                      </h4>
                      <p className="text-xs text-blue-800 mt-1">
                        {aiFeedback.insight}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {aiFeedback.copingTip && (
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-full shrink-0">
                      <Brain className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-900 text-sm">
                        Coping Tip
                      </h4>
                      <p className="text-xs text-purple-800 mt-1">
                        {aiFeedback.copingTip}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {aiFeedback.encouragement && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-full shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">
                        Encouragement
                      </h4>
                      <p className="text-xs text-amber-800 mt-1">
                        {aiFeedback.encouragement}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowFeedbackDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 pt-8 border-t">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold">Recent Mood Logs</h2>
          <Link href="/history">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} variant="mood" />
            ))}
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700">
                Failed to load mood logs. Please try again.
              </p>
            </CardContent>
          </Card>
        ) : moodLogs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Moon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No mood logs yet. Log your first mood above!
              </p>
            </CardContent>
          </Card>
        ) : (
          <FadeInContent className="space-y-3">
            {moodLogs.map((log: MoodLog) => {
              const moodConfig = getMoodConfig(log.mood);
              const MoodLogIcon = moodConfig.icon;
              return (
                <Card
                  key={log._id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center border",
                          moodConfig.color,
                        )}
                      >
                        <MoodLogIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold capitalize">
                            {log.mood}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            Score: {log.moodScore}/10
                          </Badge>
                          {log.energyLevel && (
                            <Badge variant="outline" className="text-xs">
                              Energy: {log.energyLevel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(log.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        {log.factors && log.factors.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {log.factors.map((factor) => (
                              <Badge
                                key={factor}
                                variant="outline"
                                className="text-xs"
                              >
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {log.notes && (
                          <p className="text-sm text-muted-foreground mt-2 truncate">
                            {log.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditConfirmLog(log)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteConfirmLog(log)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </FadeInContent>
        )}
      </div>

      <Dialog
        open={!!editingLog}
        onOpenChange={(open) => !open && setEditingLog(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Mood Log</DialogTitle>
          </DialogHeader>
          {editingLog && (
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label>Mood</Label>
                <div className="grid grid-cols-5 gap-2">
                  {MOOD_TYPES.map((mood) => {
                    const Icon = mood.icon;
                    const isSelected = editingLog.mood === mood.id;
                    return (
                      <button
                        key={mood.id}
                        onClick={() =>
                          setEditingLog({ ...editingLog, mood: mood.id })
                        }
                        className={cn(
                          "p-2 rounded-lg border transition-all text-center",
                          isSelected
                            ? mood.color
                            : "border-gray-200 hover:border-gray-300",
                        )}
                      >
                        <Icon className="w-5 h-5 mx-auto" />
                        <span className="text-xs">{mood.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-3">
                <Label>Mood Score: {editingLog.moodScore}/10</Label>
                <Slider
                  value={[editingLog.moodScore]}
                  onValueChange={([val]) =>
                    setEditingLog({ ...editingLog, moodScore: val })
                  }
                  max={10}
                  min={1}
                  step={1}
                />
              </div>
              <div className="space-y-3">
                <Label>Notes</Label>
                <div className="relative">
                  <Textarea
                    value={editingLog.notes || ""}
                    onChange={(e) =>
                      setEditingLog({ ...editingLog, notes: e.target.value })
                    }
                    rows={3}
                    className="pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute right-2 top-2 h-8 w-8",
                      isRecordingEdit && "text-red-500 animate-pulse",
                    )}
                    onClick={() =>
                      startVoiceInput(
                        (val) => setEditingLog({ ...editingLog, notes: val }),
                        editingLog.notes || "",
                        true,
                      )
                    }
                    title={isRecordingEdit ? "Recording..." : "Voice input"}
                  >
                    {isRecordingEdit ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!editConfirmLog}
        onOpenChange={(open) => !open && setEditConfirmLog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Mood Log?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to edit this mood log entry?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (editConfirmLog) {
                  setEditingLog(editConfirmLog);
                  setEditConfirmLog(null);
                }
              }}
            >
              Edit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteConfirmLog}
        onOpenChange={(open) => !open && setDeleteConfirmLog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mood Log?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              mood log entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() =>
                deleteConfirmLog && deleteMutation.mutate(deleteConfirmLog._id)
              }
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
