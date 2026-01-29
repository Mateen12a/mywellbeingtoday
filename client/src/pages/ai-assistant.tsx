import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Sparkles, Send, Bot, User, BookOpen, ShieldAlert, BarChart2, RefreshCw, TrendingUp, TrendingDown, Minus, AlertCircle, Loader2, Cpu, Calculator, WifiOff, X, Plus, MessageSquare, Trash2, Edit2, Check, Menu, Smile, Activity, MapPin, Calendar, Clock, FileText, Navigation, Heart, Dumbbell, Mic, Paperclip, Image, File } from "lucide-react";
import { AIService, WellbeingReport, generateClientSideInsights, ClientSideInsights, ConversationData, ChatMessageData, AIAction } from "@/services/ai";
import { cn } from "@/lib/utils";
import aiAssistantImage from "@assets/generated_images/serene_abstract_ai_wellbeing_assistant_visualization.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

function useVoiceInput(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult[0]) {
          const transcript = lastResult[0].transcript;
          onTranscript(transcript);
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  };

  return { isListening, isSupported, toggleListening };
}

type Attachment = {
  file: File;
  base64: string;
  type: 'image' | 'document';
  preview?: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  actions?: AIAction[];
  attachment?: {
    type: 'image' | 'document';
    name: string;
    base64?: string;
    mimeType?: string;
  };
};

function getTrendIcon(trend: string | undefined) {
  if (!trend) return <Minus className="h-4 w-4" />;
  if (trend === 'improving' || trend === 'increasing' || trend === 'decreasing') {
    return trend === 'decreasing' ? <TrendingDown className="h-4 w-4 text-green-600" /> : <TrendingUp className="h-4 w-4 text-green-600" />;
  }
  if (trend === 'declining') {
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  }
  return <Minus className="h-4 w-4 text-gray-500" />;
}

