-- Fix refresh_tokens table: Vercel API created it with token_hash instead of token
-- The backend expects a 'token' column, not 'token_hash'

-- Add token column if it doesn't exist
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS token TEXT;

-- Drop token_hash column since backend uses token directly
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS token_hash;

-- Ensure all existing rows have a non-null token value
UPDATE refresh_tokens SET token = id WHERE token IS NULL;

-- Make token NOT NULL
ALTER TABLE refresh_tokens ALTER COLUMN token SET NOT NULL;

-- Add unique constraint on token
CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_token_unique ON refresh_tokens(token);
