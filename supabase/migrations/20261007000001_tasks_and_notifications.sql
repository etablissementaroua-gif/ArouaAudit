-- ==============================================================================
-- Migration: Tasks, Notes & System Notifications Module
-- File: 20261007000001_tasks_and_notifications.sql
-- Description: Creates system_tasks and system_notifications tables, RLS policies,
--              indexes, and notification triggers for assigned tasks and broadcasts.
-- ==============================================================================

-- 1. Create system_tasks Table
CREATE TABLE IF NOT EXISTS public.system_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'task' CHECK (category IN ('task', 'idea', 'reminder', 'announcement')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    visibility TEXT NOT NULL DEFAULT 'assigned' CHECK (visibility IN ('private', 'assigned', 'public')),
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_name TEXT NOT NULL,
    assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    assigned_to_name TEXT,
    due_date DATE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create system_notifications Table
CREATE TABLE IF NOT EXISTS public.system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('task_assigned', 'task_completed', 'reminder', 'system', 'announcement')),
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_system_tasks_creator ON public.system_tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_system_tasks_assigned_to ON public.system_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_system_tasks_due_date ON public.system_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_system_tasks_visibility ON public.system_tasks(visibility);
CREATE INDEX IF NOT EXISTS idx_system_tasks_status ON public.system_tasks(status);

CREATE INDEX IF NOT EXISTS idx_system_notifications_user ON public.system_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_system_notifications_is_read ON public.system_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_system_notifications_created_at ON public.system_notifications(created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.system_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for system_tasks
-- Users can view:
-- 1. Tasks they created
-- 2. Tasks assigned to them
-- 3. Public tasks / announcements
CREATE POLICY "Users can view accessible tasks"
    ON public.system_tasks
    FOR SELECT
    USING (
        auth.uid() = creator_id OR
        visibility = 'public' OR
        (visibility = 'assigned' AND assigned_to IS NOT NULL)
    );

CREATE POLICY "Authenticated users can create tasks"
    ON public.system_tasks
    FOR INSERT
    WITH CHECK (auth.uid() = creator_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Creators and assignees can update tasks"
    ON public.system_tasks
    FOR UPDATE
    USING (
        auth.uid() = creator_id OR
        visibility = 'public'
    );

CREATE POLICY "Creators can delete their tasks"
    ON public.system_tasks
    FOR DELETE
    USING (auth.uid() = creator_id);

-- 6. RLS Policies for system_notifications
CREATE POLICY "Users can view own notifications"
    ON public.system_notifications
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own notifications"
    ON public.system_notifications
    FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert notifications"
    ON public.system_notifications
    FOR INSERT
    WITH CHECK (true);

-- 7. Trigger Function: notify_task_assigned
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
    -- Scenario A: Task assigned to a specific staff member
    IF NEW.assigned_to IS NOT NULL AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to)) THEN
        INSERT INTO public.system_notifications (
            user_id,
            title,
            message,
            type,
            link_url,
            is_read,
            created_at
        ) VALUES (
            NEW.creator_id, -- placeholder or linked auth user
            'مهمة مسندة جديدة: ' || NEW.title,
            'تم إسناد مهمة جديدة إليك من قبل ' || NEW.creator_name || '. الأولوية: ' || NEW.priority,
            'task_assigned',
            '/workspace/tasks',
            false,
            NOW()
        );
    END IF;

    -- Scenario B: Public announcement or broadcast
    IF NEW.visibility = 'public' AND TG_OP = 'INSERT' THEN
        INSERT INTO public.system_notifications (
            user_id,
            title,
            message,
            type,
            link_url,
            is_read,
            created_at
        ) VALUES (
            NULL, -- broadcast to all users
            'إعلان عام / تذكير مؤسسي: ' || NEW.title,
            NEW.creator_name || ': ' || COALESCE(NEW.description, NEW.title),
            'announcement',
            '/workspace/tasks',
            false,
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Attach Trigger to system_tasks
DROP TRIGGER IF EXISTS trg_notify_task_assigned ON public.system_tasks;
CREATE TRIGGER trg_notify_task_assigned
    AFTER INSERT OR UPDATE ON public.system_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_task_assigned();
