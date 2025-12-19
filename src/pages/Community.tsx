import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Users, Plus, Search, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ForumFeed } from "@/components/community/ForumFeed";
import { DirectMessages } from "@/components/community/DirectMessages";
import { CreatePostDialog } from "@/components/community/CreatePostDialog";
import { ScreenNameSetup } from "@/components/community/ScreenNameSetup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type ForumCategory = "dating_advice" | "red_flag_warnings" | "success_stories" | "self_care_healing";

const CATEGORY_LABELS: Record<ForumCategory, string> = {
  dating_advice: "Dating Advice",
  red_flag_warnings: "Red Flags",
  success_stories: "Success Stories",
  self_care_healing: "Self-Care",
};

const MAJOR_CITIES = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
  "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
  "Austin", "Seattle", "Denver", "Boston", "Miami",
  "Atlanta", "San Francisco", "Nashville", "Portland", "Las Vegas",
  "London", "Toronto", "Vancouver", "Sydney", "Melbourne",
  "Other"
];

const Community = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("forum");
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | "all">("all");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [screenName, setScreenName] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showScreenNameSetup, setShowScreenNameSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkScreenName();
    fetchUnreadCount();
  }, [user]);

  const checkScreenName = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("screen_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.screen_name) {
        setScreenName(data.screen_name);
      } else {
        setShowScreenNameSetup(true);
      }
    } catch (error) {
      console.error("Error checking screen name:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const { count, error } = await supabase
        .from("direct_messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      if (!error && count) {
        setUnreadCount(count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const handleScreenNameSet = (name: string) => {
    setScreenName(name);
    setShowScreenNameSetup(false);
    toast.success("Welcome to the community, " + name + "!");
  };

  const handleCreatePost = () => {
    if (!screenName) {
      setShowScreenNameSetup(true);
      return;
    }
    setShowCreatePost(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading community...</div>
      </div>
    );
  }

  if (showScreenNameSetup) {
    return <ScreenNameSetup onComplete={handleScreenNameSet} />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Community</h1>
              <p className="text-xs text-muted-foreground">@{screenName}</p>
            </div>
          </div>
          <Button onClick={handleCreatePost} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Post
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
          <TabsList className="w-full bg-muted/50">
            <TabsTrigger value="forum" className="flex-1 gap-1.5">
              <Users className="h-4 w-4" />
              Forum
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-1 gap-1.5 relative">
              <MessageCircle className="h-4 w-4" />
              Messages
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px]"
                >
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Content */}
      <main className="px-4 py-4">
        {activeTab === "forum" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="shrink-0"
              >
                All
              </Button>
              {(Object.keys(CATEGORY_LABELS) as ForumCategory[]).map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="shrink-0"
                >
                  {CATEGORY_LABELS[cat]}
                </Button>
              ))}
            </div>

            {/* City Filter */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select value={selectedCity || "all"} onValueChange={(v) => setSelectedCity(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-9">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Filter by city" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cities</SelectItem>
                    {MAJOR_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCity && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setSelectedCity("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Forum Feed */}
            <ForumFeed 
              category={selectedCategory === "all" ? undefined : selectedCategory}
              searchQuery={searchQuery}
              currentScreenName={screenName!}
              cityFilter={selectedCity || undefined}
            />
          </div>
        )}

        {activeTab === "messages" && (
          <DirectMessages 
            currentScreenName={screenName!}
            onUnreadCountChange={setUnreadCount}
          />
        )}
      </main>

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        screenName={screenName!}
      />
    </div>
  );
};

export default Community;