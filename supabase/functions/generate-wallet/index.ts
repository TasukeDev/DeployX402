import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { agent_id } = await req.json();
    if (!agent_id) throw new Error("agent_id is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id")
      .eq("id", agent_id)
      .eq("user_id", user.id)
      .single();

    if (agentError || !agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if wallet already exists
    const { data: existing } = await supabase
      .from("agent_wallets")
      .select("public_key")
      .eq("agent_id", agent_id)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ public_key: existing.public_key, already_exists: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate Solana keypair using Web Crypto
    // Ed25519 keypair generation
    const keyPair = await crypto.subtle.generateKey(
      { name: "Ed25519" },
      true,
      ["sign", "verify"]
    );

    const publicKeyRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
    const privateKeyRaw = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    // Encode keys as base64
    const publicKeyB64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)));
    const privateKeyB64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyRaw)));

    // Convert public key to base58 (Solana format)
    const pubKeyBytes = new Uint8Array(publicKeyRaw);
    const publicKeyBase58 = encodeBase58(pubKeyBytes);

    // Store wallet (private key encrypted at rest by Supabase)
    const { error: insertError } = await supabase.from("agent_wallets").insert({
      agent_id,
      user_id: user.id,
      public_key: publicKeyBase58,
      encrypted_private_key: privateKeyB64,
      balance_sol: 0,
    });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ public_key: publicKeyBase58, already_exists: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-wallet error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Base58 encoder for Solana addresses
function encodeBase58(bytes: Uint8Array): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const result: number[] = [];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < result.length; j++) {
      carry += result[j] * 256;
      result[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      result.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  // Leading zeros
  for (const byte of bytes) {
    if (byte === 0) result.push(0);
    else break;
  }
  return result.reverse().map((i) => ALPHABET[i]).join("");
}
