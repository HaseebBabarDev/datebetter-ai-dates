import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const validPlans = ['free', 'basic', 'new_to_dating', 'starter', 'dating_often', 'dating_more', 'unlimited'] as const;

const bodySchema = z.object({
  targetUserId: z.string().uuid("Invalid user ID format"),
  trialDays: z.number().int().min(0).max(365).optional().nullable(),
  plan: z.enum(validPlans).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify requesting user is admin
    const { data: adminCheck } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { targetUserId, trialDays, plan } = parsed.data;

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
      return new Response(
        JSON.stringify({ error: 'Failed to update subscription.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
