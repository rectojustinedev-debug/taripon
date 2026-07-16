-- Adds an app-language preference to settings (for the new language
-- switcher) and a support_messages table backing the new Contact &
-- Support page.

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';

ALTER TABLE public.settings
  ADD CONSTRAINT settings_language_check CHECK (language IN ('en', 'fil'));

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_messages_user_idx ON public.support_messages(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can send and read back their own support messages, but can't edit
-- or delete them once sent — same "system owns the record" pattern used
-- for notifications, since edits/deletes after submission should go
-- through support staff, not the client.
CREATE POLICY "own support messages select" ON public.support_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own support messages insert" ON public.support_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
