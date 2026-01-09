import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the caller is authenticated and is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is admin
    const { data: callerRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!callerRole) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get all users from auth.users
    const { data: authUsers, error: usersError } = await supabaseClient.auth.admin.listUsers({
      perPage: 10000,
    });

    if (usersError) {
      console.error("Error listing users:", usersError);
      throw usersError;
    }

    const allUsers = authUsers.users || [];
    const totalUsers = allUsers.length;
    const newUsersToday = allUsers.filter(u => new Date(u.created_at) >= today).length;
    const newUsersThisWeek = allUsers.filter(u => new Date(u.created_at) >= weekAgo).length;

    // Fetch counts using service role (bypasses RLS)
    const [
      adminRolesResult,
      candidatesResult,
      interactionsResult,
      conversationsResult,
      messagesResult,
      postsResult,
      commentsResult,
    ] = await Promise.all([
      supabaseClient.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin"),
      supabaseClient.from("candidates").select("*", { count: "exact", head: true }),
      supabaseClient.from("interactions").select("*", { count: "exact", head: true }),
      supabaseClient.from("devi_conversations").select("*", { count: "exact", head: true }),
      supabaseClient.from("devi_messages").select("*", { count: "exact", head: true }),
      supabaseClient.from("forum_posts").select("*", { count: "exact", head: true }),
      supabaseClient.from("forum_comments").select("*", { count: "exact", head: true }),
    ]);

    const stats = {
      totalUsers,
      adminUsers: adminRolesResult.count || 0,
      totalCandidates: candidatesResult.count || 0,
      totalInteractions: interactionsResult.count || 0,
      totalConversations: conversationsResult.count || 0,
      totalMessages: messagesResult.count || 0,
      totalPosts: postsResult.count || 0,
      totalComments: commentsResult.count || 0,
      newUsersToday,
      newUsersThisWeek,
    };

    return new Response(
      JSON.stringify({ stats }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in admin-overview-stats:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
