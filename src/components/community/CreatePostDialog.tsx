import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Loader2, AlertCircle, MapPin, Shield, Heart } from "lucide-react";
import { toast } from "sonner";
import { detectCrisisContent } from "@/lib/crisisDetection";
import { CrisisAlertDialog } from "@/components/devi/CrisisAlertDialog";

type ForumCategory = "dating_advice" | "red_flag_warnings" | "success_stories" | "self_care_healing";

const CATEGORIES: { value: ForumCategory; label: string; description: string }[] = [
  { value: "dating_advice", label: "Dating Advice", description: "Tips and questions about dating" },
  { value: "red_flag_warnings", label: "Red Flag Warnings", description: "Share concerning behaviors" },
  { value: "success_stories", label: "Success Stories", description: "Celebrate your wins" },
  { value: "self_care_healing", label: "Self-Care & Healing", description: "Support for wellbeing" },
];

const MAJOR_CITIES = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
  "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
  "Austin", "Seattle", "Denver", "Boston", "Miami",
  "Atlanta", "San Francisco", "Nashville", "Portland", "Las Vegas",
  "London", "Toronto", "Vancouver", "Sydney", "Melbourne",
  "Other"
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
  const [cityTag, setCityTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [showFirstPostDisclosure, setShowFirstPostDisclosure] = useState(false);
  const [hasPostedBefore, setHasPostedBefore] = useState<boolean | null>(null);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [crisisSeverity, setCrisisSeverity] = useState<"moderate" | "severe">("moderate");

  useEffect(() => {
    if (open && user && hasPostedBefore === null) {
      checkIfFirstPost();
    }
  }, [open, user]);

  const checkIfFirstPost = async () => {
    if (!user) return;
    
    try {
      const { count, error } = await supabase
        .from("forum_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (!error) {
        const isFirstPost = count === 0;
        setHasPostedBefore(!isFirstPost);
        if (isFirstPost) {
          setShowFirstPostDisclosure(true);
        }
      }
    } catch (error) {
      console.error("Error checking post history:", error);
    }
  };
  const handleSubmit = async () => {
    if (!user || !category || !title.trim() || !content.trim()) return;

    // Check for crisis content
    const crisisResult = detectCrisisContent(title + " " + content);
    if (crisisResult.detected) {
      setCrisisSeverity(crisisResult.severity);
      setShowCrisisAlert(true);
      // Don't block posting - just show the alert
    }

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
        city_tag: cityTag || null,
      });

      if (error) throw error;

      toast.success("Post created successfully!");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCategory("");
    setTitle("");
    setContent("");
    setCityTag("");
    setModerationError(null);
  };

  return (
    <>
      {/* Crisis Alert Dialog */}
      <CrisisAlertDialog
        open={showCrisisAlert}
        onClose={() => setShowCrisisAlert(false)}
        severity={crisisSeverity}
      />

      {/* First Post Disclosure Dialog */}
      <AlertDialog open={showFirstPostDisclosure} onOpenChange={setShowFirstPostDisclosure}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">Welcome to Our Community</AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4">
              <p className="text-base">
                This is a <strong>positive, supportive space</strong> for sharing experiences and lifting each other up.
              </p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-left">
                <p className="text-sm text-destructive font-medium mb-2">
                  Zero Tolerance Policy
                </p>
                <p className="text-sm text-muted-foreground">
                  Posting to obtain personal information about others, harass, stalk, or target individuals will result in immediate permanent removal from the community.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                By continuing, you agree to keep this space safe and respectful.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-2">
            <AlertDialogAction className="w-full">I Understand & Agree</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a Post</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Community Guidelines Disclosure */}
            <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Safe Space Guidelines</p>
                <p>This is a supportive community. Posts seeking personal information about others or intended to harass will result in permanent removal.</p>
              </div>
            </div>

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

          {/* City Tag */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              City Tag (optional)
            </Label>
            <Select value={cityTag || "none"} onValueChange={(v) => setCityTag(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Add a city tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No city tag</SelectItem>
                {MAJOR_CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
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
    </>
  );
}