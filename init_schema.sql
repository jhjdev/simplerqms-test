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

INSERT INTO users(name, email) VALUES ('Testy McTestTest Testy Test', 'test@test.com');
INSERT INTO groups(name) VALUES ('Test Group');

