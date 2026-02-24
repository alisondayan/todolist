-- Fix missing columns and add defaults to avoid 400 errors during task/comment creation
-- 1. Add user_name to comments if it was missed in the kanban_schema recreation
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_name TEXT;

-- 2. Add defaults to tasks for easier creation from simple views
ALTER TABLE tasks ALTER COLUMN position SET DEFAULT 0;
ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT 'medium';

-- 3. Ensure tags has a color default
ALTER TABLE tags ALTER COLUMN color SET DEFAULT '#3b82f6';

-- 4. Fix RLS for comments (ensure user_name is included in visibility if needed, though simple SELECT * covers it)
-- The existing policies should already work.
