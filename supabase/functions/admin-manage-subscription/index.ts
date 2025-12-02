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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify requesting user is admin
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
      updateData.plan = plan;
      // Set limits based on plan
      switch (plan) {
        case 'free':
          updateData.candidates_limit = 1;
          updateData.updates_per_candidate = 1;
          break;
        case 'new_to_dating':
          updateData.candidates_limit = 3;
          updateData.updates_per_candidate = 3;
          break;
        case 'dating_often':
          updateData.candidates_limit = 7;
          updateData.updates_per_candidate = 5;
          break;
        case 'dating_more':
          updateData.candidates_limit = 20;
          updateData.updates_per_candidate = 10;
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