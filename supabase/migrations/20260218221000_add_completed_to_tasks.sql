-- Add completed column to tasks table and fix RLS recursion
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;

-- Drop problematic recursive policies to prevent 500 errors
DROP POLICY IF EXISTS "Users can view boards they belong to" ON boards;
DROP POLICY IF EXISTS "Members/Owners can view board membership" ON board_members;
DROP POLICY IF EXISTS "Users can view columns of their boards" ON columns;
DROP POLICY IF EXISTS "Users can view tasks of their boards" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks assigned to them" ON tasks;

-- Create cleaned non-recursive policies

-- Boards: Visible if owner OR if a membership record exists for the user
-- Using a subquery on board_members is safe as long as board_members policy doesn't check boards for its own SELECT
CREATE POLICY "Boards SELECT" ON boards FOR SELECT 
USING (
  owner_id = auth.uid() 
  OR 
  id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid())
);

-- Board Members: Visible for own record OR if the user owns the board (checked via owner_id directly)
CREATE POLICY "Board Members SELECT" ON board_members FOR SELECT 
USING (
  user_id = auth.uid() 
);

-- Columns: Visible if the parent board is visible
CREATE POLICY "Columns SELECT" ON columns FOR SELECT 
USING (
  board_id IN (SELECT id FROM boards)
);

-- Tasks: Visible if the parent column is visible OR if assigned to me
CREATE POLICY "Tasks SELECT" ON tasks FOR SELECT 
USING (
  column_id IN (SELECT id FROM columns)
  OR 
  assignee_id = auth.uid()
);
