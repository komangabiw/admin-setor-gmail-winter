import { supabaseAdmin } from "./supabase/admin";

export const DEFAULT_ADMIN_EMAILS = [
  "komangabiw@gmail.com",
];

export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : [];
  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...envEmails]));
}

/**
 * Checks if a given email or profile has admin privileges.
 * STRICT: Only authorized admin emails (default: komangabiw@gmail.com) are allowed.
 */
export async function verifyIsAdmin(
  userId?: string | null,
  email?: string | null
): Promise<{ isAdmin: boolean; profile?: any }> {
  if (!userId && !email) {
    return { isAdmin: false };
  }

  const adminEmails = getAdminEmails();
  let userEmail = email ? email.toLowerCase().trim() : null;

  // If email is not passed directly, look up from auth.users or profiles
  if (!userEmail && userId) {
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUser?.user?.email) {
        userEmail = authUser.user.email.toLowerCase().trim();
      }
    } catch (e) {
      console.warn("Could not lookup user email by ID:", e);
    }
  }

  // Strict check: Must match the admin email list
  if (!userEmail || !adminEmails.includes(userEmail)) {
    return { isAdmin: false };
  }

  // User is verified admin by email!
  // Now ensure profile exists and has Admin role in database
  let profileData: any = null;
  if (userId) {
    try {
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const authMeta = authUserData?.user?.user_metadata;
      const detectedAvatar = authMeta?.avatar_url || authMeta?.picture || null;

      if (existingProfile) {
        profileData = {
          ...existingProfile,
          avatar_url: existingProfile.avatar_url || detectedAvatar,
        };

        const updates: any = {};
        if (existingProfile.role !== "Admin") {
          updates.role = "Admin";
          profileData.role = "Admin";
        }
        if (!existingProfile.avatar_url && detectedAvatar) {
          updates.avatar_url = detectedAvatar;
        }
        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date().toISOString();
          await supabaseAdmin
            .from("profiles")
            .update(updates)
            .eq("id", userId);
        }
      } else {
        // Auto-create profile with Admin role
        const { data: newProfile } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: userId,
            email: userEmail,
            name: authMeta?.full_name || authMeta?.name || "Komang Abiw (Admin)",
            role: "Admin",
            avatar_url: detectedAvatar,
          })
          .select()
          .maybeSingle();
        profileData = newProfile;
      }
    } catch (dbErr) {
      console.warn("Profile sync error in verifyIsAdmin:", dbErr);
    }
  }

  return {
    isAdmin: true,
    profile: profileData || {
      id: userId || "",
      name: "Komang Abiw",
      email: userEmail,
      role: "Admin",
      avatar_url: null,
    },
  };
}
