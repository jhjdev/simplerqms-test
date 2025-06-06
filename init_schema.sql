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
INSERT INTO users(name, email) VALUES ('Test User', 'test@user.com');

-- Create parent group
INSERT INTO groups(name, parent_id, level) VALUES ('Test Group', NULL, 0);

-- Create child groups
INSERT INTO groups(name, parent_id, level) 
SELECT 'Test Users', id, 1 
FROM groups 
WHERE name = 'Test Group';

INSERT INTO groups(name, parent_id, level) 
SELECT 'Test Sub Groups', id, 1 
FROM groups 
WHERE name = 'Test Group';

-- Add child groups to parent group
INSERT INTO group_members(group_id, member_id, member_type)
SELECT p.id, c.id, 'group'
FROM groups p, groups c
WHERE p.name = 'Test Group' AND c.name = 'Test Users';

INSERT INTO group_members(group_id, member_id, member_type)
SELECT p.id, c.id, 'group'
FROM groups p, groups c
WHERE p.name = 'Test Group' AND c.name = 'Test Sub Groups';

-- Add test user to Test Users group
INSERT INTO group_members(group_id, member_id, member_type)
SELECT g.id, u.id, 'user'
FROM groups g, users u
WHERE g.name = 'Test Users' AND u.email = 'test@user.com';

