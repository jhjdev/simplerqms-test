import * as express from 'express';
const groupRouter = express.Router();

import sql from '../utils/db.ts';

// Create a new group
groupRouter.post('/', async function (req, res, next) {
  const { name } = req.body;
  const result = await sql`
    INSERT INTO groups (name)
    VALUES (${name})
    RETURNING *
  `;
  res.json(result[0]);
});

// List all groups
groupRouter.get('/', async function (req, res, next) {
  const result = await sql`
    SELECT *
    FROM groups
  `;
  res.json(result);
});

// Get a group by ID
groupRouter.get('/:id', async function (req, res, next) {
  const { id } = req.params;
  const result = await sql`
    SELECT *
    FROM groups
    WHERE id = ${id}
  `;
  res.json(result[0]);
});

// Update a group
groupRouter.patch('/:id', async function (req, res, next) {
  const { id } = req.params;
  const { name } = req.body;
  const result = await sql`
    UPDATE groups
    SET name = ${name}
    WHERE id = ${id}
    RETURNING *
  `;
  res.json(result[0]);
});

// Delete a group
groupRouter.delete('/:id', async function (req, res, next) {
  const { id } = req.params;
  await sql`
    DELETE FROM groups
    WHERE id = ${id}
  `;
  res.status(204).send();
});

export default groupRouter;
