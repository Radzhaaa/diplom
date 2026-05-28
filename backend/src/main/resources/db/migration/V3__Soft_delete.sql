-- #14 Soft-delete: добавляем deleted_at в tasks и projects
-- Удаление теперь помечает запись, а не удаляет физически

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_task_deleted ON tasks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_project_deleted ON projects(deleted_at);
