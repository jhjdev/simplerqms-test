# SimplerQMS User and Group Management System

## Overview
This application provides a comprehensive system for managing users, groups, and their hierarchical relationships. It includes both a RESTful API and a modern web interface for managing these entities.

## Features
- Create, list, update, and delete users
- Create, list, update, and delete groups
- Add, remove, and list members of a group
- Check if a member is within a group hierarchy
- Get all members within a group hierarchy
- Support for group-to-group relationships (groups can contain other groups)
- Modern web interface for all operations

## Technology Stack
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Frontend**: Svelte with Material UI components
- **Containerization**: Docker and Docker Compose

## API Documentation

### Users API

#### Get all users
```
GET /api/users
```
Returns a list of all users with their group information.

#### Get a specific user
```
GET /api/users/:id
```
Returns details for a specific user.

#### Create a new user
```
POST /api/users
```
Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "type": "user",
  "groupId": "1" // Optional
}
```

#### Update a user
```
PATCH /api/users/:id
```
Request body:
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "groupId": "2" // Optional, set to null to remove from group
}
```

#### Delete a user
```
DELETE /api/users/:id
```

### Groups API

#### Get all groups
```
GET /api/groups
```
Returns a flat list of all groups.

#### Get group hierarchy
```
GET /api/groups/hierarchy
```
Returns the complete group hierarchy with nested structure.

#### Get a specific group
```
GET /api/groups/:id
```
Returns details for a specific group.

#### Create a new group
```
POST /api/groups
```
Request body:
```json
{
  "name": "Marketing",
  "parent_id": "1" // Optional
}
```

#### Update a group
```
PATCH /api/groups/:id
```
Request body:
```json
{
  "name": "Digital Marketing",
  "parent_id": "2" // Optional
}
```

#### Delete a group
```
DELETE /api/groups/:id
```

### Group Membership API

#### Add a member to a group
```
POST /api/groups/:groupId/members
```
Request body:
```json
{
  "memberId": "1",
  "memberType": "user" // or "group"
}
```

#### Remove a member from a group
```
DELETE /api/groups/:groupId/members/:memberId
```
Query parameters:
```
memberType=user // or group
```

#### Check if a member is in a group hierarchy
```
POST /api/groups/:groupId/check-membership
```
Request body:
```json
{
  "memberId": "1",
  "memberType": "user" // or "group"
}
```
Response:
```json
{
  "isMember": true,
  "path": ["Europe", "Denmark"] // Path from root group to the member
}
```

#### Get all members within a group hierarchy
```
GET /api/groups/:groupId/all-members
```
Response:
```json
{
  "users": [
    { "id": "1", "name": "Tom", "email": "tom@example.com", "path": ["Europe", "Denmark"] },
    { "id": "2", "name": "Mark", "email": "mark@example.com", "path": ["Europe", "Denmark"] }
  ],
  "groups": [
    { "id": "3", "name": "Denmark", "path": ["Europe"] },
    { "id": "4", "name": "Product", "path": ["Europe", "Denmark"] }
  ]
}
```

## Setup and Installation

### Prerequisites
- Docker and Docker Compose

### Running the Application
1. Clone the repository
2. Run `docker-compose up` to start the application
3. Access the web interface at http://localhost:3000

## Frontend Features

- **User Management**: Create, edit, and delete users
- **Group Management**: Create, edit, and delete groups
- **Group Hierarchy**: Visualize and manage the group hierarchy
- **Membership Management**: Add and remove members from groups
- **Membership Checking**: Check if a user or group is within a specific group hierarchy
- **Hierarchy Exploration**: View all members within a group hierarchy

## Future Improvements

- Add authentication and authorization
- Implement pagination for large datasets
- Add search functionality
- Improve error handling and validation
- Add unit and integration tests
- Implement CI/CD pipeline
- Add support for multitenancy

# Some notes about the base setup

## How to get going
1. Make sure you have `docker` installed on your machine
2. Open the `docker-compose.yml` file, and uncomment either the `node`, `rails`, or `golang` section, depending on which languge you'd like to do the case in
3. Run `docker compose up --build`

And that should be it! You should be able to access the api server at `http://localhost:3000` regardless of which language you've chosen and the frontend server at `http://localhost:5173`.

### Live Reloading
`node`, `rails`, & `golang` have been setup with live reloading enabled. This means that your changes to the files should take immediate effect, and you don't need to restart the server to make the changes.

### Database connection
There is a connection to a `PostgreSQL` database already set up & ready for usage. 2 tables are already created, and you can add more either via your chosen language or modifying the `init_schema.sql` file and then calling `docker compose down` to remove the database and then `docker compose up --build` to recreate it.

