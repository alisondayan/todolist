-- Fix missing CRUD policies for Kanban application

-- 1. Tasks: Enable INSERT, UPDATE, DELETE
-- Users can insert tasks into columns they have access to
CREATE POLICY "Tasks INSERT" ON tasks FOR INSERT
WITH CHECK (
  column_id IN (SELECT id FROM columns)
);

-- Users can update tasks in columns they have access to
CREATE POLICY "Tasks UPDATE" ON tasks FOR UPDATE
USING (
  column_id IN (SELECT id FROM columns)
)
WITH CHECK (
  column_id IN (SELECT id FROM columns)
);

-- Users can delete tasks in columns they have access to
CREATE POLICY "Tasks DELETE" ON tasks FOR DELETE
USING (
  column_id IN (SELECT id FROM columns)
);


-- 2. Columns: Enable INSERT, UPDATE, DELETE
-- For now, any board member can manage columns (could be restricted to owner/admin later)
CREATE POLICY "Columns INSERT" ON columns FOR INSERT
WITH CHECK (
  board_id IN (SELECT id FROM boards)
);

CREATE POLICY "Columns UPDATE" ON columns FOR UPDATE
USING (
  board_id IN (SELECT id FROM boards)
)
WITH CHECK (
  board_id IN (SELECT id FROM boards)
);

CREATE POLICY "Columns DELETE" ON columns FOR DELETE
USING (
  board_id IN (SELECT id FROM boards)
);


-- 3. Tags: Enable full CRUD for authenticated users
-- Since tags are not currently scoped to boards, we'll allow all authenticated users
CREATE POLICY "Tags SELECT" ON tags FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Tags INSERT" ON tags FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tags UPDATE" ON tags FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tags DELETE" ON tags FOR DELETE
USING (auth.role() = 'authenticated');


-- 4. Task Tags: Enable CRUD
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


-- 5. Improve Board Members SELECT (allowing members to see each other)
DROP POLICY IF EXISTS "Board Members SELECT" ON board_members;
CREATE POLICY "Board Members SELECT" ON board_members FOR SELECT 
USING (
  board_id IN (SELECT id FROM boards)
);

-- Allow adding members if user is board owner
CREATE POLICY "Board Members INSERT" ON board_members FOR INSERT
WITH CHECK (
  board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
);

CREATE POLICY "Board Members DELETE" ON board_members FOR DELETE
USING (
  board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
);
