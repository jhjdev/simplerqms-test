CREATE TABLE groups (
  id    serial primary key,
  name  varchar(255),
  parent_id integer REFERENCES groups(id) ON DELETE SET NULL,
  level integer NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at  TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE users (
  id    serial primary key,
  name  varchar(255),
  email varchar(255) NOT NULL,
  type  varchar(255) CHECK(type IN ('user')) NOT NULL DEFAULT 'user',
  created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at  TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE group_members (
  id serial primary key,
  group_id integer NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id integer NOT NULL,
  member_type VARCHAR(255) NOT NULL CHECK(member_type IN ('user', 'group')),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  CONSTRAINT unique_membership UNIQUE(group_id, member_id, member_type)
);

-- Create test user
INSERT INTO users(name, email) VALUES ('Test User', 'test@example.com');

-- Create parent group
INSERT INTO groups(name, parent_id, level) VALUES ('Europe', NULL, 0);

-- Create child groups
INSERT INTO groups(name, parent_id, level) 
SELECT 'Denmark', id, 1 
FROM groups 
WHERE name = 'Europe';

INSERT INTO groups(name, parent_id, level) 
SELECT 'Sweden', id, 1 
FROM groups 
WHERE name = 'Europe';

-- Add child groups to parent group
INSERT INTO group_members(group_id, member_id, member_type)
SELECT p.id, c.id, 'group'
FROM groups p, groups c
WHERE p.name = 'Europe' AND c.name = 'Denmark';

INSERT INTO group_members(group_id, member_id, member_type)
SELECT p.id, c.id, 'group'
FROM groups p, groups c
WHERE p.name = 'Europe' AND c.name = 'Sweden';

-- Create test user Lars
INSERT INTO users(name, email) VALUES ('Lars Larsen', 'lars@larsen.dk');

-- Add Lars to Denmark group
INSERT INTO group_members(group_id, member_id, member_type)
SELECT g.id, u.id, 'user'
FROM groups g, users u
WHERE g.name = 'Denmark' AND u.email = 'lars@larsen.dk';

