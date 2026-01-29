import { useState, useMemo } from "react";
import AdminLayout from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  BookOpen,
  Lightbulb,
  Megaphone,
  Heart,
  Star,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ContentType = "article" | "research" | "guide" | "announcement" | "tip";
type ContentStatus = "draft" | "published";

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  content: string;
  tags: string[];
  status: ContentStatus;
  featured: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
}

const contentTypeConfig: Record<ContentType, { label: string; icon: typeof FileText; color: string }> = {
  article: { label: "Article", icon: FileText, color: "bg-blue-500" },
  research: { label: "Research", icon: BookOpen, color: "bg-purple-500" },
  guide: { label: "Guide", icon: Lightbulb, color: "bg-amber-500" },
  announcement: { label: "Announcement", icon: Megaphone, color: "bg-green-500" },
  tip: { label: "Health Tip", icon: Heart, color: "bg-rose-500" },
};

const initialMockData: ContentItem[] = [
  {
    id: "1",
    title: "Understanding Mental Health in the Workplace",
    type: "article",
    content: "Mental health is crucial for workplace productivity and employee satisfaction. This article explores strategies for maintaining good mental health while working...",
    tags: ["mental health", "workplace", "wellness"],
    status: "published",
    featured: true,
    author: "Dr. Sarah Johnson",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-20T14:30:00Z",
  },
  {
    id: "2",
    title: "New Research: Benefits of Daily Meditation",
    type: "research",
    content: "A comprehensive study involving 5,000 participants has shown significant improvements in stress levels and cognitive function among those who practiced daily meditation...",
    tags: ["research", "meditation", "stress"],
    status: "published",
    featured: false,
    author: "Research Team",
    createdAt: "2026-01-18T09:00:00Z",
    updatedAt: "2026-01-18T09:00:00Z",
  },
  {
    id: "3",
    title: "How to Start Your Morning Wellness Routine",
    type: "guide",
    content: "Step 1: Wake up at a consistent time each day. Step 2: Practice 5 minutes of stretching. Step 3: Drink a glass of water before anything else...",
    tags: ["morning routine", "wellness", "habits"],
    status: "draft",
    featured: false,
    author: "Wellness Coach Mike",
    createdAt: "2026-01-22T11:00:00Z",
    updatedAt: "2026-01-25T16:45:00Z",
  },
  {
    id: "4",
    title: "Platform Update: New Features Coming Soon",
    type: "announcement",
    content: "We're excited to announce several new features that will be launching next month, including enhanced activity tracking, personalized recommendations, and more...",
    tags: ["platform", "update", "features"],
    status: "published",
    featured: true,
    author: "Product Team",
    createdAt: "2026-01-25T08:00:00Z",
    updatedAt: "2026-01-25T08:00:00Z",
  },
  {
    id: "5",
    title: "Quick Tip: Stay Hydrated for Better Energy",
    type: "tip",
    content: "Drinking enough water throughout the day can significantly improve your energy levels and cognitive function. Aim for 8 glasses per day!",
    tags: ["hydration", "energy", "quick tip"],
    status: "published",
    featured: false,
    author: "Health Team",
    createdAt: "2026-01-26T12:00:00Z",
    updatedAt: "2026-01-26T12:00:00Z",
  },
];

