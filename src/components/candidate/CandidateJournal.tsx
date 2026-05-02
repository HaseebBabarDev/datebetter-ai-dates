import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { BookOpen, Plus, Smile, Frown, Meh, Heart, Angry, Trash2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface JournalEntry {
  id: string;
  content: string;
  mood: string | null;
  created_at: string;
}

const MOODS = [
  { value: "happy", icon: Smile, label: "Happy", color: "text-green-500" },
  { value: "sad", icon: Frown, label: "Sad", color: "text-blue-500" },
  { value: "neutral", icon: Meh, label: "Neutral", color: "text-muted-foreground" },
  { value: "loving", icon: Heart, label: "Loving", color: "text-pink-500" },
  { value: "frustrated", icon: Angry, label: "Frustrated", color: "text-orange-500" },
];

interface CandidateJournalProps {
  candidateId: string;
  candidateName: string;
}

export const CandidateJournal: React.FC<CandidateJournalProps> = ({
  candidateId,
  candidateName,
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasDetachmentPlan, setHasDetachmentPlan] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !candidateId) return;
    const fetchData = async () => {
      const [entriesRes, planRes] = await Promise.all([
        supabase
          .from("journal_entries" as any)
          .select("*")
          .eq("user_id", user.id)
          .eq("candidate_id", candidateId)
          .order("created_at", { ascending: false }),
        supabase
          .from("detachment_plans")
          .select("is_unlocked")
          .eq("user_id", user.id)
          .eq("candidate_id", candidateId)
          .eq("is_unlocked", true)
          .maybeSingle(),
      ]);
      setEntries((entriesRes.data as any as JournalEntry[]) || []);
      setHasDetachmentPlan(!!planRes.data);
      setLoading(false);
    };
    fetchData();
  }, [user, candidateId]);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from("journal_entries" as any)
      .select("*")
      .eq("user_id", user!.id)
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });
    setEntries((data as any as JournalEntry[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("journal_entries" as any).insert({
      user_id: user!.id,
      candidate_id: candidateId,
      content: content.trim(),
      mood,
    } as any);
    if (error) {
      toast.error("Failed to save journal entry");
    } else {
      toast.success("Journal entry saved");
      setContent("");
      setMood(null);
      setShowForm(false);
      fetchEntries();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("journal_entries" as any).delete().eq("id", deleteId);
    setDeleteId(null);
    fetchEntries();
    toast.success("Entry deleted");
  };

  // If no detachment plan, show locked state
  if (!hasDetachmentPlan) {
    return (
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-sm font-semibold">Reflection Journal</h3>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Keep a daily journal about your thoughts and feelings. Available with the Detachment Plan.
        </p>
        <div className="flex items-center justify-center gap-1 text-xs text-primary">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-medium">Included with Detachment Plan ($9.99)</span>
        </div>
      </div>
    );
  }

  const getMoodIcon = (moodValue: string | null) => {
    const found = MOODS.find((m) => m.value === moodValue);
    if (!found) return null;
    const Icon = found.icon;
    return <Icon className={`w-3.5 h-3.5 ${found.color}`} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Reflection Journal</h3>
          {entries.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {entries.length}
            </Badge>
          )}
        </div>
        {!showForm && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-xs h-7 border-primary/30 text-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-3 h-3" />
            New Entry
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  What's on your mind about {candidateName}?
                </p>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your thoughts, feelings, or reflections..."
                  className="min-h-[100px] text-sm"
                  autoFocus
                />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">How are you feeling?</p>
                  <div className="flex gap-2">
                    {MOODS.map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.value}
                          onClick={() => setMood(mood === m.value ? null : m.value)}
                          className={`p-2 rounded-lg border transition-all ${
                            mood === m.value
                              ? "border-primary bg-primary/10 scale-110"
                              : "border-border hover:border-primary/30"
                          }`}
                          title={m.label}
                        >
                          <Icon className={`w-4 h-4 ${m.color}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowForm(false);
                      setContent("");
                      setMood(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!content.trim() || saving}
                  >
                    {saving ? "Saving..." : "Save Entry"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : entries.length === 0 && !showForm ? (
        <div className="text-center py-8 space-y-2">
          <BookOpen className="w-8 h-8 text-muted-foreground/50 mx-auto" />
          <p className="text-xs text-muted-foreground">
            No journal entries yet. Start reflecting on your journey with {candidateName}.
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-border/50">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(entry.created_at), "MMM d, yyyy · h:mm a")}
                        </span>
                        {getMoodIcon(entry.mood)}
                      </div>
                      <button
                        onClick={() => setDeleteId(entry.id)}
                        className="p-1 rounded hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete journal entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
