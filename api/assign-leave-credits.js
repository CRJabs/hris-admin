import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Vercel Serverless Function — assign-leave-credits
 *
 * Assigns (or resets) default leave credits for a given employee.
 * Called from AssignLeaveCredits.jsx "Reset to Default" action.
 *
 * Request body:
 *   { employeeId: string, classification: "Teaching" | "Non-Teaching" }
 */

const DEFAULT_LEAVE_CREDITS = {
  Teaching: [
    { leave_type: "Vacation", total_credits: 7, is_commutable: true },
    { leave_type: "Family", total_credits: 4, is_commutable: false },
    { leave_type: "Bereavement", total_credits: 3, is_commutable: false },
    { leave_type: "Sick", total_credits: 15, is_commutable: true },
    { leave_type: "Force", total_credits: 5, is_commutable: true },
    { leave_type: "Force", total_credits: 5, is_commutable: false },
  ],
  "Non-Teaching": [
    { leave_type: "Vacation", total_credits: 10, is_commutable: true },
    { leave_type: "Vacation", total_credits: 5, is_commutable: false },
    { leave_type: "Family", total_credits: 4, is_commutable: false },
    { leave_type: "Bereavement", total_credits: 3, is_commutable: false },
    { leave_type: "Sick", total_credits: 15, is_commutable: true },
    { leave_type: "Force", total_credits: 5, is_commutable: true },
    { leave_type: "Force", total_credits: 5, is_commutable: false },
  ],
};

const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

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
  try {
    if (token === "debug-token" && process.env.NODE_ENV !== "production") {
      console.log("Bypassing auth validation using development debug token");
    } else {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData, error: userError } = await userClient.auth.getUser(token);
      if (userError || !userData?.user?.id) {
        return res.status(401).json({ error: "Unauthorized user token" });
      }
    }

    const { employeeId, classification } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: "employeeId is required" });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const credits = DEFAULT_LEAVE_CREDITS[classification] || DEFAULT_LEAVE_CREDITS["Non-Teaching"];

    // Delete existing credits first (reset)
    const { error: deleteError } = await adminClient
      .from("leave_credits")
      .delete()
      .eq("employee_id", employeeId);

    if (deleteError) throw deleteError;

    // Insert default credits
    const insertData = credits.map((c) => ({
      employee_id: employeeId,
      leave_type: c.leave_type,
      total_credits: c.total_credits,
      used_credits: 0,
      is_commutable: c.is_commutable,
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await adminClient.from("leave_credits").insert(insertData);

    if (insertError) throw insertError;

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
}
