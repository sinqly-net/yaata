-- Migration V2: Request snapshot in history & Collection sharing
ALTER TABLE request_history ADD COLUMN IF NOT EXISTS request_data JSON;
ALTER TABLE request_history ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

CREATE TABLE IF NOT EXISTS collection_access (
    id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collection (id) ON DELETE CASCADE,
    permissions VARCHAR NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_request_history_request_id ON request_history(request_id);
CREATE INDEX IF NOT EXISTS idx_collection_access_user_id ON collection_access(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_access_collection_id ON collection_access(collection_id);