function getWellbeingColor(level: string | undefined) {
  switch (level?.toLowerCase()) {
    case 'thriving': return 'bg-green-100 text-green-800 border-green-200';
    case 'good': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'struggling': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function AIStatusIndicator({ generatedBy }: { generatedBy?: string }) {
  if (generatedBy === 'ai') {
    return (
      <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
        <Cpu className="h-3 w-3" />
        AI-Powered
      </Badge>
    );
  }
  if (generatedBy === 'fallback') {
    return (
      <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
        <Calculator className="h-3 w-3" />
        Rule-Based Analysis
      </Badge>
    );
  }
  if (generatedBy === 'client') {
    return (
      <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
        <WifiOff className="h-3 w-3" />
        Local Insights
      </Badge>
    );
  }
  return null;
}

function getActionIcon(type: AIAction['type']) {
  switch (type) {
    case 'navigate': return Navigation;
    case 'log_mood': return Smile;
    case 'log_activity': return Dumbbell;
    case 'find_providers': return MapPin;
    case 'book_appointment': return Calendar;
    case 'generate_report': return FileText;
    case 'view_history': return Clock;
    default: return Navigation;
  }
}

function ActionButtons({ 
  actions, 
  onAction 
}: { 
  actions: AIAction[]; 
  onAction: (action: AIAction) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
      {actions.map((action, index) => {
        const Icon = getActionIcon(action.type);
        return (
          <Button
            key={index}
            variant="outline"
            size="default"
            onClick={() => onAction(action)}
            className="gap-2 text-sm md:text-base h-10 md:h-11 px-4 bg-white hover:bg-primary/5 hover:border-primary/30 transition-colors"
          >
            <Icon className="h-4 w-4 md:h-5 md:w-5" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

function QuickMoodDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mood, setMood] = useState(initialData?.mood || 'calm');
  const [moodScore, setMoodScore] = useState([initialData?.moodScore || 7]);
  const [stressLevel, setStressLevel] = useState([initialData?.stressLevel || 5]);
  const [energyLevel, setEnergyLevel] = useState([initialData?.energyLevel || 5]);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleVoiceTranscript = (text: string) => {
    setNotes(prev => prev ? `${prev} ${text}` : text);
  };
  
  const { isListening, isSupported, toggleListening } = useVoiceInput(handleVoiceTranscript);

  // Update state when initialData changes
  useEffect(() => {
    if (initialData) {
      if (initialData.mood) setMood(initialData.mood);
      if (initialData.moodScore) setMoodScore([initialData.moodScore]);
      if (initialData.stressLevel) setStressLevel([initialData.stressLevel]);
      if (initialData.energyLevel) setEnergyLevel([initialData.energyLevel]);
      if (initialData.notes) setNotes(initialData.notes);
    }
  }, [initialData]);

  const moodOptions = ['happy', 'calm', 'anxious', 'sad', 'excited', 'stressed', 'tired', 'grateful', 'frustrated', 'hopeful', 'other'];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.createMood({
        mood,
        moodScore: moodScore[0],
        stressLevel: stressLevel[0],
        energyLevel: energyLevel[0],
        notes: notes || undefined,
        date: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['moodLogs'] });
      queryClient.invalidateQueries({ queryKey: ['moods'] });
      toast({ title: "Mood logged successfully!" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smile className="h-5 w-5 text-primary" />
            Quick Mood Log
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Mood</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {moodOptions.map(m => (
                  <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mood Score ({moodScore[0]}/10)</Label>
            <Slider value={moodScore} onValueChange={setMoodScore} min={1} max={10} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Not great</span>
              <span>Amazing</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Stress Level ({stressLevel[0]}/10)</Label>
            <Slider value={stressLevel} onValueChange={setStressLevel} min={1} max={10} step={1} />
          </div>
          <div className="space-y-2">
            <Label>Energy Level ({energyLevel[0]}/10)</Label>
            <Slider value={energyLevel} onValueChange={setEnergyLevel} min={1} max={10} step={1} />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <div className="flex gap-2">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How are you feeling today?" className="flex-1" />
              {isSupported && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={isListening ? "destructive" : "outline"}
                        size="icon"
                        onClick={toggleListening}
                        className={cn(
                          "shrink-0 transition-all",
                          isListening && "animate-pulse"
                        )}
                      >
                        <Mic className={cn("h-4 w-4", isListening && "text-white")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isListening ? "Stop recording" : "Voice input"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Log Mood
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuickActivityDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || 'exercise');
  const [duration, setDuration] = useState([initialData?.duration || 30]);
  const [intensity, setIntensity] = useState(initialData?.intensity || 'moderate');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleVoiceTranscript = (text: string) => {
    setNotes(prev => prev ? `${prev} ${text}` : text);
  };
  
  const { isListening, isSupported, toggleListening } = useVoiceInput(handleVoiceTranscript);

  // Update state when initialData changes
  useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.category) setCategory(initialData.category);
      if (initialData.duration) setDuration([initialData.duration]);
      if (initialData.intensity) setIntensity(initialData.intensity);
      if (initialData.notes) setNotes(initialData.notes);
    }
  }, [initialData]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Please enter an activity title", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createActivity({
        title,
        category,
        duration: duration[0],
        intensity,
        notes: notes || undefined,
        date: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast({ title: "Activity logged successfully!" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Quick Activity Log
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Activity Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning walk, Yoga session"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exercise">Exercise</SelectItem>
                <SelectItem value="meditation">Meditation</SelectItem>
                <SelectItem value="relaxation">Relaxation</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="hobby">Hobby</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Duration: {duration[0]} minutes</Label>
            <Slider value={duration} onValueChange={setDuration} min={5} max={180} step={5} />
          </div>
          <div className="space-y-2">
            <Label>Intensity</Label>
            <Select value={intensity} onValueChange={setIntensity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <div className="flex gap-2">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes about this activity?" className="flex-1" />
              {isSupported && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={isListening ? "destructive" : "outline"}
                        size="icon"
                        onClick={toggleListening}
                        className={cn(
                          "shrink-0 transition-all",
                          isListening && "animate-pulse"
                        )}
                      >
                        <Mic className={cn("h-4 w-4", isListening && "text-white")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isListening ? "Stop recording" : "Voice input"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConversationSidebar({ 
  conversations, 
  activeConversationId, 
  onSelectConversation, 
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  isLoading 
}: {
  conversations: ConversationData[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  isLoading: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleStartEdit = (conv: ConversationData) => {
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Button onClick={onNewConversation} className="w-full gap-2" size="sm">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8 px-4">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                className={cn(
                  "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                  activeConversationId === conv._id 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-secondary/50"
                )}
                onClick={() => onSelectConversation(conv._id)}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                {editingId === conv._id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-7 text-sm"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(conv._id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); handleSaveEdit(conv._id); }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm truncate">{conv.title}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStartEdit(conv); }}>
                          <Edit2 className="h-3 w-3 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv._id); }}
                        >
                          <Trash2 className="h-3 w-3 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function AIKnowledgeAssistant() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [reportDays, setReportDays] = useState("7");
  const [showClientInsights, setShowClientInsights] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showQuickMoodDialog, setShowQuickMoodDialog] = useState(false);
  const [showQuickActivityDialog, setShowQuickActivityDialog] = useState(false);
  const [quickDialogData, setQuickDialogData] = useState<any>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const ALLOWED_DOC_TYPES = ['application/pdf', 'text/plain'];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        title: "File too large", 
        description: "Please select a file under 5MB.", 
        variant: "destructive" 
      });
      return;
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isDocument = ALLOWED_DOC_TYPES.includes(file.type);

    if (!isImage && !isDocument) {
      toast({ 
        title: "Unsupported file type", 
        description: "Please upload an image (JPG, PNG, GIF) or document (PDF, TXT).", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let preview: string | undefined;
      if (isImage) {
        preview = URL.createObjectURL(file);
      }

      setAttachment({
        file,
        base64,
        type: isImage ? 'image' : 'document',
        preview
      });

      toast({ 
        title: "File attached", 
        description: `${file.name} ready to send.` 
      });
    } catch (error) {
      toast({ 
        title: "Error reading file", 
        description: "Could not process the file. Please try again.", 
        variant: "destructive" 
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = () => {
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    setAttachment(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { data: conversationsData, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: AIService.getConversations,
    staleTime: 30000,
  });
  
  // Ensure conversations is always an array
  const conversations = Array.isArray(conversationsData) ? conversationsData : [];

  const { data: latestReport, isLoading: isLoadingReport } = useQuery({
    queryKey: ['wellbeing', 'latest-report'],
    queryFn: () => AIService.getLatestReport(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: moodData } = useQuery({
    queryKey: ['moods', 'recent'],
    queryFn: async () => {
      const response = await api.getMoods({ page: 1, limit: 30 });
      return response.data?.moodLogs || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: activityData } = useQuery({
    queryKey: ['activities', 'recent'],
    queryFn: async () => {
      const response = await api.getActivities({ page: 1, limit: 30 });
      return response.data?.activities || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const clientInsights = useMemo(() => {
    if (!moodData && !activityData) return null;
    return generateClientSideInsights(moodData || [], activityData || []);
  }, [moodData, activityData]);

  const createConversationMutation = useMutation({
    mutationFn: AIService.createConversation,
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConversationId(newConv._id);
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your AI wellbeing assistant. I can see your mood and activity data, so feel free to ask me anything about your wellbeing journey. How are you feeling today?"
      }]);
      setSidebarOpen(false);
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: AIService.deleteConversation,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (activeConversationId === deletedId) {
        setActiveConversationId(null);
        setMessages([]);
      }
    },
  });

  const renameConversationMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => 
      AIService.updateConversationTitle(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: (days: number) => AIService.generateWellbeingReport(days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wellbeing'] });
      setShowClientInsights(false);
    },
    onError: () => {
      setShowClientInsights(true);
    },
  });

  const loadConversation = async (conversationId: string) => {
    try {
      const data = await AIService.getConversation(conversationId);
      setActiveConversationId(conversationId);
      if (data.messages.length === 0) {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Hello! I'm your AI wellbeing assistant. I can see your mood and activity data, so feel free to ask me anything about your wellbeing journey. How are you feeling today?"
        }]);
      } else {
        setMessages(data.messages.map(msg => ({
          id: msg._id,
          role: msg.role,
          content: msg.content,
          sources: msg.sources,
          actions: msg.actions
        })));
      }
      setSidebarOpen(false);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewConversation = () => {
    createConversationMutation.mutate();
  };

  const handleAction = (action: AIAction) => {
    switch (action.type) {
      case 'navigate':
        if (action.path) setLocation(action.path);
        break;
      case 'log_mood':
        setQuickDialogData(action.data || {});
        setShowQuickMoodDialog(true);
        break;
      case 'log_activity':
        setQuickDialogData(action.data || {});
        setShowQuickActivityDialog(true);
        break;
      case 'find_providers':
        const searchParams = action.data?.specialty 
          ? `?specialty=${encodeURIComponent(action.data.specialty)}` 
          : '';
        setLocation(`/directory${searchParams}`);
        break;
      case 'book_appointment':
        if (action.path) setLocation(action.path);
        else setLocation('/directory');
        break;
      case 'generate_report':
        generateReportMutation.mutate(action.data?.days || 7);
        toast({ title: "Generating report...", description: "Your wellbeing report is being created." });
        break;
      case 'view_history':
        setLocation('/history');
        break;
      default:
        if (action.path) setLocation(action.path);
    }
  };

  const handleSendMessage = async () => {
    if (!query.trim() && !attachment) return;

    let convId = activeConversationId;
    
    if (!convId) {
      try {
        const newConv = await AIService.createConversation();
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        convId = newConv._id;
        setActiveConversationId(convId);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return;
      }
    }

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: query || (attachment ? `[Attached ${attachment.type}: ${attachment.file.name}]` : ''),
      attachment: attachment ? {
        type: attachment.type,
        name: attachment.file.name,
        base64: attachment.type === 'image' ? attachment.base64 : undefined,
        mimeType: attachment.file.type
      } : undefined
    };
    setMessages(prev => [...prev, userMsg]);
    
    const currentAttachment = attachment;
    setQuery("");
    removeAttachment();
    setIsTyping(true);

    try {
      const attachmentData = currentAttachment ? {
        type: currentAttachment.type,
        name: currentAttachment.file.name,
        base64: currentAttachment.base64,
        mimeType: currentAttachment.file.type
      } : undefined;

      const response = await AIService.sendMessage(convId, userMsg.content, attachmentData);
      const aiMsg: Message = {
        id: response.assistantMessage._id,
        role: 'assistant',
        content: response.assistantMessage.answer || response.assistantMessage.content,
        sources: response.assistantMessage.sources,
        actions: response.assistantMessage.actions
      };
      setMessages(prev => [...prev, aiMsg]);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an issue processing your request. Please try again."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateReport = () => {
    generateReportMutation.mutate(parseInt(reportDays));
  };

  const sidebarContent = (
    <ConversationSidebar
      conversations={conversations}
      activeConversationId={activeConversationId}
      onSelectConversation={loadConversation}
      onNewConversation={handleNewConversation}
      onDeleteConversation={(id) => deleteConversationMutation.mutate(id)}
      onRenameConversation={(id, title) => renameConversationMutation.mutate({ id, title })}
      isLoading={isLoadingConversations}
    />
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-serif font-bold text-black flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          AI Assistant
        </h1>
        <p className="text-gray-800 font-medium text-lg">Your personal wellbeing companion</p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-secondary/20 gap-2 mb-6 no-scrollbar">
           <TabsTrigger value="chat" className="gap-2 flex-shrink-0"><Bot className="h-4 w-4"/> Chat</TabsTrigger>
           <TabsTrigger value="analytics" className="gap-2 flex-shrink-0"><BarChart2 className="h-4 w-4"/> Wellbeing Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div className="flex gap-4 h-[600px]">
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-64 bg-white border rounded-xl overflow-hidden shrink-0">
              {sidebarContent}
            </div>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col border-primary/20 shadow-lg overflow-hidden relative">
              {/* Mobile Menu Button */}
              <div className="md:hidden absolute top-3 left-3 z-10">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    {sidebarContent}
                  </SheetContent>
                </Sheet>
              </div>

              <div className="absolute top-0 right-0 -z-10 opacity-5 pointer-events-none">
                <img src={aiAssistantImage} alt="" className="w-96 h-96 object-cover" />
              </div>

              <ScrollArea className="flex-1 p-6 pt-14 md:pt-6">
                <div className="space-y-8">
                  {messages.length === 0 ? (
                    <div className="text-center py-20">
                      <Bot className="h-16 w-16 mx-auto text-primary/30 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Start a Conversation</h3>
                      <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Ask about your mood patterns, get activity suggestions, or chat about how you're feeling. I'm here to help with your wellbeing journey!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex mb-3 sm:mb-4",
                          msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[92%] sm:max-w-[80%] px-3 py-2 sm:px-4 sm:py-3 rounded-xl text-sm sm:text-base leading-relaxed",
                          msg.role === 'assistant' 
                            ? "bg-card border shadow-sm text-foreground" 
                            : "bg-primary text-primary-foreground"
                        )}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm sm:prose-base max-w-none prose-p:my-1 sm:prose-p:my-2 prose-ul:my-1 sm:prose-ul:my-2 prose-ol:my-1 sm:prose-ol:my-2 prose-li:my-0.5 sm:prose-li:my-1 prose-headings:my-2 sm:prose-headings:my-3 prose-headings:font-semibold">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-200 text-xs sm:text-sm font-semibold text-gray-600 flex gap-2 items-center">
                              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>Sources: {msg.sources.join(", ")}</span>
                            </div>
                          )}
                          {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                            <ActionButtons actions={msg.actions} onAction={handleAction} />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isTyping && (
                    <div className="flex mb-3 sm:mb-4 justify-start">
                      <div className="bg-card border shadow-sm px-3 py-2 sm:px-4 sm:py-3 rounded-xl flex gap-1 items-center">
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 bg-secondary/10 border-t">
                {attachment && (
                  <div className="mb-3 p-3 bg-white rounded-lg border border-primary/20 flex items-center gap-3">
                    {attachment.type === 'image' && attachment.preview ? (
                      <img 
                        src={attachment.preview} 
                        alt="Attachment preview" 
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <File className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {attachment.type === 'image' ? 'Image' : 'Document'} • {(attachment.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeAttachment}
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex gap-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isTyping}
                          className="rounded-xl shrink-0 h-12 w-12 md:h-14 md:w-14 bg-white"
                        >
                          <Paperclip className="w-5 h-5 md:w-6 md:h-6" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Attach image or document
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Input 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about your mood, stress, activities, or wellbeing..."
                    className="flex-1 bg-white rounded-xl border-primary/20 focus-visible:ring-primary text-base md:text-lg h-12 md:h-14 px-4"
                  />
                  <Button type="submit" size="icon" disabled={(!query.trim() && !attachment) || isTyping} className="rounded-xl shrink-0">
                    <Send className="w-5 h-5 md:w-6 md:h-6" />
                  </Button>
                </form>
                <div className="text-center mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                   <ShieldAlert className="w-3 h-3" />
                   <span>AI provides general insights, not medical advice. Supports images (JPG, PNG, GIF) and documents (PDF, TXT) up to 5MB.</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
           <Card>
              <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5" /> Generate Wellbeing Report
                 </CardTitle>
                 <CardDescription>Analyze your mood and activity patterns using AI.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">Analysis Period</label>
                    <Select value={reportDays} onValueChange={setReportDays}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="14">Last 14 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={generateReportMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {generateReportMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>

                {generateReportMutation.isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Report Generation Failed</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>{(generateReportMutation.error as Error)?.message || 'Failed to generate report.'}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => generateReportMutation.mutate(parseInt(reportDays))}
                        className="mt-2"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" /> Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {generateReportMutation.isSuccess && (
                  <Alert className="bg-green-50 border-green-200">
                    <Sparkles className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Report Generated!</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Your wellbeing report has been generated successfully.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
           </Card>

           {isLoadingReport ? (
             <Card>
               <CardHeader>
                 <Skeleton className="h-6 w-48" />
                 <Skeleton className="h-4 w-64 mt-2" />
               </CardHeader>
               <CardContent className="space-y-4">
                 <Skeleton className="h-24 w-full" />
                 <Skeleton className="h-24 w-full" />
               </CardContent>
             </Card>
           ) : latestReport ? (
             <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                   <div className="flex items-center justify-between flex-wrap gap-2">
                     <CardTitle className="text-lg font-bold text-black">Your Wellbeing Analysis</CardTitle>
                     <div className="flex items-center gap-2">
                       <AIStatusIndicator generatedBy={latestReport.generatedBy} />
                       <Badge className={getWellbeingColor(latestReport.wellbeingLevel)}>
                         {latestReport.wellbeingLevel}
                       </Badge>
                     </div>
                   </div>
                   <CardDescription className="text-gray-700 font-medium">
                     Generated {new Date(latestReport.createdAt).toLocaleDateString()} - Score: {latestReport.overallScore}/100
                   </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="prose prose-sm max-w-none text-gray-800 font-medium">
                      <p>{latestReport.analysis?.summary}</p>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="p-3 bg-white rounded-lg border">
                       <div className="flex items-center justify-between mb-1">
                         <span className="text-xs text-muted-foreground">Mood</span>
                         {getTrendIcon(latestReport.analysis?.trends?.mood)}
                       </div>
                       <span className="text-sm font-semibold capitalize">{latestReport.analysis?.trends?.mood || 'N/A'}</span>
                     </div>
                     <div className="p-3 bg-white rounded-lg border">
                       <div className="flex items-center justify-between mb-1">
                         <span className="text-xs text-muted-foreground">Activity</span>
                         {getTrendIcon(latestReport.analysis?.trends?.activity)}
                       </div>
                       <span className="text-sm font-semibold capitalize">{latestReport.analysis?.trends?.activity || 'N/A'}</span>
                     </div>
                     <div className="p-3 bg-white rounded-lg border">
                       <div className="flex items-center justify-between mb-1">
                         <span className="text-xs text-muted-foreground">Sleep</span>
                         {getTrendIcon(latestReport.analysis?.trends?.sleep)}
                       </div>
                       <span className="text-sm font-semibold capitalize">{latestReport.analysis?.trends?.sleep || 'N/A'}</span>
                     </div>
                     <div className="p-3 bg-white rounded-lg border">
                       <div className="flex items-center justify-between mb-1">
                         <span className="text-xs text-muted-foreground">Stress</span>
                         {getTrendIcon(latestReport.analysis?.trends?.stress)}
                       </div>
                       <span className="text-sm font-semibold capitalize">{latestReport.analysis?.trends?.stress || 'N/A'}</span>
                     </div>
                   </div>

                   {latestReport.analysis?.strengths && latestReport.analysis.strengths.length > 0 && (
                     <div>
                       <h4 className="font-bold text-black mb-2">Strengths</h4>
                       <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                         {latestReport.analysis.strengths.map((s: string, i: number) => (
                           <li key={i}>{s}</li>
                         ))}
                       </ul>
                     </div>
                   )}

                   {latestReport.recommendations && latestReport.recommendations.length > 0 && (
                     <div>
                       <h4 className="font-bold text-black mb-2">Recommendations</h4>
                       <div className="space-y-2">
                         {latestReport.recommendations.slice(0, 3).map((rec: any, i: number) => (
                           <div key={i} className="p-3 bg-white rounded-lg border">
                             <div className="flex items-center justify-between mb-1">
                               <span className="font-medium text-sm">{rec.title}</span>
                               <Badge variant="outline" className="text-xs">{rec.priority}</Badge>
                             </div>
                             <p className="text-xs text-gray-600">{rec.description}</p>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center pt-4 border-t">
                     <div>
                       <div className="text-2xl font-bold text-primary">{latestReport.dataPoints?.moodLogs || 0}</div>
                       <div className="text-xs text-muted-foreground">Mood Logs</div>
                     </div>
                     <div>
                       <div className="text-2xl font-bold text-primary">{latestReport.dataPoints?.activityLogs || 0}</div>
                       <div className="text-xs text-muted-foreground">Activities</div>
                     </div>
                     <div>
                       <div className="text-2xl font-bold text-primary">{latestReport.dataPoints?.averageMoodScore?.toFixed(1) || '-'}</div>
                       <div className="text-xs text-muted-foreground">Avg Mood</div>
                     </div>
                     <div>
                       <div className="text-2xl font-bold text-primary">{latestReport.dataPoints?.totalActivityMinutes || 0}</div>
                       <div className="text-xs text-muted-foreground">Active Mins</div>
                     </div>
                   </div>
                </CardContent>
             </Card>
           ) : (
             <Card>
               <CardContent className="py-12 text-center">
                 <BarChart2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                 <h3 className="font-semibold text-gray-700 mb-2">No Report Yet</h3>
                 <p className="text-sm text-gray-500 mb-4">Generate your first wellbeing report to see insights about your patterns.</p>
               </CardContent>
             </Card>
           )}
        </TabsContent>
      </Tabs>

      <QuickMoodDialog
        open={showQuickMoodDialog}
        onOpenChange={setShowQuickMoodDialog}
        initialData={quickDialogData}
        onSuccess={() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: "Great job logging your mood! Keep tracking to see patterns over time. 😊"
          }]);
        }}
      />

      <QuickActivityDialog
        open={showQuickActivityDialog}
        onOpenChange={setShowQuickActivityDialog}
        initialData={quickDialogData}
        onSuccess={() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: "Activity logged successfully! Stay active and keep up the great work! 💪"
          }]);
        }}
      />
    </div>
  );
}
