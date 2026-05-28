-- Security audit log (separate from gamification activity_logs)
CREATE TABLE audit_logs (
    id            BIGSERIAL PRIMARY KEY,
    actor_email   VARCHAR(255) NOT NULL,
    action        VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id   BIGINT,
    description   TEXT,
    ip_address    VARCHAR(45),
    success       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor   ON audit_logs (actor_email);
CREATE INDEX idx_audit_action  ON audit_logs (action);
CREATE INDEX idx_audit_created ON audit_logs (created_at);
