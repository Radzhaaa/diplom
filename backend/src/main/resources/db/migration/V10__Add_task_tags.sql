-- task_tags (ElementCollection for Task.tags)
CREATE TABLE task_tags (
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag     VARCHAR(255)
);

CREATE INDEX idx_task_tags_task ON task_tags (task_id);
