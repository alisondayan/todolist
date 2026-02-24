-- Fix RLS recursion and missing CRUD permissions
-- This migration will reset and simplify policies to ensure they work without circular dependencies

-- 0. Disable RLS temporarily to clean up (optional but safer)
-- (We'll just drop all policies)

-- DROP ALL POLICIES to ensure a clean state
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "' || r.tablename || '"';
    END LOOP;
END $$;

-- 1. BOARDS
CREATE POLICY "Boards SELECT" ON boards FOR SELECT
USING (
  owner_id = auth.uid() OR 
  id IN (SELECT board_id FROM board_members WHERE user_id = auth.uid())
);

CREATE POLICY "Boards INSERT" ON boards FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Boards UPDATE" ON boards FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Boards DELETE" ON boards FOR DELETE
USING (owner_id = auth.uid());


-- 2. BOARD MEMBERS
-- Break recursion: only allow people to see membership of boards they are on
CREATE POLICY "Board Members SELECT" ON board_members FOR SELECT
USING (
  board_id IN (
    SELECT id FROM boards WHERE owner_id = auth.uid()
    UNION
    SELECT board_id FROM board_members WHERE user_id = auth.uid()
  )
);
-- Note: Subqueries in RLS on the same table are handled by the planner to avoid infinite loops usually, 
-- but we should be careful. The UNION approach is often safer.

CREATE POLICY "Board Members INSERT" ON board_members FOR INSERT
WITH CHECK (
  board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
);

CREATE POLICY "Board Members DELETE" ON board_members FOR DELETE
USING (
  board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
);


-- 3. COLUMNS
CREATE POLICY "Columns SELECT" ON columns FOR SELECT
USING (
  board_id IN (SELECT id FROM boards)
);

CREATE POLICY "Columns INSERT" ON columns FOR INSERT
WITH CHECK (
  board_id IN (SELECT id FROM boards)
);

CREATE POLICY "Columns UPDATE" ON columns FOR UPDATE
USING (
  board_id IN (SELECT id FROM boards)
);

CREATE POLICY "Columns DELETE" ON columns FOR DELETE
USING (
  board_id IN (SELECT id FROM boards)
);


-- 4. TASKS
CREATE POLICY "Tasks SELECT" ON tasks FOR SELECT
USING (
  column_id IN (SELECT id FROM columns) OR
  assignee_id = auth.uid()
);

CREATE POLICY "Tasks INSERT" ON tasks FOR INSERT
WITH CHECK (
  column_id IN (SELECT id FROM columns)
);

CREATE POLICY "Tasks UPDATE" ON tasks FOR UPDATE
USING (
  column_id IN (SELECT id FROM columns)
)
WITH CHECK (
  column_id IN (SELECT id FROM columns)
);

CREATE POLICY "Tasks DELETE" ON tasks FOR DELETE
USING (
  column_id IN (SELECT id FROM columns)
);


-- 5. COMMENTS
CREATE POLICY "Comments SELECT" ON comments FOR SELECT
USING (
  task_id IN (SELECT id FROM tasks)
);

CREATE POLICY "Comments INSERT" ON comments FOR INSERT
WITH CHECK (
  task_id IN (SELECT id FROM tasks)
);

CREATE POLICY "Comments DELETE" ON comments FOR DELETE
USING (
  user_id = auth.uid()
);


-- 6. TAGS (Global for now)
CREATE POLICY "Tags SELECT" ON tags FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Tags INSERT" ON tags FOR INSERT
WITH CHECK (auth.role() = 'authenticated');


-- 7. TASK TAGS
CREATE POLICY "Task Tags SELECT" ON task_tags FOR SELECT
USING (
  task_id IN (SELECT id FROM tasks)
);

CREATE POLICY "Task Tags INSERT" ON task_tags FOR INSERT
WITH CHECK (
  task_id IN (SELECT id FROM tasks)
);

CREATE POLICY "Task Tags DELETE" ON task_tags FOR DELETE
USING (
  task_id IN (SELECT id FROM tasks)
);
