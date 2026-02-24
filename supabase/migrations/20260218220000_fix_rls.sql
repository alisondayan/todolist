-- Allow users to view tasks assigned to them
CREATE POLICY "Users can view tasks assigned to them"
ON tasks FOR SELECT
USING ( auth.uid() = assignee_id );

-- Comments Policies (Missing in previous schema)
CREATE POLICY "Users can view comments on visible tasks"
ON comments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM tasks
        WHERE tasks.id = comments.task_id
    )
);

CREATE POLICY "Users can create comments on visible tasks"
ON comments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM tasks
        WHERE tasks.id = comments.task_id
    )
);

CREATE POLICY "Users can delete their own comments"
ON comments FOR DELETE
USING ( auth.uid() = user_id );
