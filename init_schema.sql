-- Database schema only - data seeding is handled by the Node.js application

CREATE TABLE IF NOT EXISTS groups (
  id    serial primary key,
  name  varchar(255),
  parent_id integer REFERENCES groups(id) ON DELETE SET NULL,
  level integer NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at  TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS users (
  id    serial primary key,
  name  varchar(255),
  email varchar(255) NOT NULL,
  type  varchar(255) CHECK(type IN ('user')) NOT NULL DEFAULT 'user',
  created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at  TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS group_members (
  id serial primary key,
  group_id integer NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id integer NOT NULL,
  member_type VARCHAR(255) NOT NULL CHECK(member_type IN ('user', 'group')),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  CONSTRAINT unique_membership UNIQUE(group_id, member_id, member_type)
);

-- Test data seeding is now handled by the Node.js application on startup

