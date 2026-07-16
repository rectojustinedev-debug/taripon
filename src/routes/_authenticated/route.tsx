import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // getSession() reads the persisted session locally (fast, no network
    // round-trip) and only refreshes the token if it's near expiry.
    // Row-level security on every Supabase query is what actually protects
    // the data — this check just keeps signed-out visitors off these pages.
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) throw redirect({ to: "/auth" });
    return { user: data.session.user };
  },
  pendingMs: 200,
  pendingMinMs: 200,
  pendingComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  ),
  component: () => <Outlet />,
});
