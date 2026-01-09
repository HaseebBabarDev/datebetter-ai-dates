import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  MessageSquare, 
  Flag, 
  Loader2, 
  RefreshCw,
  Trash2,
  Check,
  X,
  Users,
  ThumbsUp
} from "lucide-react";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  moderation_status: string;
  created_at: string;
  user_name?: string;
}

interface CommunityStats {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  pendingModeration: number;
  flaggedContent: number;
}

export function AdminCommunitySection() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const [postsResult, commentsResult, likesResult, pendingResult] = await Promise.all([
        supabase.from("forum_posts").select("*", { count: "exact", head: true }),
        supabase.from("forum_comments").select("*", { count: "exact", head: true }),
        supabase.from("forum_post_likes").select("*", { count: "exact", head: true }),
        supabase.from("forum_posts").select("*", { count: "exact", head: true }).eq("moderation_status", "pending")
      ]);

      setStats({
        totalPosts: postsResult.count || 0,
        totalComments: commentsResult.count || 0,
        totalLikes: likesResult.count || 0,
        pendingModeration: pendingResult.count || 0,
        flaggedContent: 0
      });

      // Fetch recent posts
      const { data: postsData, error } = await supabase
        .from("forum_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get user names
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, screen_name")
        .in("user_id", userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p.screen_name || p.name]) || []);

      const enrichedPosts = postsData?.map(p => ({
        ...p,
        user_name: profilesMap.get(p.user_id) || "Unknown"
      })) || [];

      setPosts(enrichedPosts);
    } catch (error) {
      console.error("Error fetching community data:", error);
      toast.error("Failed to load community data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setDeletingPost(postId);
    try {
      // Delete comments first
      await supabase.from("forum_comments").delete().eq("post_id", postId);
      // Delete likes
      await supabase.from("forum_post_likes").delete().eq("post_id", postId);
      // Delete post
      const { error } = await supabase.from("forum_posts").delete().eq("id", postId);

      if (error) throw error;

      toast.success("Post deleted successfully");
      fetchCommunityData();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setDeletingPost(null);
    }
  };

  const handleModeratePost = async (postId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("forum_posts")
        .update({ 
          moderation_status: status,
          is_approved: status === "approved"
        })
        .eq("id", postId);

      if (error) throw error;

      toast.success(`Post ${status}`);
      fetchCommunityData();
    } catch (error) {
      console.error("Error moderating post:", error);
      toast.error("Failed to moderate post");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Community Management</h2>
          <p className="text-muted-foreground">Manage forum posts, comments, and moderation</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchCommunityData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Total Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalPosts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalComments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
                Likes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalLikes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.pendingModeration}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Posts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No posts found</p>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {posts.map((post) => (
                <div key={post.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-sm line-clamp-1">{post.title}</p>
                        <Badge variant="outline" className="text-xs">{post.category}</Badge>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            post.moderation_status === "approved" 
                              ? "bg-green-500/10 text-green-600" 
                              : post.moderation_status === "pending"
                              ? "bg-yellow-500/10 text-yellow-600"
                              : "bg-red-500/10 text-red-600"
                          }`}
                        >
                          {post.moderation_status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.content}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>By: {post.user_name}</span>
                        <span>•</span>
                        <span>{post.likes_count} likes</span>
                        <span>•</span>
                        <span>{post.comments_count} comments</span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {post.moderation_status === "pending" && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleModeratePost(post.id, "approved")}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleModeratePost(post.id, "rejected")}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeletePost(post.id)}
                        disabled={deletingPost === post.id}
                      >
                        {deletingPost === post.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
