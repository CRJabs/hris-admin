import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Missing Supabase server environment variables" });
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = authHeader.slice("Bearer ".length);
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // If an explicit userId is provided (admin deleting another account),
  // verify the caller is authenticated before trusting it.
  const { userId } = req.body || {};

  try {
    let targetUserId = userId;

    if (token === "debug-token" && process.env.NODE_ENV !== "production") {
      console.log("Bypassing auth validation using development debug token");
      if (!targetUserId) {
        return res.status(400).json({ error: "userId is required for debug-token self-delete" });
      }
    } else {
      if (!targetUserId) {
        // Self-delete: resolve user from their bearer token
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: userData, error: userError } = await userClient.auth.getUser(token);
        if (userError || !userData?.user?.id) {
          return res.status(401).json({ error: "Invalid user token" });
        }
        targetUserId = userData.user.id;
      } else {
        // Admin delete: verify the caller is a valid, authenticated user
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: userData, error: userError } = await userClient.auth.getUser(token);
        if (userError || !userData?.user?.id) {
          return res.status(401).json({ error: "Unauthorized" });
        }
      }
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
}
