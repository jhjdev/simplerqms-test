import * as express from 'express';
const userRouter = express.Router();

import sql from '../utils/db.ts';

/* Hello World function. */
userRouter.get('/', async function (req, res, next) {
  const users = await sql`
    SELECT *
    FROM users
  `;

  res.json(users);
});

// Create a new user
userRouter.post('/new', async function (req, res, next) {
  const { name, email } = req.body;
  const result = await sql`
    INSERT INTO users (name, email)
    VALUES (${name}, ${email})
    RETURNING *
  `;
  res.json(result[0]);
});

// Check if a user is within a group hierarchy
userRouter.get('/:id/groups', async function (req, res, next) {
  const { id } = req.params;
  const result = await sql`
    WITH RECURSIVE group_hierarchy AS (
      SELECT id, parent_id, 0 AS level
      FROM group_members
      WHERE member_id = ${id} AND member_type = 'user'
      UNION ALL
      SELECT gm.id, gm.parent_id, level + 1
      FROM group_members gm
      JOIN group_hierarchy gh ON gm.parent_id = gh.id
    )
    SELECT *
    FROM group_hierarchy
  `;
  res.json(result);
});

export default userRouter;
