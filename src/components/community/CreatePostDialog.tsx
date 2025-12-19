import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type ForumCategory = "dating_advice" | "red_flag_warnings" | "success_stories" | "self_care_healing";

const CATEGORIES: { value: ForumCategory; label: string; description: string }[] = [
  { value: "dating_advice", label: "Dating Advice", description: "Tips and questions about dating" },
  { value: "red_flag_warnings", label: "Red Flag Warnings", description: "Share concerning behaviors" },
  { value: "success_stories", label: "Success Stories", description: "Celebrate your wins" },
  { value: "self_care_healing", label: "Self-Care & Healing", description: "Support for wellbeing" },
];

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenName: string;
}

export function CreatePostDialog({ open, onOpenChange, screenName }: CreatePostDialogProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState<ForumCategory | "">("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user || !category || !title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setModerationError(null);

    try {
      // First, moderate the content
      const { data: moderationResult, error: moderationError } = await supabase.functions.invoke(
        "moderate-content",
        {
          body: {
            title: title.trim(),
            content: content.trim(),
            type: "post",
          },
        }
      );

      if (moderationError) {
        console.error("Moderation error:", moderationError);
        // Proceed with post if moderation fails (fail open)
      } else if (moderationResult && !moderationResult.approved) {
        setModerationError(moderationResult.reason || "Content was flagged by our moderation system. Please revise and try again.");
        setIsSubmitting(false);
        return;
      }

      // Create the post
      const { error } = await supabase.from("forum_posts").insert({
        user_id: user.id,
        category: category as ForumCategory,
        title: title.trim(),
        content: content.trim(),
        is_approved: true,
        moderation_status: "approved",
      });

      if (error) throw error;

      toast.success("Post created successfully!");
      onOpenChange(false);
      setCategory("");
      setTitle("");
      setContent("");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Posting as */}
          <div className="text-sm text-muted-foreground">
            Posting as <span className="text-foreground font-medium">@{screenName}</span>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ForumCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div>
                      <div className="font-medium">{cat.label}</div>
                      <div className="text-xs text-muted-foreground">{cat.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/100
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, experiences, or questions..."
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/2000
            </p>
          </div>

          {/* Moderation Error */}
          {moderationError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{moderationError}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!category || !title.trim() || !content.trim() || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Post"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Posts are AI-moderated. Be respectful and supportive.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}