export default function AdminContentPage() {
  const { toast } = useToast();
  const [contentItems, setContentItems] = useState<ContentItem[]>(initialMockData);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "all">("all");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ContentItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ContentItem | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    type: "article" as ContentType,
    content: "",
    tags: "",
    status: "draft" as ContentStatus,
    featured: false,
  });

  const filteredContent = useMemo(() => {
    return contentItems.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [contentItems, searchQuery, typeFilter, statusFilter]);

  const resetForm = () => {
    setFormData({
      title: "",
      type: "article",
      content: "",
      tags: "",
      status: "draft",
      featured: false,
    });
    setEditingItem(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: ContentItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      type: item.type,
      content: item.content,
      tags: item.tags.join(", "),
      status: item.status,
      featured: item.featured,
    });
    setIsFormOpen(true);
  };

  const handleOpenView = (item: ContentItem) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (item: ContentItem) => {
    setDeletingItem(item);
    setIsDeleteOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    const now = new Date().toISOString();
    const tags = formData.tags.split(",").map(t => t.trim()).filter(Boolean);

    if (editingItem) {
      setContentItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...formData, tags, updatedAt: now }
          : item
      ));
      toast({
        title: "Content updated",
        description: "The content has been updated successfully.",
      });
    } else {
      const newItem: ContentItem = {
        id: Date.now().toString(),
        title: formData.title,
        type: formData.type,
        content: formData.content,
        tags,
        status: formData.status,
        featured: formData.featured,
        author: "Current Admin",
        createdAt: now,
        updatedAt: now,
      };
      setContentItems(prev => [newItem, ...prev]);
      toast({
        title: "Content created",
        description: "New content has been created successfully.",
      });
    }

    setIsFormOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (deletingItem) {
      setContentItems(prev => prev.filter(item => item.id !== deletingItem.id));
      toast({
        title: "Content deleted",
        description: "The content has been deleted successfully.",
      });
      setIsDeleteOpen(false);
      setDeletingItem(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const ContentTypeIcon = ({ type }: { type: ContentType }) => {
    const config = contentTypeConfig[type];
    const Icon = config.icon;
    return (
      <div className={`inline-flex items-center justify-center w-6 h-6 rounded ${config.color} text-white`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
    );
  };

  return (
    <AdminLayout title="Content Management">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Content & Resources</h2>
          <p className="text-muted-foreground">
            Manage articles, research summaries, guides, announcements, and health tips.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {Object.entries(contentTypeConfig).map(([type, config]) => {
            const count = contentItems.filter(item => item.type === type).length;
            const Icon = config.icon;
            return (
              <Card key={type} className="border border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{config.label}s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border border-border/60">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Content</CardTitle>
                <CardDescription>
                  {filteredContent.length} item{filteredContent.length !== 1 ? "s" : ""} found
                </CardDescription>
              </div>
              <Button onClick={handleOpenCreate} data-testid="button-create-content">
                <Plus className="h-4 w-4 mr-2" />
                Create Content
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-content"
                />
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ContentType | "all")}>
                  <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(contentTypeConfig).map(([type, config]) => (
                      <SelectItem key={type} value={type}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ContentStatus | "all")}>
                  <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No content found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContent.map((item) => (
                      <TableRow key={item.id} data-testid={`row-content-${item.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.featured && (
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            )}
                            <span className="font-medium line-clamp-1">{item.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ContentTypeIcon type={item.type} />
                            <span className="text-sm">{contentTypeConfig[item.type].label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === "published" ? "default" : "secondary"}>
                            {item.status === "published" ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.author}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenView(item)}
                              data-testid={`button-view-${item.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(item)}
                              data-testid={`button-edit-${item.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDelete(item)}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Content" : "Create New Content"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the content details below." : "Fill in the details to create new content."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter content title"
                data-testid="input-content-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Content Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as ContentType }))}
              >
                <SelectTrigger data-testid="select-content-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(contentTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your content here..."
                rows={8}
                data-testid="textarea-content-body"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="wellness, health, tips"
                data-testid="input-content-tags"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="font-medium">Status</Label>
                <p className="text-sm text-muted-foreground">Publish this content immediately</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Draft</span>
                <Switch
                  checked={formData.status === "published"}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? "published" : "draft" }))}
                  data-testid="switch-content-status"
                />
                <span className="text-sm text-muted-foreground">Published</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="font-medium">Featured</Label>
                <p className="text-sm text-muted-foreground">Show this content prominently</p>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                data-testid="switch-content-featured"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save-content">
              {editingItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {viewingItem && <ContentTypeIcon type={viewingItem.type} />}
              <DialogTitle>{viewingItem?.title}</DialogTitle>
            </div>
            <DialogDescription>
              {viewingItem && `${contentTypeConfig[viewingItem.type].label} by ${viewingItem.author}`}
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4 py-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={viewingItem.status === "published" ? "default" : "secondary"}>
                  {viewingItem.status === "published" ? "Published" : "Draft"}
                </Badge>
                {viewingItem.featured && (
                  <Badge variant="outline" className="border-amber-500 text-amber-600">
                    <Star className="h-3 w-3 mr-1 fill-amber-500" />
                    Featured
                  </Badge>
                )}
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{viewingItem.content}</p>
              </div>
              {viewingItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {viewingItem.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="text-sm text-muted-foreground pt-4 border-t">
                <p>Created: {formatDate(viewingItem.createdAt)}</p>
                <p>Last updated: {formatDate(viewingItem.updatedAt)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewOpen(false);
              if (viewingItem) handleOpenEdit(viewingItem);
            }}>
              Edit Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingItem?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
