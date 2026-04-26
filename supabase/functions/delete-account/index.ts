import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the requesting user
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Cascade-clean owned data first (storage objects + db rows handled by FKs/cascades where set)
    // Delete store-owned records explicitly to be safe
    const { data: stores } = await admin.from("stores").select("id").eq("owner_id", userId);
    const storeIds = (stores || []).map((s) => s.id);
    if (storeIds.length) {
      // Find products to clean their images
      const { data: products } = await admin.from("products").select("id, image_url").in("store_id", storeIds);
      const productIds = (products || []).map((p) => p.id);
      const productImagePaths = (products || [])
        .map((p) => p.image_url)
        .filter((u): u is string => !!u && !u.startsWith("http"));
      if (productImagePaths.length) {
        await admin.storage.from("product-images").remove(productImagePaths);
      }
      if (productIds.length) {
        const { data: orderItems } = await admin.from("order_items").select("order_id").in("product_id", productIds);
        const orderIds = Array.from(new Set((orderItems || []).map((o) => o.order_id)));
        if (orderIds.length) {
          await admin.from("order_status_events").delete().in("order_id", orderIds);
          await admin.from("order_items").delete().in("order_id", orderIds);
          await admin.from("orders").delete().in("id", orderIds);
        }
      }
      // Remove any remaining orders by store
      await admin.from("orders").delete().in("store_id", storeIds);
      await admin.from("products").delete().in("store_id", storeIds);
      await admin.from("stores").delete().in("id", storeIds);
    }

    // Clean store logos
    const { data: logoFiles } = await admin.storage.from("store-logos").list(userId);
    if (logoFiles && logoFiles.length) {
      await admin.storage.from("store-logos").remove(logoFiles.map((f) => `${userId}/${f.name}`));
    }

    await admin.from("profiles").delete().eq("user_id", userId);

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
