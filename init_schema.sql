CREATE TABLE groups (
  id    serial primary key,
  name  varchar(255),
  created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at  TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE users (
  id    serial primary key,
  name  varchar(255),
  email varchar(255) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at  TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE group_members (
  id serial primary key,
  user_id integer NOT NULL REFERENCES users(id),
  group_id integer NOT NULL REFERENCES groups(id),
  member_id integer,
  member_type VARCHAR(255) CHECK(member_type IN ('user', 'group')),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

INSERT INTO users(name, email) VALUES ('Testy McTestTest Testy Test', 'test@test.com');
INSERT INTO groups(name) VALUES ('Test Group');

