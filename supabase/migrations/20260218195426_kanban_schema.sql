-- Drop existing tables to avoid conflicts and ensure a clean state
DROP TABLE IF EXISTS task_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS columns CASCADE;
DROP TABLE IF EXISTS board_members CASCADE;
DROP TABLE IF EXISTS boards CASCADE;

-- Create boards table
CREATE TABLE boards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Create board_members table
CREATE TABLE board_members (
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    PRIMARY KEY (board_id, user_id)
);

-- Create columns table
CREATE TABLE columns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL
);

-- Create tasks table
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    column_id UUID REFERENCES columns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee_id UUID REFERENCES auth.users(id),
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tags table
CREATE TABLE tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT
);

-- Create task_tags junction table
CREATE TABLE task_tags (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

-- ENABLE RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Boards: Users can see boards they are members of or own
CREATE POLICY "Users can view boards they belong to" 
ON boards FOR SELECT 
USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM board_members WHERE board_id = boards.id AND user_id = auth.uid())
);

CREATE POLICY "Owners can update their boards" 
ON boards FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their boards" 
ON boards FOR DELETE 
USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create boards" 
ON boards FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Board Members
CREATE POLICY "Members/Owners can view board membership" 
ON board_members FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM boards WHERE id = board_id AND owner_id = auth.uid()) OR
    user_id = auth.uid()
);

-- Columns (scoped by board access)
CREATE POLICY "Users can view columns of their boards" 
ON columns FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM boards b 
            LEFT JOIN board_members bm ON b.id = bm.board_id
            WHERE b.id = columns.board_id AND (b.owner_id = auth.uid() OR bm.user_id = auth.uid()))
);

-- Tasks (scoped by board access through columns)
CREATE POLICY "Users can view tasks of their boards" 
ON tasks FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM columns c
            JOIN boards b ON c.board_id = b.id
            LEFT JOIN board_members bm ON b.id = bm.board_id
            WHERE c.id = tasks.column_id AND (b.owner_id = auth.uid() OR bm.user_id = auth.uid()))
);

-- TRIGGER: Create default columns on board creation
CREATE OR REPLACE FUNCTION public.handle_new_board()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.columns (board_id, name, position)
    VALUES 
        (NEW.id, 'Por hacer', 0),
        (NEW.id, 'En progreso', 1),
        (NEW.id, 'Terminado', 2);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_board_created
    AFTER INSERT ON public.boards
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_board();

-- TRIGGER: Automatically add owner to board_members
CREATE OR REPLACE FUNCTION public.handle_board_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.board_members (board_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_board_created_owner
    AFTER INSERT ON public.boards
    FOR EACH ROW EXECUTE FUNCTION public.handle_board_owner_membership();
