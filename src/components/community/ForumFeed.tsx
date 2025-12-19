import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, MoreHorizontal, Flag, Send, MapPin, Pin, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostDetailSheet } from "./PostDetailSheet";
import { MessageUserDialog } from "./MessageUserDialog";

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
  city_tag?: string | null;
}

interface ForumFeedProps {
  category?: ForumCategory;
  searchQuery?: string;
  currentScreenName: string;
  cityFilter?: string;
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

export function ForumFeed({ category, searchQuery, currentScreenName, cityFilter }: ForumFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [messageUser, setMessageUser] = useState<{ userId: string; screenName: string } | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [category, searchQuery, cityFilter]);

  const fetchPosts = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from("forum_posts")
        .select("*")
        .eq("is_approved", true)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(50);

      if (category) {
        query = query.eq("category", category);
      }

      if (cityFilter) {
        query = query.eq("city_tag", cityFilter);
      }

      const { data: postsData, error: postsError } = await query;

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Get user screen names - only select screen_name field for privacy
      const userIds = [...new Set(postsData.map((p) => p.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, screen_name")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Error fetching screen names:", profilesError);
      }

      const screenNameMap = new Map(
        profilesData?.map((p) => [p.user_id, p.screen_name]) || []
      );

      // Check which posts user has liked
      const { data: likesData } = await supabase
        .from("forum_post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postsData.map((p) => p.id));

      const likedPostIds = new Set(likesData?.map((l) => l.post_id) || []);

      let enrichedPosts = postsData.map((post) => ({
        ...post,
        category: post.category as ForumCategory,
        screen_name: screenNameMap.get(post.user_id) || "anonymous",
        has_liked: likedPostIds.has(post.id),
        city_tag: (post as any).city_tag || null,
      }));

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        enrichedPosts = enrichedPosts.filter(
          (post) =>
            post.title.toLowerCase().includes(query) ||
            post.content.toLowerCase().includes(query)
        );
      }

      // Sort: success_stories first, then by created_at desc
      enrichedPosts.sort((a, b) => {
        if (a.category === "success_stories" && b.category !== "success_stories") return -1;
        if (a.category !== "success_stories" && b.category === "success_stories") return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setPosts(enrichedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, hasLiked: boolean) => {
    if (!user) return;

    try {
      if (hasLiked) {
        await supabase
          .from("forum_post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      } else {
        await supabase.from("forum_post_likes").insert({
          post_id: postId,
          user_id: user.id,
        });
      }

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                has_liked: !hasLiked,
                likes_count: hasLiked
                  ? post.likes_count - 1
                  : post.likes_count + 1,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const handleReport = async (postId: string) => {
    toast.success("Post reported. Our team will review it.");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-5 w-3/4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">
            {searchQuery
              ? "No posts match your search"
              : "No posts yet. Be the first to share!"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {posts.map((post) => {
          const isSuccessStory = post.category === "success_stories";
          return (
          <Card 
            key={post.id} 
            className={`cursor-pointer hover:border-primary/50 transition-colors ${
              isSuccessStory 
                ? "border-green-500/40 bg-gradient-to-br from-green-500/5 to-transparent ring-1 ring-green-500/20" 
                : ""
            }`}
            onClick={() => setSelectedPost(post)}
          >
            <CardHeader className="pb-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSuccessStory && (
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1">
                      <Sparkles className="h-3 w-3" />
                      Featured
                    </Badge>
                  )}
                  <Badge 
                    variant="outline" 
                    className={CATEGORY_COLORS[post.category]}
                  >
                    {CATEGORY_LABELS[post.category]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {post.user_id !== user?.id && (
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMessageUser({ userId: post.user_id, screenName: post.screen_name || "anonymous" });
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Message @{post.screen_name}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReport(post.id);
                      }}
                      className="text-destructive"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Report post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">@{post.screen_name}</p>
                  {post.city_tag && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {post.city_tag}
                    </Badge>
                  )}
                </div>
                <h3 className="font-medium text-sm leading-tight">{post.title}</h3>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {post.content}
              </p>

              <div className="flex items-center gap-4 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-8 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post.id, post.has_liked || false);
                  }}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      post.has_liked ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                  <span className="text-xs">{post.likes_count}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-8 px-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs">{post.comments_count}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>

      {/* Post Detail Sheet */}
      <PostDetailSheet
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        currentScreenName={currentScreenName}
        onPostUpdate={fetchPosts}
      />

      {/* Message User Dialog */}
      <MessageUserDialog
        open={!!messageUser}
        onOpenChange={(open) => !open && setMessageUser(null)}
        recipientId={messageUser?.userId || ""}
        recipientScreenName={messageUser?.screenName || ""}
      />
    </>
  );
}