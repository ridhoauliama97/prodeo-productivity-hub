-- Migration: Create google_tokens table for storing OAuth tokens
-- This enables Google Drive access after user links their Google account

CREATE TABLE IF NOT EXISTS public.google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_token TEXT NOT NULL,
  provider_refresh_token TEXT,
  email TEXT,
  scopes TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only view their own tokens
CREATE POLICY "Users can view own tokens"
  ON public.google_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own tokens"
  ON public.google_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own tokens"
  ON public.google_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tokens (for unlinking)
CREATE POLICY "Users can delete own tokens"
  ON public.google_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all tokens (for callback route)
CREATE POLICY "Service role full access"
  ON public.google_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
