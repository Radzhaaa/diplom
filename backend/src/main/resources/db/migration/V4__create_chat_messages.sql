CREATE TABLE chat_messages (
    id         BIGSERIAL PRIMARY KEY,
    project_id BIGINT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sender_id  BIGINT    NOT NULL REFERENCES users(id),
    content    TEXT      NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_project ON chat_messages(project_id, created_at DESC);
