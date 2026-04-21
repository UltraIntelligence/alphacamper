import { getServiceRoleSupabase } from "@/lib/supabase.server";

interface SubscriptionSnapshot {
  status: "active" | "canceled" | "past_due";
  current_period_end: string | null;
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const { data, error } = await getServiceRoleSupabase()
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const subscription = data as SubscriptionSnapshot | null;
  if (!subscription || subscription.status !== "active") {
    return false;
  }

  if (!subscription.current_period_end) {
    return true;
  }

  return new Date(subscription.current_period_end).getTime() > Date.now();
}
