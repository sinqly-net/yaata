CREATE TABLE "user" (
    email VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    id UUID NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id)
);

CREATE TABLE session (
    id VARCHAR NOT NULL,
    user_id UUID NOT NULL REFERENCES "user" (id),
    access_token VARCHAR NOT NULL,
    refresh_token VARCHAR NOT NULL,
    id_token VARCHAR NOT NULL,
    csrf_token VARCHAR NOT NULL,
    access_token_expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id)
);

CREATE TABLE workspace (
    name VARCHAR NOT NULL,
    created_by UUID NOT NULL REFERENCES "user" (id),
    id UUID NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id)
);

CREATE TABLE collection (
    name VARCHAR NOT NULL,
    workspace_id UUID NOT NULL REFERENCES workspace (id),
    id UUID NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id)
);

CREATE TABLE workspaceaccess (
    user_id UUID NOT NULL REFERENCES "user" (id),
    workspace_id UUID NOT NULL REFERENCES workspace (id),
    permissions VARCHAR NOT NULL,
    id UUID NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id)
);

CREATE TABLE folder (
    name VARCHAR,
    parent_id UUID REFERENCES folder (id),
    collection_id UUID REFERENCES collection (id),
    id UUID NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id)
);

CREATE TABLE request (
    name VARCHAR NOT NULL,
    url VARCHAR,
    body JSON,
    query_params JSON,
    headers JSON,
    method VARCHAR NOT NULL,
    folder_id UUID NOT NULL REFERENCES folder (id),
    id UUID NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id)
);

CREATE TABLE request_history (
    ok BOOLEAN NOT NULL,
    status INTEGER NOT NULL,
    status_text VARCHAR NOT NULL,
    headers JSON,
    body JSON,
    error JSON,
    request_id UUID NOT NULL REFERENCES request (id),
    id UUID NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    PRIMARY KEY (id)
);