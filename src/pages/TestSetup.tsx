import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, UserPlus } from "lucide-react";

const TestSetup = () => {
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);

  const createTestUser = async () => {
    setCreating(true);
    setSuccess(false);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "spiritualbutsassy@gmail.com",
            password: "Miamigirl24*",
            name: "Spiritual"
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user");
      }

      toast.success("Test user created successfully!");
      setSuccess(true);
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Test User Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>This will create a test user account with the following credentials:</p>
            <div className="bg-muted p-3 rounded-lg space-y-1">
              <p><strong>Email:</strong> spiritualbutsassy@gmail.com</p>
              <p><strong>Password:</strong> Miamigirl24*</p>
              <p><strong>Name:</strong> Spiritual</p>
            </div>
          </div>

          {success ? (
            <div className="flex items-center gap-2 text-success p-3 bg-success/10 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Test user created successfully!</span>
            </div>
          ) : (
            <Button
              onClick={createTestUser}
              disabled={creating}
              className="w-full"
              size="lg"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Test User
                </>
              )}
            </Button>
          )}

          {success && (
            <Button
              variant="outline"
              onClick={() => window.location.href = "/auth"}
              className="w-full"
            >
              Go to Login Page
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSetup;
