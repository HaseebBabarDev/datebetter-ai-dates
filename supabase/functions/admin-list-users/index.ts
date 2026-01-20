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

    // Get all users from auth.users via admin API with pagination
    let allAuthUsers: Array<{
      id: string;
      email?: string;
      user_metadata?: { name?: string };
      created_at: string;
      last_sign_in_at?: string | null;
    }> = [];
    
    let page = 1;
    const perPage = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: authUsers, error: usersError } = await supabaseClient.auth.admin.listUsers({
        page,
        perPage,
      });

      if (usersError) {
        console.error("Error listing users:", usersError);
        throw usersError;
      }
      
      if (authUsers?.users && authUsers.users.length > 0) {
        allAuthUsers = [...allAuthUsers, ...authUsers.users];
        hasMore = authUsers.users.length === perPage;
        page++;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`Fetched ${allAuthUsers.length} users from auth`);
    
    if (allAuthUsers.length === 0) {
      return new Response(
        JSON.stringify({ users: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get profiles for additional info
    const { data: profiles } = await supabaseClient
      .from("profiles")
      .select("user_id, name, created_at");

    // Get usage stats for all users
    const { data: candidates } = await supabaseClient
      .from("candidates")
      .select("user_id");
    
    const { data: interactions } = await supabaseClient
      .from("interactions")
      .select("user_id");
    
    const { data: conversations } = await supabaseClient
      .from("devi_conversations")
      .select("user_id");
    
    const { data: messages } = await supabaseClient
      .from("devi_messages")
      .select("user_id, created_at");

    // Build usage maps
    const candidateCountMap = new Map<string, number>();
    candidates?.forEach(c => {
      candidateCountMap.set(c.user_id, (candidateCountMap.get(c.user_id) || 0) + 1);
    });

    const interactionCountMap = new Map<string, number>();
    interactions?.forEach(i => {
      interactionCountMap.set(i.user_id, (interactionCountMap.get(i.user_id) || 0) + 1);
    });

    const conversationCountMap = new Map<string, number>();
    conversations?.forEach(c => {
      conversationCountMap.set(c.user_id, (conversationCountMap.get(c.user_id) || 0) + 1);
    });

    const messageCountMap = new Map<string, number>();
    const lastMessageMap = new Map<string, string>();
    messages?.forEach(m => {
      messageCountMap.set(m.user_id, (messageCountMap.get(m.user_id) || 0) + 1);
      const currentLast = lastMessageMap.get(m.user_id);
      if (!currentLast || new Date(m.created_at) > new Date(currentLast)) {
        lastMessageMap.set(m.user_id, m.created_at);
      }
    });

    const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Combine auth users with profiles and usage data
    interface UserData {
      user_id: string;
      email: string | undefined;
      name: string | null;
      created_at: string;
      last_sign_in_at: string | null | undefined;
      usage: {
        candidates: number;
        interactions: number;
        ai_conversations: number;
        ai_messages: number;
        last_ai_message: string | null;
      };
    }
    
    const users: UserData[] = allAuthUsers.map(authUser => {
      const profile = profilesMap.get(authUser.id);
      return {
        user_id: authUser.id,
        email: authUser.email,
        name: profile?.name || authUser.user_metadata?.name || null,
        created_at: profile?.created_at || authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        usage: {
          candidates: candidateCountMap.get(authUser.id) || 0,
          interactions: interactionCountMap.get(authUser.id) || 0,
          ai_conversations: conversationCountMap.get(authUser.id) || 0,
          ai_messages: messageCountMap.get(authUser.id) || 0,
          last_ai_message: lastMessageMap.get(authUser.id) || null,
        }
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return new Response(
      JSON.stringify({ users }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in admin-list-users:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
