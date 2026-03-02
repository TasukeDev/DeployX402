import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase58(bytes: Uint8Array): string {
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
  for (const byte of bytes) {
    if (byte === 0) result.push(0);
    else break;
  }
  return result.reverse().map((i) => BASE58_ALPHABET[i]).join("");
}

function decodeBase58(s: string): Uint8Array {
  const result: number[] = [0];
  for (const char of s) {
    const idx = BASE58_ALPHABET.indexOf(char);
    if (idx < 0) throw new Error(`Invalid base58 char: ${char}`);
    let carry = idx;
    for (let j = 0; j < result.length; j++) {
      carry += result[j] * 58;
      result[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      result.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of s) {
    if (char === "1") result.push(0);
    else break;
  }
  return new Uint8Array(result.reverse());
}

async function getSolBalance(publicKey: string): Promise<number> {
  try {
    // Try Solscan public API first
    const res = await fetch(`https://public-api.solscan.io/account?address=${publicKey}`, {
      headers: { "Accept": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.lamports !== undefined) return data.lamports / 1e9;
    }
  } catch { /* fall through to RPC */ }

  // Fallback to Solana RPC
  const res = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "getBalance",
      params: [publicKey, { commitment: "confirmed" }],
    }),
  });
  const data = await res.json();
  return (data.result?.value || 0) / 1e9;
}

async function getRecentBlockhash(): Promise<string> {
  const res = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "getLatestBlockhash",
      params: [{ commitment: "confirmed" }],
    }),
  });
  const data = await res.json();
  return data.result.value.blockhash;
}

/** Build a simple SOL transfer transaction (legacy format) */
async function buildTransferTransaction(
  fromPubkeyB58: string,
  toPubkeyB58: string,
  lamports: number,
  recentBlockhash: string,
): Promise<Uint8Array> {
  const fromPubkey = decodeBase58(fromPubkeyB58);
  const toPubkey = decodeBase58(toPubkeyB58);
  const blockhashBytes = decodeBase58(recentBlockhash);

  // System program ID (all zeros except last byte is 0)
  const systemProgram = new Uint8Array(32); // 11111111111111111111111111111111

  // Instruction: System Transfer
  // program_id index = 2, accounts = [0 (from, writable, signer), 1 (to, writable)]
  // data = [2, 0, 0, 0] + lamports as little-endian u64

  const lamportBytes = new Uint8Array(8);
  const view = new DataView(lamportBytes.buffer);
  view.setBigUint64(0, BigInt(lamports), true);

  const instructionData = new Uint8Array([2, 0, 0, 0, ...lamportBytes]);

  // Message header: 1 required signer, 0 readonly signers, 1 readonly non-signer (system program)
  const header = new Uint8Array([1, 0, 1]);

  // Account keys: [from, to, systemProgram]
  const accountKeys = new Uint8Array([
    ...fromPubkey,
    ...toPubkey,
    ...systemProgram,
  ]);

  // Recent blockhash
  // Instruction: programIdIndex=2, accounts=[0,1], data
  const instruction = new Uint8Array([
    2,                          // program id index (system program)
    2,                          // num accounts
    0,                          // account index: from
    1,                          // account index: to
    instructionData.length,     // data length
    ...instructionData,
  ]);

  // Message = header + compact array of accounts (3 keys) + blockhash + compact array of instructions (1)
  const message = new Uint8Array([
    ...header,
    3, // num accounts (compact-u16, fits in 1 byte)
    ...accountKeys,
    ...blockhashBytes,
    1, // num instructions (compact-u16)
    ...instruction,
  ]);

  // Transaction = 1 signature placeholder (64 zero bytes) + message
  const sigPlaceholder = new Uint8Array(65); // 1 (count) + 64 (sig)
  sigPlaceholder[0] = 1; // num signatures

  return new Uint8Array([...sigPlaceholder, ...message]);
}

async function signTransaction(txBytes: Uint8Array, pkcs8Base64: string): Promise<Uint8Array> {
  // Strip any whitespace/newlines that might cause atob to fail
  const cleaned = pkcs8Base64.replace(/\s/g, "");
  const pkcs8Bytes = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8Bytes.buffer,
    { name: "Ed25519" },
    false,
    ["sign"],
  );

  // message starts after the 1-byte sig count + 64-byte sig = offset 65
  const message = txBytes.slice(65);
  const signature = new Uint8Array(
    await crypto.subtle.sign("Ed25519", privateKey, message),
  );

  const signed = new Uint8Array(txBytes);
  signed.set(signature, 1); // write sig starting at byte 1 (after count byte)
  return signed;
}

