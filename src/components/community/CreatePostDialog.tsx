import React, { useState, useRef } from "react";
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
  AlertDialogCancel,
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
import { Loader2, AlertCircle, ImagePlus, X, MapPin, Shield } from "lucide-react";
import { toast } from "sonner";

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
  
  // Photo upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be under 20MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Show safety warning before accepting the image
    setShowSafetyWarning(true);
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSafetyConfirm = () => {
    setShowSafetyWarning(false);
    // Image is already set, just close the dialog
  };

  const handleSafetyCancel = () => {
    setShowSafetyWarning(false);
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !user) return null;

    setUploadingImage(true);
    try {
      const fileExt = selectedImage.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("community-photos")
        .upload(fileName, selectedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("community-photos")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

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

      // Upload image if selected
      let imageUrl: string | null = null;
      if (selectedImage) {
        imageUrl = await uploadImage();
      }

      // Create the post
      const { error } = await supabase.from("forum_posts").insert({
        user_id: user.id,
        category: category as ForumCategory,
        title: title.trim(),
        content: content.trim(),
        is_approved: true,
        moderation_status: "approved",
        image_url: imageUrl,
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
    setSelectedImage(null);
    setImagePreview(null);
    setModerationError(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo (optional)</Label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload a photo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 20MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
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
              disabled={!category || !title.trim() || !content.trim() || isSubmitting || uploadingImage}
              className="w-full"
            >
              {isSubmitting || uploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadingImage ? "Uploading..." : "Creating..."}
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

      {/* Safety Warning Dialog */}
      <AlertDialog open={showSafetyWarning} onOpenChange={setShowSafetyWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-amber-500/10">
                <Shield className="h-5 w-5 text-amber-500" />
              </div>
              <AlertDialogTitle>Photo Safety Reminder</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3 text-left">
              <p>Before sharing a photo, please ensure it doesn't contain:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your face or identifying features</li>
                <li>Location metadata (we strip it, but be careful)</li>
                <li>Personal info like addresses or workplaces</li>
                <li>Screenshots with names visible</li>
                <li>Other people's faces without consent</li>
              </ul>
              <p className="font-medium text-foreground">
                Your safety and privacy come first!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSafetyCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSafetyConfirm}>
              I Understand, Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}