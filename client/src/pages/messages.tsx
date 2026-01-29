import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Send, 
  MoreVertical, 
  Paperclip, 
  CheckCheck,
  MessageSquare,
  Menu,
  Loader2,
  Plus,
  Trash2,
  Ban,
  Flag,
  Archive
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Participant {
  _id: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

interface LastMessage {
  content: string;
  senderId: string;
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  lastMessage?: LastMessage;
  unreadCount: number;
  updatedAt: string;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: Participant | string;
  recipientId: string;
  content: string;
  type: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

function getParticipantInitials(participant: Participant | null): string {
  if (!participant) return '?';
  const firstName = participant.profile?.firstName;
  const lastName = participant.profile?.lastName;
  if (firstName || lastName) {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  }
  if (participant.email) {
    return participant.email[0].toUpperCase();
  }
  return '?';
}

function getDisplayName(participant: Participant | null): string {
  if (!participant) return 'Unknown User';
  const firstName = participant.profile?.firstName || '';
  const lastName = participant.profile?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) return fullName;
  if (participant.email) return participant.email;
  return 'Unknown User';
}

function getAvatarUrl(participant: Participant | null): string | undefined {
  return participant?.profile?.avatarUrl || undefined;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getOtherParticipant(participants: Participant[], currentUserId: string): Participant | null {
  return participants.find(p => p._id !== currentUserId) || participants[0] || null;
}

export default function Messages() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const currentUser = api.getUser();
  const currentUserId = currentUser?._id || currentUser?.id || '';

  const handleAttachmentClick = () => {
    toast({
      title: "Coming Soon",
      description: "File sharing will be available in a future update.",
    });
  };

  const handleMenuAction = (action: string) => {
    toast({
      title: "Coming Soon",
      description: `${action} will be available in a future update.`,
    });
  };

  const { data: conversationsData, isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.getConversations();
      return response.data;
    },
    refetchInterval: 30000,
  });

  const conversations = conversationsData?.conversations || [];

  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['conversation-messages', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return null;
      const response = await api.getConversationMessages(selectedConversationId);
      return response.data;
    },
    enabled: !!selectedConversationId,
    refetchInterval: 10000,
  });

  const messages = messagesData?.messages || [];
  const selectedConversation = messagesData?.conversation || conversations.find((c: Conversation) => c._id === selectedConversationId);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const response = await api.sendMessage(conversationId, content);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await api.markMessageAsRead(messageId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const reportConversationMutation = useMutation({
    mutationFn: async ({ conversationId, reason, description }: { conversationId: string; reason: string; description?: string }) => {
      const response = await api.reportConversation({ conversationId, reason, description });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Thank you for reporting. Our team will review this conversation.",
      });
      setIsReportDialogOpen(false);
      setReportReason("");
      setReportDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReport = () => {
    if (!selectedConversationId || !reportReason) return;
    reportConversationMutation.mutate({
      conversationId: selectedConversationId,
      reason: reportReason,
      description: reportDescription || undefined,
    });
  };

  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && currentUserId) {
      messages.forEach((msg: Message) => {
        const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
        if (!msg.read && senderId !== currentUserId) {
          markAsReadMutation.mutate(msg._id);
        }
      });
    }
  }, [messages, currentUserId]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedConversationId) return;
    sendMessageMutation.mutate({ conversationId: selectedConversationId, content: inputText.trim() });
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((conv: Conversation) => {
    if (!searchQuery) return true;
    const other = getOtherParticipant(conv.participants, currentUserId);
    if (!other) return false;
    const fullName = `${other.profile?.firstName || ''} ${other.profile?.lastName || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || other.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedOtherParticipant = selectedConversation 
    ? getOtherParticipant(selectedConversation.participants, currentUserId)
    : null;

  const ConversationList = () => (
    <>
      <div className="p-2 sm:p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Conversations</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-7 sm:pl-8 bg-background h-8 sm:h-9 text-xs sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col p-2 gap-1">
          {loadingConversations ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3">
                <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2.5 w-full" />
                </div>
              </div>
            ))
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conv: Conversation) => {
              const other = getOtherParticipant(conv.participants, currentUserId);
              if (!other) return null;
              
              return (
                <button 
                  key={conv._id}
                  className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 text-left transition-all rounded-lg group ${
                    selectedConversationId === conv._id 
                      ? 'bg-background shadow-sm ring-1 ring-border' 
                      : 'hover:bg-background/50 hover:shadow-sm'
                  }`}
                  onClick={() => {
                    setSelectedConversationId(conv._id);
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border border-border">
                      {getAvatarUrl(other) && <AvatarImage src={getAvatarUrl(other)} />}
                      <AvatarFallback className="bg-primary/5 text-primary font-medium text-[10px] sm:text-xs">
                        {getParticipantInitials(other)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 overflow-hidden min-w-0">
                    <div className="flex items-center justify-between mb-0.5 gap-1">
                      <span className={`font-semibold text-xs sm:text-sm truncate ${
                        conv.unreadCount > 0 ? 'text-foreground' : 'text-foreground/80'
                      }`}>
                        {getDisplayName(other)}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {conv.lastMessage?.createdAt ? formatTime(conv.lastMessage.createdAt) : ''}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${
                      conv.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                    }`}>
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="flex h-full items-center pl-1 shrink-0">
                      <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary text-[8px] sm:text-[10px] font-medium text-primary-foreground shadow-sm">
                        {conv.unreadCount}
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </>
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-border/40 pb-4 sm:pb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              Messages
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Chat with your healthcare providers and support team.
          </p>
        </div>
        <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Conversation</span>
              <span className="sm:hidden">New Chat</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] sm:max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Start New Conversation</DialogTitle>
              <DialogDescription>
                Select a topic to begin a new conversation with our support team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="appointment">Appointment Help</SelectItem>
                    <SelectItem value="prescription">Prescription Refill</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="technical">Technical Support</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedTopic === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="customTopic">Describe your topic</Label>
                  <Input
                    id="customTopic"
                    placeholder="Enter your topic..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewConversationOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: "Coming Soon",
                    description: "Starting new conversations will be available in a future update.",
                  });
                  setIsNewConversationOpen(false);
                  setSelectedTopic("");
                  setCustomTopic("");
                }}
                disabled={!selectedTopic || (selectedTopic === "other" && !customTopic.trim())}
              >
                Start Conversation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="h-[calc(100vh-280px)] sm:h-[calc(100vh-250px)] min-h-[400px] sm:min-h-[500px] mt-0">
        <Card className="h-full flex overflow-hidden border bg-card shadow-sm rounded-xl">
          <div className="hidden md:flex w-[320px] border-r bg-muted/10 flex-col shrink-0">
            <ConversationList />
          </div>

          <div className="flex-1 flex flex-col bg-background min-w-0">
            {!selectedConversationId ? (
              <div className="flex-1 flex items-center justify-center text-center p-4 sm:p-6">
                <div>
                  <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground/30" />
                  <h3 className="font-semibold text-base sm:text-lg mb-1">Select a conversation</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground px-2">
                    Choose a conversation from the list to start messaging
                  </p>
                  <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-3 sm:mt-4 md:hidden">
                        <Menu className="h-4 w-4 mr-2" />
                        View Chats
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[260px] sm:w-[300px]">
                      <div className="flex flex-col h-full bg-muted/10">
                        <ConversationList />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            ) : (
              <>
                <div className="p-2 sm:p-4 border-b flex items-center gap-2 sm:gap-3 shadow-sm z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="md:hidden -ml-2 mr-1">
                        <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[260px] sm:w-[300px]">
                      <div className="flex flex-col h-full bg-muted/10">
                        <ConversationList />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border flex-shrink-0">
                    {getAvatarUrl(selectedOtherParticipant) && <AvatarImage src={getAvatarUrl(selectedOtherParticipant)} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getParticipantInitials(selectedOtherParticipant)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm truncate">
                      {getDisplayName(selectedOtherParticipant)}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 sm:w-48">
                        <DropdownMenuItem onClick={() => handleMenuAction("Clear chat")}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear chat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMenuAction("Archive conversation")}>
                          <Archive className="w-4 h-4 mr-2" />
                          Archive conversation
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleMenuAction("Block user")}>
                          <Ban className="w-4 h-4 mr-2" />
                          Block user
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)} className="text-destructive">
                          <Flag className="w-4 h-4 mr-2" />
                          Report User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                  <DialogContent className="max-w-[90vw] sm:max-w-md w-full">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Flag className="h-5 w-5 text-red-500" />
                        Report User
                      </DialogTitle>
                      <DialogDescription>
                        Report inappropriate behavior or content in this conversation.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="text-amber-600 mt-0.5">🔒</div>
                        <div>
                          <p className="font-medium text-amber-800">Privacy Notice</p>
                          <p className="text-amber-700 text-xs mt-1">
                            By reporting, the last 30 messages of this conversation will be shared with our admin team for review. 
                            All other conversations remain private and encrypted.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="reportReason">Reason for reporting *</Label>
                        <Select value={reportReason} onValueChange={setReportReason}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="harassment">Harassment or bullying</SelectItem>
                            <SelectItem value="spam">Spam or unwanted messages</SelectItem>
                            <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                            <SelectItem value="scam">Scam or fraud attempt</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reportDescription">Additional details (optional)</Label>
                        <Textarea
                          id="reportDescription"
                          placeholder="Provide any additional context about the issue..."
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setIsReportDialogOpen(false);
                        setReportReason("");
                        setReportDescription("");
                      }}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleSubmitReport}
                        disabled={!reportReason || reportConversationMutation.isPending}
                      >
                        {reportConversationMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Report"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
               
                <ScrollArea className="flex-1 p-2 sm:p-4 md:p-6 bg-slate-50/50" ref={scrollRef}>
                  <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
                    {loadingMessages ? (
                      <div className="flex justify-center py-6 sm:py-8">
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <p className="text-xs sm:text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <>
                        <div className="text-center">
                          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground bg-muted/50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                            {new Date(messages[0]?.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {messages.map((msg: Message) => {
                          const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                          const isMe = senderId === currentUserId;
                          
                          return (
                            <div key={msg._id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`flex flex-col gap-0.5 max-w-[90%] sm:max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                <div 
                                  className={`px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm text-xs sm:text-sm leading-relaxed ${
                                    isMe 
                                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' 
                                      : 'bg-white border text-foreground rounded-2xl rounded-tl-sm'
                                  }`}
                                >
                                  {msg.content}
                                </div>
                                <span className="text-[8px] sm:text-[10px] text-muted-foreground px-1 flex items-center gap-0.5">
                                  {formatTime(msg.createdAt)}
                                  {isMe && msg.read && <CheckCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </ScrollArea>

                <div className="p-2 sm:p-4 border-t bg-background mt-auto">
                  <div className="max-w-3xl mx-auto flex items-end gap-1.5 sm:gap-2 bg-muted/30 p-1.5 sm:p-2 rounded-2xl border focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-background self-end mb-0.5 hidden sm:flex"
                      onClick={handleAttachmentClick}
                    >
                      <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                    <Textarea 
                      placeholder="Type message..." 
                      className="flex-1 min-h-[36px] sm:min-h-[40px] max-h-[120px] border-0 bg-transparent focus-visible:ring-0 resize-none py-2 sm:py-2.5 px-1.5 sm:px-2 text-xs sm:text-sm" 
                      rows={1}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button 
                      size="icon" 
                      className="rounded-xl shrink-0 self-end mb-0.5 shadow-sm" 
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() || sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
