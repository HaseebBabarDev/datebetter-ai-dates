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

    // Parse request body for tester filter
    let testerFilter: 'all' | 'internal' | 'external' = 'all';
    try {
      const body = await req.json();
      if (body?.testerFilter && ['all', 'internal', 'external'].includes(body.testerFilter)) {
        testerFilter = body.testerFilter;
      }
    } catch {
      // No body or invalid JSON, use default
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

    // Fetch tester statuses
    const { data: testerStatuses } = await supabaseClient
      .from("user_tester_status")
      .select("user_id, tester_type");

    const testerStatusMap = new Map<string, string>(
      testerStatuses?.map(s => [s.user_id, s.tester_type]) || []
    );

    const allUsers = authUsers.users || [];
    
    // Get user IDs for internal and external testers
    const internalUserIds = new Set<string>();
    const externalUserIds = new Set<string>();
    
    allUsers.forEach(user => {
      const testerType = testerStatusMap.get(user.id) || 'external';
      if (testerType === 'internal') {
        internalUserIds.add(user.id);
      } else {
        externalUserIds.add(user.id);
      }
    });

    // Determine which user IDs to filter by
    let filteredUserIds: Set<string> | null = null;
    if (testerFilter === 'internal') {
      filteredUserIds = internalUserIds;
    } else if (testerFilter === 'external') {
      filteredUserIds = externalUserIds;
    }

    const filteredUsers = filteredUserIds 
      ? allUsers.filter(u => filteredUserIds!.has(u.id))
      : allUsers;

    const totalUsers = filteredUsers.length;
    const newUsersToday = filteredUsers.filter(u => new Date(u.created_at) >= today).length;
    const newUsersThisWeek = filteredUsers.filter(u => new Date(u.created_at) >= weekAgo).length;

    // Build queries based on filter
    const buildFilteredQuery = (tableName: string, userIdColumn: string = 'user_id') => {
      let query = supabaseClient.from(tableName).select("*", { count: "exact", head: true });
      if (filteredUserIds) {
        const userIdsArray = Array.from(filteredUserIds);
        if (userIdsArray.length > 0) {
          query = query.in(userIdColumn, userIdsArray);
        } else {
          // No users match, return empty
          return supabaseClient.from(tableName).select("*", { count: "exact", head: true }).eq(userIdColumn, 'no-match-uuid');
        }
      }
      return query;
    };

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
      buildFilteredQuery("user_roles", "user_id").eq("role", "admin"),
      buildFilteredQuery("candidates"),
      buildFilteredQuery("interactions"),
      buildFilteredQuery("devi_conversations"),
      buildFilteredQuery("devi_messages"),
      buildFilteredQuery("forum_posts"),
      buildFilteredQuery("forum_comments"),
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
      internalUsers: internalUserIds.size,
      externalUsers: externalUserIds.size,
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