### Frontend
There is a very basic frontend included that can be accessed at `http://localhost:5173`. It currently has a very basic [Svelte](https://svelte.dev/) setup, but do not feel you need to add to it or continue to use Svelte, unless you are inclined to do so.

### Accessing the terminal
You can access the terminal where the server is running via the command:
- Node: `docker compose exec node ash`
- Ruby: `docker compose exec ruby bash`
- Golang: `docker compose exec golang ash`

### Rails: API Mode
The Rails server has been configured & set up in "API Mode". This means that the assest pipeline & views portions have not been included, and we do not recommend spending time trying to get it working.

---

Originally designed by **Philip Hansen <phil@simplerqms.com>**\
Last updated Dec. 12, 2024

---

# SimplerQMS User Management System

## Project Description

This project is a simple User Management CRUD (Create, Read, Update, Delete) application that demonstrates the implementation of a hierarchical group system. It allows for managing users and groups, with the unique feature that groups can contain both users and other groups, creating complex hierarchical structures.

## Tech Stack

- **Frontend**: Svelte - A lightweight reactive UI framework
- **Backend**: Node.js with Express.js - A fast, unopinionated web framework for Node.js
- **Database Access**: postgres.js - A modern PostgreSQL client for Node.js
- **Database**: PostgreSQL - A powerful, open-source object-relational database system
- **Containerization**: Docker - For consistent deployment across environments

## Features

- User management (create, read, update, delete)
- Group management (create, read, update, delete)
- Group membership management (add, remove, list members)
- Hierarchical group structure support (groups can contain groups)
- Group membership verification
- Group hierarchy traversal

## Docker Commands

### NPM Scripts

The following Docker commands have been added to the `package.json` in the node folder for easier project management:

```bash
# Start all containers in the foreground
npm run docker:start

# Start all containers in the background
npm run docker:start:detached

# Stop all containers
npm run docker:stop

# Rebuild and start containers
npm run docker:rebuild

# View logs from all containers
npm run docker:logs

# Access the Node.js container shell
npm run docker:exec
```

### Docker Compose Commands

#### Basic Commands

```bash
# Start the application
docker compose up

# Start the application in detached mode
docker compose up -d

# Stop the application
docker compose down

# Stop the application and remove volumes
docker compose down -v

# Rebuild and start
docker compose up --build

# View logs for all services
docker compose logs -f
```

#### Managing Specific Services

```bash
# Restart a specific service (e.g., frontend)
docker compose restart frontend

# Rebuild and restart a specific service
docker compose up --build frontend

# View logs for a specific service
docker compose logs -f node
docker compose logs -f frontend
docker compose logs -f postgres

# Scale a service (e.g., increase node instances)
docker compose up -d --scale node=3
```

#### Accessing Container Shells

```bash
# Access Node.js container shell
docker compose exec node ash

# Access PostgreSQL container shell
docker compose exec postgres bash

# Access PostgreSQL CLI directly
docker compose exec postgres psql -U backend -d simplerqms_test_db

# Access Frontend container shell
docker compose exec frontend ash
```

#### Maintenance Commands

```bash
# Check container status
docker compose ps

# Check resource usage
docker stats

# Prune unused Docker resources
docker system prune -a

# Prune unused volumes
docker volume prune

# View Docker networks
docker network ls
```

#### Environment Validation

```bash
# Validate docker-compose configuration
docker compose config

# Check PostgreSQL connection from Node container
docker compose exec node ash -c "nc -zv postgres 5432"

# List PostgreSQL tables
docker compose exec postgres psql -U backend -d simplerqms_test_db -c "\dt;"

# Test API endpoint
curl http://localhost:3000/api/users
```

## Getting Started

1. Clone this repository
2. Run `docker compose up --build` to start all services
3. Access the API at `http://localhost:3000/api/users` to verify the setup
4. Access the frontend at `http://localhost:5173`

## API Endpoints

- **Users**:
  - GET `/api/users` - List all users
  - POST `/api/users/new` - Create a new user
  - GET `/api/users/:id/groups` - Check groups for a user

- **Groups** (To be implemented):
  - GET `/api/groups` - List all groups
  - POST `/api/groups/new` - Create a new group
  - PUT `/api/groups/:id` - Update a group
  - DELETE `/api/groups/:id` - Delete a group

- **Group Members** (To be implemented):
  - GET `/api/groups/:id/members` - List members of a group
  - POST `/api/groups/:id/members` - Add a member to a group
  - DELETE `/api/groups/:id/members/:memberId` - Remove a member from a group
