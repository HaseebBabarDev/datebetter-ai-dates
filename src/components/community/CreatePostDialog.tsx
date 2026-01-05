import React, { useState, useEffect, useRef } from "react";
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
import { Loader2, AlertCircle, MapPin, Shield, Heart, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { detectCrisisContent } from "@/lib/crisisDetection";
import { CrisisAlertDialog } from "@/components/devi/CrisisAlertDialog";

const MAX_IMAGES = 4;

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
  const [crisisCategory, setCrisisCategory] = useState<"crisis" | "harmful_content">("crisis");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalImages = selectedImages.length + newFiles.length;

    if (totalImages > MAX_IMAGES) {
      toast.error(`You can only upload up to ${MAX_IMAGES} images`);
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    for (const file of newFiles) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Max size is 5MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create previews using Promise.all for proper async handling
    const readFileAsDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    Promise.all(validFiles.map(readFileAsDataURL))
      .then((newPreviews) => {
        setImagePreviews((prev) => [...prev, ...newPreviews]);
      })
      .catch((error) => {
        console.error("Error reading files:", error);
        toast.error("Failed to load image previews");
      });

    setSelectedImages((prev) => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!user || selectedImages.length === 0) return [];

    setUploadingImages(true);

    try {
      // Upload all images in parallel with unique filenames
      const uploadPromises = selectedImages.map(async (file, index) => {
        const fileExt = file.name.split(".").pop();
        const uniqueId = `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
        const fileName = `${user.id}/${uniqueId}.${fileExt}`;

        console.log(`Uploading image ${index + 1}/${selectedImages.length}: ${fileName}`);

        const { error: uploadError } = await supabase.storage
          .from("community-photos")
          .upload(fileName, file);

        if (uploadError) {
          console.error(`Upload error for image ${index + 1}:`, uploadError);
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from("community-photos")
          .getPublicUrl(fileName);

        console.log(`Uploaded image ${index + 1}: ${urlData.publicUrl}`);
        return urlData.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      console.log(`Successfully uploaded ${uploadedUrls.length} images`);
      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !category || !title.trim() || !content.trim()) return;

    // Check for crisis content
    const crisisResult = detectCrisisContent(title + " " + content);
    if (crisisResult.detected) {
      setCrisisSeverity(crisisResult.severity);
      setCrisisCategory(crisisResult.category || "crisis");
      setShowCrisisAlert(true);
      // Block harmful content from being posted
      if (crisisResult.category === "harmful_content") {
        return;
      }
      // Crisis content shows alert but allows posting
    }

    setIsSubmitting(true);
    setModerationError(null);

    try {
      // Convert images to base64 for moderation
      const imageBase64Array: string[] = [];
      for (const preview of imagePreviews) {
        // Extract base64 data from data URL
        const base64 = preview.split(",")[1];
        if (base64) {
          imageBase64Array.push(base64);
        }
      }

      // Moderate content and images together
      const { data: moderationResult, error: moderationError } = await supabase.functions.invoke(
        "moderate-content",
        {
          body: {
            title: title.trim(),
            content: content.trim(),
            type: "post",
            images: imageBase64Array,
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

      // Upload images if any
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadImages();
      }

      // Create the post with image URLs (store as JSON string in image_url field)
      const { error } = await supabase.from("forum_posts").insert({
        user_id: user.id,
        category: category as ForumCategory,
        title: title.trim(),
        content: content.trim(),
        is_approved: true,
        moderation_status: "approved",
        city_tag: cityTag || null,
        image_url: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
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
    setShowCrisisAlert(false);
    setSelectedImages([]);
    setImagePreviews([]);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <>
      {/* Crisis Alert Dialog */}
      <CrisisAlertDialog
        open={showCrisisAlert}
        onClose={() => setShowCrisisAlert(false)}
        severity={crisisSeverity}
        category={crisisCategory}
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

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <ImagePlus className="h-3.5 w-3.5" />
              Photos (optional, up to {MAX_IMAGES})
            </Label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedImages.length < MAX_IMAGES && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                {selectedImages.length === 0 ? "Add Photos" : `Add More (${MAX_IMAGES - selectedImages.length} left)`}
              </Button>
            )}
            
            <p className="text-xs text-muted-foreground">
              Images are moderated for explicit content.
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
            disabled={!category || !title.trim() || !content.trim() || isSubmitting || uploadingImages}
            className="w-full"
          >
            {isSubmitting || uploadingImages ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadingImages ? "Uploading images..." : "Creating..."}
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