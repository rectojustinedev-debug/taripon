-- The original "own notifications all" policy let an authenticated user
-- INSERT and DELETE their own notification rows. Notifications are meant
-- to be system-generated (e.g. from a server function using the
-- service-role client), so a regular user should only be able to read
-- their notifications and flag them as read — not fabricate or erase them.

DROP POLICY IF EXISTS "own notifications all" ON public.notifications;

CREATE POLICY "own notifications select" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Only allow flipping `read`; block changing title/body/user_id via RLS by
-- re-checking user_id ownership on both sides of the update.
CREATE POLICY "own notifications update" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- No INSERT or DELETE policy for `authenticated` — notifications are
-- written by the service-role client (see client.server.ts) which bypasses
-- RLS entirely, so no policy is needed for that path.
