import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (!["POST", "PUT", "DELETE"].includes(req.method)) {
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
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ─── POST: Create User ───────────────────────────────────────────────────
    if (req.method === "POST") {
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

      const { email, password, employeeId, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const userRole = (role || "employee").toLowerCase();

      const { data: createdUserData, error: createError } = await adminClient.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: { employee_id: employeeId, must_change_password: true, role: userRole }
      });

      if (createError) {
        return res.status(500).json({ error: createError.message });
      }

      // Sync to user_profiles table with service role key
      await adminClient.from("user_profiles").upsert({
        id: createdUserData.user.id,
        email: email.trim(),
        role: userRole,
        temp_password: password,
        privileges: []
      });

      return res.status(200).json({ success: true, user: createdUserData.user });
    }

    // ─── PUT: Update User ────────────────────────────────────────────────────
    if (req.method === "PUT") {
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

      const { userId, updateData, tempPassword } = req.body;
      if (!userId || !updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "userId and at least one updateData field are required" });
      }

      const { data, error } = await adminClient.auth.admin.updateUserById(userId, updateData);
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Sync user_profiles table with service role key
      const profileUpdates = {};
      if (updateData.email) profileUpdates.email = updateData.email.trim();
      if (tempPassword !== undefined) profileUpdates.temp_password = tempPassword;
      if (updateData.password) profileUpdates.temp_password = updateData.password;
      if (updateData.user_metadata?.role) profileUpdates.role = updateData.user_metadata.role;

      if (Object.keys(profileUpdates).length > 0) {
        await adminClient.from("user_profiles").update(profileUpdates).eq("id", userId);
      }

      // Sync employees table email if linked
      if (updateData.email) {
        await adminClient.from("employees").update({ contact_email: updateData.email.trim() }).eq("user_id", userId);
      }

      return res.status(200).json({ success: true, user: data.user });
    }

    // ─── DELETE: Delete User ─────────────────────────────────────────────────
    if (req.method === "DELETE") {
      const { userId } = req.body || {};
      let targetUserId = userId;

      if (token === "debug-token" && process.env.NODE_ENV !== "production") {
        console.log("Bypassing auth validation using development debug token");
        if (!targetUserId) {
          return res.status(400).json({ error: "userId is required for debug-token self-delete" });
        }
      } else {
        if (!targetUserId) {
          // Self-delete: resolve user from token
          const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
          });
          const { data: userData, error: userError } = await userClient.auth.getUser(token);
          if (userError || !userData?.user?.id) {
            return res.status(401).json({ error: "Invalid user token" });
          }
          targetUserId = userData.user.id;
        } else {
          // Admin delete: verify caller is authenticated
          const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
          });
          const { data: userData, error: userError } = await userClient.auth.getUser(token);
          if (userError || !userData?.user?.id) {
            return res.status(401).json({ error: "Unauthorized" });
          }
        }
      }

      // 1. Unlink from employees table
      await adminClient.from("employees").update({ user_id: null }).eq("user_id", targetUserId);

      // 2. Delete from user_profiles table using service role key
      const { error: profileDeleteError } = await adminClient
        .from("user_profiles")
        .delete()
        .eq("id", targetUserId);

      if (profileDeleteError) {
        console.error("Error deleting user_profile:", profileDeleteError);
      }

      // 3. Delete from auth.users using admin client
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);
      if (deleteError) {
        return res.status(500).json({ error: deleteError.message });
      }

      return res.status(200).json({ success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
}
