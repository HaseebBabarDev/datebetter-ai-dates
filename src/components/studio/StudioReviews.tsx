import { format } from "date-fns";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StudioReviewsProps {
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    profiles: { name: string } | null;
  }>;
  studioId: string;
}

export function StudioReviews({ reviews }: StudioReviewsProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No reviews yet. Be the first to leave a review!
      </div>
    );
  }

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
          <span className="text-3xl font-bold">{avgRating.toFixed(1)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-muted/50 rounded-lg p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {review.profiles?.name?.charAt(0) || "?"}
                </div>
                <span className="font-medium text-sm">
                  {review.profiles?.name || "Anonymous"}
                </span>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                {review.rating}
              </Badge>
            </div>
            {review.comment && (
              <p className="text-sm text-foreground">{review.comment}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {format(new Date(review.created_at), "MMM d, yyyy")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
