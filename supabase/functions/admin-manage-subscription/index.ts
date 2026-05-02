import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Use anon key client for auth check
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Use service role client for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify requesting user is admin using service role client (bypasses RLS)
    const { data: adminCheck } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminCheck) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { targetUserId, trialDays, plan } = await req.json();

    if (!targetUserId) {
      throw new Error('targetUserId is required');
    }

    console.log(`Admin ${user.id} managing subscription for user ${targetUserId}`);

    // Prepare update data
    const updateData: any = {};
    
    if (trialDays !== undefined && trialDays !== null) {
      if (trialDays === 0) {
        updateData.trial_ends_at = null;
      } else {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + trialDays);
        updateData.trial_ends_at = trialEndDate.toISOString();
      }
    }

    if (plan) {
      // Note: DB enum is {free, new_to_dating, dating_often, dating_more, unlimited}
      // but check-subscription reads the plan and returns it as-is for trials
      // We store the plan name that check-subscription will return
      // For trial purposes, we just store it in the plan field
      // The DB enum may not match - so we update limits but keep plan in the DB enum
      switch (plan) {
        case 'free':
          updateData.plan = 'free';
          updateData.candidates_limit = 1;
          updateData.updates_per_candidate = 1;
          break;
        case 'basic':
        case 'new_to_dating':
          updateData.plan = 'new_to_dating';
          updateData.candidates_limit = 5;
          updateData.updates_per_candidate = 3;
          break;
        case 'starter':
        case 'dating_often':
          updateData.plan = 'dating_often';
          updateData.candidates_limit = 10;
          updateData.updates_per_candidate = 5;
          break;
        case 'dating_more':
          updateData.plan = 'dating_more';
          updateData.candidates_limit = 20;
          updateData.updates_per_candidate = 10;
          break;
        case 'unlimited':
          updateData.plan = 'unlimited';
          updateData.candidates_limit = 999;
          updateData.updates_per_candidate = 999;
          break;
      }
    }

    // Update subscription
    const { error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update(updateData)
      .eq('user_id', targetUserId);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    const message = trialDays !== undefined 
      ? `Trial set to ${trialDays} days${plan ? ` and plan updated to ${plan}` : ''}`
      : `Plan updated to ${plan}`;

    console.log(`Successfully updated subscription for user ${targetUserId}`);

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-manage-subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});