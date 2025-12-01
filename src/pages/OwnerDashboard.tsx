import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, DollarSign, Calendar, Home, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Studio {
  id: string;
  title: string;
  size: string;
  status: string;
  base_hourly_rate: number;
  cover_image: string | null;
}

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  total_hours: number;
  status: string;
  created_at: string;
  studio_id: string;
  studios: {
    title: string;
  };
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOwnerData();
    }
  }, [user]);

  const fetchOwnerData = async () => {
    try {
      // Fetch studios
      const { data: studiosData, error: studiosError } = await supabase
        .from("studios")
        .select("*")
        .eq("owner_user_id", user?.id);

      if (studiosError) throw studiosError;

      // Fetch bookings for all studios
      const studioIds = studiosData?.map((s) => s.id) || [];
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("studio_bookings")
        .select("*, studios(title)")
        .in("studio_id", studioIds)
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;

      setStudios(studiosData || []);
      setBookings(bookingsData || []);
    } catch (error: any) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("studio_bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success(`Booking ${newStatus === "confirmed" ? "approved" : "declined"}`);
      fetchOwnerData();
    } catch (error: any) {
      toast.error("Failed to update booking");
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
  const monthlyRevenue = confirmedBookings
    .filter((b) => {
      const bookingDate = new Date(b.booking_date);
      const now = new Date();
      return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Studio Owner Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your studios and bookings</p>
          </div>
          <Button onClick={() => navigate("/list-studio")} className="gap-2">
            <Plus className="w-4 h-4" />
            List New Studio
          </Button>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Studios</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studios.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingBookings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${monthlyRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">Booking Requests</TabsTrigger>
            <TabsTrigger value="studios">My Studios</TabsTrigger>
            <TabsTrigger value="history">Booking History</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Booking Requests</CardTitle>
                <CardDescription>Review and manage incoming booking requests</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingBookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No pending booking requests</p>
                ) : (
                  <div className="space-y-4">
                    {pendingBookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{booking.studios.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.booking_date).toLocaleDateString()} • {booking.start_time} - {booking.end_time}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {booking.total_hours} hours • ${Number(booking.total_amount).toFixed(2)}
                            </p>
                          </div>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleBookingAction(booking.id, "confirmed")}
                            className="gap-2"
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleBookingAction(booking.id, "declined")}
                            variant="outline"
                            className="gap-2"
                            size="sm"
                          >
                            <XCircle className="w-4 h-4" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="studios" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studios.map((studio) => (
                <Card key={studio.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/studio/${studio.id}`)}>
                  <div className="aspect-video bg-muted relative">
                    {studio.cover_image && (
                      <img src={studio.cover_image} alt={studio.title} className="w-full h-full object-cover" />
                    )}
                    <Badge className="absolute top-2 right-2">{studio.status}</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle>{studio.title}</CardTitle>
                    <CardDescription>Size: {studio.size}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Base Rate: ${Number(studio.base_hourly_rate).toFixed(2)}/hour
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
                <CardDescription>Complete history of your studio bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No bookings yet</p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{booking.studios.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.booking_date).toLocaleDateString()} • {booking.start_time} - {booking.end_time}
                          </p>
                          <p className="text-sm font-medium mt-1">${Number(booking.total_amount).toFixed(2)}</p>
                        </div>
                        <Badge variant={
                          booking.status === "confirmed" ? "default" :
                          booking.status === "pending" ? "outline" :
                          "secondary"
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
