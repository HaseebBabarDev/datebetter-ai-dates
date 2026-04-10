import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { detectCrisisContent } from "@/lib/crisisDetection";
import { CrisisAlertDialog } from "@/components/devi/CrisisAlertDialog";

type ForumCategory = "dating_advice" | "red_flag_warnings" | "success_stories" | "self_care_healing";

interface ForumPost {
  id: string;
  user_id: string;
  category: ForumCategory;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  screen_name?: string;
  has_liked?: boolean;
  image_url?: string | null;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  screen_name?: string;
  has_liked?: boolean;
}

interface PostDetailSheetProps {
  post: ForumPost | null;
  onClose: () => void;
  currentScreenName: string;
  onPostUpdate: () => void;
}

const CATEGORY_COLORS: Record<ForumCategory, string> = {
  dating_advice: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  red_flag_warnings: "bg-red-500/10 text-red-500 border-red-500/20",
  success_stories: "bg-green-500/10 text-green-500 border-green-500/20",
  self_care_healing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const CATEGORY_LABELS: Record<ForumCategory, string> = {
  dating_advice: "Dating Advice",
  red_flag_warnings: "Red Flags",
  success_stories: "Success",
  self_care_healing: "Self-Care",
};

export function PostDetailSheet({ post, onClose, currentScreenName, onPostUpdate }: PostDetailSheetProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localPost, setLocalPost] = useState<ForumPost | null>(null);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [crisisSeverity, setCrisisSeverity] = useState<"moderate" | "severe">("moderate");
  const [crisisCategory, setCrisisCategory] = useState<"crisis" | "harmful_content" | "emergency">("crisis");

  useEffect(() => {
    if (post) {
      setLocalPost(post);
      fetchComments();
    }
  }, [post?.id]);

  const fetchComments = async () => {
    if (!post || !user) return;

    setLoading(true);
    try {
      const { data: commentsData, error } = await supabase
        .from("forum_comments")
        .select("*")
        .eq("post_id", post.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Get screen names
      const userIds = [...new Set(commentsData.map((c) => c.user_id))];
      const { data: profilesData } = await supabase
        .from("community_profiles" as any)
        .select("user_id, screen_name")
        .in("user_id", userIds);

      const screenNameMap = new Map(
        profilesData?.map((p) => [p.user_id, p.screen_name]) || []
      );

      // Get likes
      const { data: likesData } = await supabase
        .from("forum_comment_likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in("comment_id", commentsData.map((c) => c.id));

      const likedIds = new Set(likesData?.map((l) => l.comment_id) || []);

      setComments(
        commentsData.map((c) => ({
          ...c,
          screen_name: screenNameMap.get(c.user_id) || "anonymous",
          has_liked: likedIds.has(c.id),
        }))
      );
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async () => {
    if (!user || !localPost) return;

    try {
      if (localPost.has_liked) {
        await supabase
          .from("forum_post_likes")
          .delete()
          .eq("post_id", localPost.id)
          .eq("user_id", user.id);
      } else {
        await supabase.from("forum_post_likes").insert({
          post_id: localPost.id,
          user_id: user.id,
        });
      }

      setLocalPost((prev) =>
        prev
          ? {
              ...prev,
              has_liked: !prev.has_liked,
              likes_count: prev.has_liked ? prev.likes_count - 1 : prev.likes_count + 1,
            }
          : null
      );
      onPostUpdate();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleLikeComment = async (commentId: string, hasLiked: boolean) => {
    if (!user) return;

    try {
      if (hasLiked) {
        await supabase
          .from("forum_comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
      } else {
        await supabase.from("forum_comment_likes").insert({
          comment_id: commentId,
          user_id: user.id,
        });
      }

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                has_liked: !hasLiked,
                likes_count: hasLiked ? c.likes_count - 1 : c.likes_count + 1,
              }
            : c
        )
      );
    } catch (error) {
      console.error("Error toggling comment like:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !post || !newComment.trim()) return;

    // Check for crisis content
    const crisisResult = detectCrisisContent(newComment);
    if (crisisResult.detected) {
      setCrisisSeverity(crisisResult.severity);
      setCrisisCategory(crisisResult.category || "crisis");
      setShowCrisisAlert(true);
      // Block harmful content from being posted
      if (crisisResult.category === "harmful_content") {
        return;
      }
      // Crisis content shows alert but allows commenting
    }

    setSubmitting(true);
    try {
      // Moderate content
      const { data: moderationResult } = await supabase.functions.invoke(
        "moderate-content",
        {
          body: {
            content: newComment.trim(),
            type: "comment",
          },
        }
      );

      if (moderationResult && !moderationResult.approved) {
        toast.error(moderationResult.reason || "Comment was flagged by moderation.");
        setSubmitting(false);
        return;
      }

      const { data, error } = await supabase
        .from("forum_comments")
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setComments((prev) => [
        ...prev,
        { ...data, screen_name: currentScreenName, has_liked: false },
      ]);
      setNewComment("");
      onPostUpdate();
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (!localPost) return null;

  return (
    <>
      {/* Crisis Alert Dialog */}
      <CrisisAlertDialog
        open={showCrisisAlert}
        onClose={() => setShowCrisisAlert(false)}
        severity={crisisSeverity}
        category={crisisCategory}
      />
    <Sheet open={!!post} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={CATEGORY_COLORS[localPost.category]}>
              {CATEGORY_LABELS[localPost.category]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(localPost.created_at), { addSuffix: true })}
            </span>
          </div>
          <SheetTitle className="text-left">{localPost.title}</SheetTitle>
          <p className="text-xs text-muted-foreground">@{localPost.screen_name}</p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-200px)] py-4">
          {/* Post Content */}
          <div className="space-y-4 pb-6 border-b border-border">
            <p className="text-sm whitespace-pre-wrap">{localPost.content}</p>
            
            {/* Post Images */}
            {localPost.image_url && (() => {
              try {
                const images = JSON.parse(localPost.image_url);
                if (Array.isArray(images) && images.length > 0) {
                  return (
                    <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {images.map((url: string, idx: number) => (
                        <div 
                          key={idx} 
                          className={`relative overflow-hidden rounded-lg ${images.length === 1 ? 'aspect-video' : 'aspect-square'}`}
                        >
                          <img
                            src={url}
                            alt={`Post image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  );
                }
              } catch {
                // Single image URL (backwards compatibility)
                return (
                  <div className="relative aspect-video overflow-hidden rounded-lg">
                    <img
                      src={localPost.image_url}
                      alt="Post image"
                      className="w-full h-full object-cover"
                    />
                  </div>
                );
              }
              return null;
            })()}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLikePost}
              className="gap-1.5"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  localPost.has_liked && "fill-red-500 text-red-500"
                )}
              />
              {localPost.likes_count}
            </Button>
          </div>

          {/* Comments */}
          <div className="py-4 space-y-4">
            <h4 className="text-sm font-medium">
              Comments ({comments.length})
            </h4>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No comments yet. Be the first!
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">@{comment.screen_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeComment(comment.id, comment.has_liked || false)}
                      className="gap-1 h-7 px-2"
                    >
                      <Heart
                        className={cn(
                          "h-3 w-3",
                          comment.has_liked && "fill-red-500 text-red-500"
                        )}
                      />
                      <span className="text-xs">{comment.likes_count}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Comment Input */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <div className="flex items-end gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a supportive comment..."
              rows={2}
              className="resize-none"
              maxLength={500}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              size="icon"
              className="shrink-0"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}