async function sendTransaction(signedTxBytes: Uint8Array): Promise<string> {
  const base64Tx = btoa(String.fromCharCode(...signedTxBytes));
  const res = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "sendTransaction",
      params: [base64Tx, { encoding: "base64", skipPreflight: false, preflightCommitment: "confirmed" }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`RPC error: ${JSON.stringify(data.error)}`);
  return data.result; // tx signature
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate the user from their JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { agent_id, to_address, amount_sol, action } = body;

    // GET TRANSACTIONS action — fetch recent SOL transfers from Solscan
    if (action === "get_transactions") {
      if (!agent_id) {
        return new Response(JSON.stringify({ error: "Missing agent_id" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const serviceClient = createClient(supabaseUrl, supabaseKey);
      const { data: walletRow } = await serviceClient
        .from("agent_wallets")
        .select("public_key")
        .eq("agent_id", agent_id)
        .eq("user_id", user.id)
        .single();
      if (!walletRow) {
        return new Response(JSON.stringify({ error: "Wallet not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        // Solscan v2 public API for SOL transfers
        const res = await fetch(
          `https://public-api.solscan.io/account/transactions?address=${walletRow.public_key}&limit=10`,
          { headers: { "Accept": "application/json" } }
        );
        if (!res.ok) throw new Error(`Solscan ${res.status}`);
        const txs = await res.json();
        return new Response(JSON.stringify({ transactions: txs }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        // Fallback: use RPC getSignaturesForAddress
        const rpcRes = await fetch(SOLANA_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0", id: 1,
            method: "getSignaturesForAddress",
            params: [walletRow.public_key, { limit: 10, commitment: "confirmed" }],
          }),
        });
        const rpcData = await rpcRes.json();
        const sigs = (rpcData.result || []).map((s: any) => ({
          txHash: s.signature,
          blockTime: s.blockTime,
          status: s.err ? "fail" : "success",
          fee: null,
          lamport: null,
        }));
        return new Response(JSON.stringify({ transactions: sigs, source: "rpc" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // GET BALANCE action — just return on-chain balance for an agent wallet
    if (action === "get_balance") {
      if (!agent_id) {
        return new Response(JSON.stringify({ error: "Missing agent_id" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const serviceClient = createClient(supabaseUrl, supabaseKey);
      const { data: walletRow } = await serviceClient
        .from("agent_wallets")
        .select("public_key")
        .eq("agent_id", agent_id)
        .eq("user_id", user.id)
        .single();
      if (!walletRow) {
        return new Response(JSON.stringify({ error: "Wallet not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const balance = await getSolBalance(walletRow.public_key);
      // Also persist updated balance
      await serviceClient.from("agent_wallets").update({ balance_sol: balance }).eq("agent_id", agent_id).eq("user_id", user.id);
      return new Response(JSON.stringify({ balance_sol: balance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    if (!agent_id || !to_address || !amount_sol || amount_sol <= 0) {
      return new Response(JSON.stringify({ error: "Missing or invalid parameters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate to_address is a valid base58 pubkey (32 bytes)
    let toBytes: Uint8Array;
    try {
      toBytes = decodeBase58(to_address);
      if (toBytes.length !== 32) throw new Error("Wrong length");
    } catch {
      return new Response(JSON.stringify({ error: "Invalid destination Solana address" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseKey);

    // Fetch agent wallet — verify ownership via user_id
    const { data: wallet, error: walletError } = await serviceClient
      .from("agent_wallets")
      .select("public_key, encrypted_private_key, balance_sol")
      .eq("agent_id", agent_id)
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: "Wallet not found or access denied" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get live on-chain balance
    const onChainBalance = await getSolBalance(wallet.public_key);
    const FEE_RESERVE = 0.001; // rent-exempt minimum (~0.00089 SOL) + tx fee buffer
    const maxWithdraw = onChainBalance - FEE_RESERVE;

    if (amount_sol > maxWithdraw) {
      return new Response(
        JSON.stringify({ error: `Insufficient balance. Max withdrawable: ${maxWithdraw.toFixed(6)} SOL` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const lamports = Math.floor(amount_sol * 1e9);
    if (lamports <= 0) {
      return new Response(JSON.stringify({ error: "Amount too small" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const blockhash = await getRecentBlockhash();
    const txBytes = await buildTransferTransaction(wallet.public_key, to_address, lamports, blockhash);
    const signedTx = await signTransaction(txBytes, wallet.encrypted_private_key);
    const txSig = await sendTransaction(signedTx);

    // Extract readable sig from signed tx (bytes 1..65 → base58)
    const sigBytes = signedTx.slice(1, 65);
    const readableSig = encodeBase58(sigBytes);

    // Update balance
    const newBalance = await getSolBalance(wallet.public_key);
    await serviceClient.from("agent_wallets").update({ balance_sol: newBalance }).eq("agent_id", agent_id);

    return new Response(
      JSON.stringify({ success: true, tx_signature: readableSig, new_balance: newBalance }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("withdraw-sol error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
