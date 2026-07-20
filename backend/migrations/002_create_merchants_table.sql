CREATE TABLE merchants (
    id UUID PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    api_key VARCHAR(255) UNIQUE NOT NULL,

    webhook_url TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);