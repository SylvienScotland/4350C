CREATE TABLE users (
    id INTEGER PRIMARY KEY,   -- Auto-increments by default
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);
