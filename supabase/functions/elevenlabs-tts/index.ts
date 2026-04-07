import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Voice options for D.E.V.I.
const VOICE_IDS = {
  female: "sNLQ1mXur3j7xaL3YIA9",  // Female voice - warm, reassuring
  male: "UROTxOkHtIFqWCaTocVv",     // Male voice - calm, grounded
  // Legacy mappings
  mature: "sNLQ1mXur3j7xaL3YIA9",
  younger: "UROTxOkHtIFqWCaTocVv",
};
const DEFAULT_VOICE_ID = VOICE_IDS.female;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, voicePreference } = await req.json();
    
    // Determine which voice to use: explicit voiceId > voicePreference > default
    const selectedVoice = voiceId || VOICE_IDS[voicePreference as keyof typeof VOICE_IDS] || DEFAULT_VOICE_ID;

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Clean the text - remove markdown formatting for cleaner speech
    const cleanText = text
      .replace(/D\.E\.V\.I\./g, 'Devi')   // Pronounce D.E.V.I. as "Devi"
      .replace(/\*\*(.+?)\*\*/g, '$1')    // Remove bold
      .replace(/__(.+?)__/g, '$1')         // Remove underline
      .replace(/\[RECALCULATE_HEALING_SCORE\]/g, '') // Remove special markers
      .replace(/\[SET_\w+:\d+\]/g, '')     // Remove profile update markers
      .replace(/#+\s*/g, '')               // Remove markdown headers
      .replace(/[-*•]\s+/g, '')            // Remove bullet points
      .replace(/\d+[.)]\s+/g, '')          // Remove numbered list markers
      .trim();

    if (!cleanText) {
      return new Response(
        JSON.stringify({ error: "No speakable text after cleaning" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Use turbo model for lower latency
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_turbo_v2_5", // Low latency model
          voice_settings: selectedVoice === VOICE_IDS.younger
            ? {
                stability: 0.65,          // Higher stability to prevent pitch/speed drift
                similarity_boost: 0.80,
                style: 0.15,              // Low style to keep consistent
                use_speaker_boost: true,
              }
            : {
                stability: 0.4,           // More expressive for mature voice
                similarity_boost: 0.75,
                style: 0.3,
                use_speaker_boost: true,
              },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("ElevenLabs TTS error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to generate speech", details: errorData }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error: unknown) {
    console.error("TTS error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
