import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Star,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { StudioAvailabilityCalendar } from "@/components/studio/StudioAvailabilityCalendar";
import { StudioBookingForm } from "@/components/studio/StudioBookingForm";
import { StudioReviews } from "@/components/studio/StudioReviews";
import { StudioGallery } from "@/components/studio/StudioGallery";

export default function StudioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [studio, setStudio] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudioDetails();
  }, [id]);

  const fetchStudioDetails = async () => {
    if (!id) return;

    try {
      // Use public view to avoid exposing owner_user_id
      const { data: studioData, error: studioError } = await supabase
        .from("studios_public")
        .select("*")
        .eq("id", id)
        .single();

      if (studioError) throw studioError;

      const { data: imagesData } = await supabase
        .from("studio_images")
        .select("*")
        .eq("studio_id", id)
        .order("display_order");

      const { data: reviewsData } = await supabase
        .from("studio_reviews")
        .select("*, profiles(name)")
        .eq("studio_id", id)
        .order("created_at", { ascending: false });

      setStudio(studioData);
      setImages(imagesData || []);
      setReviews(reviewsData || []);
    } catch (error: any) {
      console.error("Error fetching studio:", error);
      toast.error("Failed to load studio details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading studio details...</p>
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Studio not found</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {studio.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  <span className="capitalize">{studio.size}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{studio.area_sqm} sqm</span>
                </div>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span>
                      {avgRating.toFixed(1)} ({reviews.length})
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Badge
              variant={studio.status === "active" ? "default" : "secondary"}
            >
              {studio.status}
            </Badge>
          </div>

          {studio.cover_image && (
            <div className="rounded-lg overflow-hidden border border-border mb-4">
              <img
                src={studio.cover_image}
                alt={studio.title}
                className="w-full h-80 object-cover"
              />
            </div>
          )}

          {studio.description && (
            <p className="text-foreground leading-relaxed">{studio.description}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Amenities */}
            {studio.amenities && studio.amenities.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Amenities
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {studio.amenities.map((amenity: string) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="availability" className="bg-card border border-border rounded-xl p-6">
              <TabsList className="w-full">
                <TabsTrigger value="availability" className="flex-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  Availability
                </TabsTrigger>
                <TabsTrigger value="gallery" className="flex-1">
                  Gallery
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1">
                  Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="availability" className="mt-4">
                <StudioAvailabilityCalendar studioId={studio.id} />
              </TabsContent>

              <TabsContent value="gallery" className="mt-4">
                <StudioGallery images={images} />
              </TabsContent>

              <TabsContent value="reviews" className="mt-4">
                <StudioReviews reviews={reviews} studioId={studio.id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Booking Card */}
          <div className="col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
              <div className="flex items-baseline gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <span className="text-2xl font-bold text-foreground">
                  {studio.base_hourly_rate}
                </span>
                <span className="text-sm text-muted-foreground">/hour</span>
              </div>
              <StudioBookingForm studioId={studio.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
