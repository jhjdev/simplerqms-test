# SimplerQMS User and Group Management System 🚀

## About This Project

This project was originally a technical test for SimplerQMS that I have since expanded upon. I decided to use it as a learning tool to expand my skill set and create a showcase of various technologies and best practices in modern web development. Through this project, I've implemented testing frameworks, API documentation, UI enhancements, CI/CD workflows, and **enterprise-grade monitoring** to demonstrate a comprehensive approach to full-stack development.

## Overview

This application provides a comprehensive system for managing users, groups, and their hierarchical relationships. It includes both a RESTful API, a modern web interface, and an **enterprise-grade monitoring dashboard** for managing these entities with real-time insights into system performance.

## Core Features ✨

- 👥 Create, list, update, and delete users
- 🏢 Create, list, update, and delete groups
- 🔗 Add, remove, and list members of a group
- 🔍 Check if a member is within a group hierarchy
- 📊 Get all members within a group hierarchy
- 🏗️ Support for group-to-group relationships (groups can contain other groups)
- 💻 Modern web interface for all operations

## Enterprise Monitoring Features 📈

- 📊 **Real-time Performance Sparklines** - Live charts showing response times, memory usage, and database connections
- 🚨 **Intelligent Alert System** - Automatic monitoring with smart thresholds for system health
- 💾 **Comprehensive System Metrics** - Memory usage, CPU utilization, uptime tracking, and request statistics
- 🗄️ **Database Intelligence** - Connection monitoring, query performance, and operation statistics
- 🔄 **Auto-refresh Dashboard** - Live updates every 30 seconds with manual refresh controls
- 📤 **Health Report Export** - Download comprehensive system reports as JSON
- 🐳 **Docker Container Monitoring** - Container resource usage and health status
- ⚡ **API Traffic Analysis** - Request counts, error rates, and performance metrics
- 📝 **Recent Activity Tracking** - Monitor last user creations and group modifications
- 🌍 **Environment Information** - Complete system environment and version details

## Technology Stack 🛠️

- 🟢 **Backend**: Node.js with Express.js and TypeScript
- 🐘 **Database**: PostgreSQL with comprehensive monitoring
- ⚡ **Frontend**: Svelte 4.2.12 with SMUI 7.0.0 components and Vite

## Frontend Technology Decisions 📌

### Svelte and SMUI Version Pinning

This project uses **exact version pinning** for Svelte and Svelte Material UI (SMUI) components:

- **Svelte**: `4.2.12` (exact version)
- **SMUI Components**: `7.0.0` (exact version)

#### Why We Pin These Versions

**The Runes Problem**: Svelte 5+ introduced "runes" - a new reactivity system that fundamentally changes how data flows in Svelte applications. While runes offer improved performance and developer experience, the ecosystem hasn't fully caught up:

1. **SMUI Compatibility**: SMUI version 8+ requires Svelte 5+ with runes, but the data handling patterns are significantly different and less mature
2. **Complex Data Structures**: Our application handles hierarchical data (users in groups, groups in groups) which requires sophisticated parent-child relationships
3. **SMUI Select Component**: The select component in SMUI 8+ has compatibility issues even with the latest stable Svelte versions
4. **Docker Environment**: Containerized development environments add complexity when dealing with bleeding-edge version combinations
5. **Enterprise Stability**: For production-grade applications, stability trumps cutting-edge features

#### What This Means

- ✅ **Stable Development**: No version conflicts or compatibility issues
- ✅ **Reliable Components**: All SMUI components work as expected
- ✅ **Predictable Builds**: Docker builds are consistent across environments
- ✅ **Complex Data Handling**: Hierarchical user/group relationships work seamlessly
- ❌ **No Runes**: We don't get the benefits of Svelte 5's new reactivity system
- ❌ **Older API**: Using Svelte 4's older but proven API patterns

#### Migration Path

When the ecosystem matures (likely Q2-Q3 2025), we can migrate to:
- Svelte 5.x with stable runes support
- SMUI 8.x with full runes compatibility
- Updated TypeScript and testing configurations

For now, this setup provides a rock-solid foundation for enterprise development without the headaches of bleeding-edge compatibility issues.
- 🐳 **Containerization**: Docker and Docker Compose
- 📊 **Monitoring**: Custom-built enterprise-grade health dashboard
- 🎨 **Styling**: Modular CSS with Material Design principles
- 🔒 **Security**: HTTPS with SSL certificates

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
    {
      "id": "1",
      "name": "Tom",
      "email": "tom@example.com",
      "path": ["Europe", "Denmark"]
    },
    {
      "id": "2",
      "name": "Mark",
      "email": "mark@example.com",
      "path": ["Europe", "Denmark"]
    }
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
2. Run `docker compose up --build` to start the application
3. Access the API at https://localhost:3000
4. Access the frontend at https://localhost:5173
5. **NEW**: Access the System Health Dashboard at https://localhost:5173/health-status
6. Access the interactive API documentation at https://localhost:3000/api-docs

### Data Persistence

By default, the application runs with a fresh database on each container restart. This means that any data you create (users, groups, etc.) will be reset when you restart the containers. This is useful for development and testing purposes.

If you want to persist your data between container restarts, you can enable data persistence by:

1. Opening `docker-compose.yml`
2. Uncommenting these two sections:

   ```yaml
   # In the postgres service:
   - 'postgres_data:/var/lib/postgresql/data'

   # At the bottom of the file:
   volumes:
     postgres_data:
   ```

3. Restart your containers with:
   ```bash
   docker compose down
   docker compose up
   ```

To switch back to non-persistent mode:

1. Comment out the same sections in `docker-compose.yml`
2. Remove the volume:
   ```bash
   docker volume rm simplerqms-test_postgres_data
   ```
3. Restart your containers

Note: The initial data (test user and test group) will always be created when the database is initialized, regardless of whether persistence is enabled or not.

## Frontend Features 🎨

### Core Management Features
- 👥 **User Management**: Create, edit, and delete users
- 🏢 **Group Management**: Create, edit, and delete groups
- 🌳 **Group Hierarchy**: Visualize and manage the group hierarchy
- 🔗 **Membership Management**: Add and remove members from groups
- 🔍 **Membership Checking**: Check if a user or group is within a specific group hierarchy
- 📊 **Hierarchy Exploration**: View all members within a group hierarchy

### Enterprise Monitoring Dashboard
- 📈 **Real-time Sparklines**: Live performance trend visualization with SVG charts
- 🚨 **Smart Alert System**: Intelligent monitoring with automatic threshold detection
- 💾 **Memory Monitoring**: Visual memory usage tracking with animated progress bars
- ⚡ **Performance Metrics**: Response times, CPU usage, and system uptime
- 🗄️ **Database Analytics**: Connection monitoring, query statistics, and size tracking
- 📤 **Export Functionality**: Download comprehensive health reports as JSON
- 🔄 **Auto-refresh**: Configurable live updates every 30 seconds
- 🎯 **Current System Status**: Real-time status indicators for all services
- 📝 **Recent Activity**: Track last user creations and group modifications
- 🌍 **Environment Details**: Complete system environment and version information

## Bonus Features Implemented 🎁

### Testing Framework 🧪
- 🟢 **Unit Tests**: Backend API endpoint tests using Jest and Supertest
- ⚡ **Frontend Tests**: Component tests using Vitest and Testing Library
- ⚙️ **Test Configuration**: Separate TypeScript configuration for tests
- 📊 **Coverage Reports**: Comprehensive test coverage tracking

### Documentation 📚
- 📖 **API Documentation**: Interactive Swagger/OpenAPI documentation for all endpoints
- 📋 **User Guide**: Comprehensive README with setup and usage instructions
- 💬 **Code Documentation**: JSDoc comments for better code understanding
- ❓ **FAQ System**: Comprehensive FAQ with emojis and detailed explanations

### UI/UX Enhancements 🎨
- 🌳 **Enhanced TreeView**: Improved group hierarchy visualization with search functionality
- 📊 **Member Count Display**: Visual indicators of group size and hierarchy depth
- 🔽 **Expand/Collapse**: Better navigation of complex hierarchies
- ♿ **Accessibility**: ARIA roles and keyboard navigation support
- 🎯 **Material Design**: Consistent Material UI components throughout
- 📱 **Responsive Design**: Mobile-first responsive layout

### Enterprise Monitoring Dashboard 📈
- 📊 **Real-time Sparklines**: Live performance trend visualization
- 🚨 **Intelligent Alerts**: Smart monitoring with automatic threshold detection
- 💾 **Memory Monitoring**: Visual memory usage tracking with progress bars
- ⚡ **Performance Metrics**: Response times, CPU usage, and system uptime
- 🗄️ **Database Analytics**: Connection monitoring and query statistics
- 📤 **Export Functionality**: Download comprehensive health reports
- 🔄 **Auto-refresh**: Configurable live updates every 30 seconds

### DevOps & CI/CD 🚀
- 🐙 **GitHub Actions**: Automated testing and build pipeline
- ✅ **Code Quality**: ESLint and Prettier integration
- 📦 **Artifact Generation**: Build artifacts for deployment
- 🐳 **Docker Optimization**: Multi-stage builds and container monitoring
- 🔒 **SSL Security**: HTTPS configuration with proper certificates

### Code Organization 🎯
- 📁 **Modular CSS**: Separated stylesheets for better maintainability
- 🔷 **TypeScript**: Strict typing throughout the application
- 🎨 **Component Architecture**: Well-structured, reusable Svelte components
- 📋 **API Structure**: Clean, RESTful API design with proper error handling

## Quick Access Links 🌐

- 🚀 **Frontend Application**: https://localhost:5173
- 📊 **System Health Dashboard**: https://localhost:5173/health-status
- 📖 **API Documentation**: https://localhost:3000/api-docs
- ❓ **FAQ Page**: https://localhost:5173/faq
- ⚡ **Health Check API**: https://localhost:3000/health
- 👥 **Groups API**: https://localhost:3000/api/groups
- 👤 **Users API**: https://localhost:3000/api/users

## Key Monitoring Endpoints 📊

### Health Check API
```bash
# Comprehensive system health with metrics
GET https://localhost:3000/health
```

Returns detailed system information including:
- API server status, uptime, and memory usage
- Database connection status, size, and query statistics
- Request counts, error rates, and performance metrics
- Recent activity and alert history
- Environment and version information
- Performance history for sparkline charts

### Alert Monitoring
The system automatically monitors:
- High memory usage (>80%)
- High error rates (>5%)
- Slow response times (>1000ms)
- Slow database queries (>500ms)

## Screenshots 📸

### System Health Dashboard
The enterprise monitoring dashboard provides:
- Real-time system status overview
- Performance sparklines showing trends
- Memory usage visualization
- Alert history and notifications
- Database analytics and statistics
- Export functionality for reports

## Future Improvements 🔮

- Add authentication and authorization
- Implement pagination for large datasets
- Add real-time WebSocket updates for live monitoring
- Implement caching for frequently accessed group hierarchies
- Add multitenancy support
- Optimize database queries for large hierarchies
- Add log aggregation and analysis
- Implement custom alert thresholds
- Add performance baselines and trend analysis

# Some notes about the base setup

## How to get going

1. Make sure you have `docker` installed on your machine
2. Open the `docker-compose.yml` file, and uncomment either the `node`, `rails`, or `golang` section, depending on which languge you'd like to do the case in
3. Run `docker compose up --build`

And that should be it! You should be able to access the api server at `http://localhost:3000` regardless of which language you've chosen and the frontend server at `http://localhost:5173`.

### Live Reloading

`node`, `rails`, & `golang` have been setup with live reloading enabled. This means that your changes to the files should take immediate effect, and you don't need to restart the server to make the changes.

### Frontend

There is a very basic frontend included that can be accessed at `http://localhost:5173`. It currently has a very basic [Svelte](https://svelte.dev/) setup, but do not feel you need to add to it or continue to use Svelte, unless you are inclined to do so.

## Development Tools

### Docker Commands

#### NPM Scripts

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

#### Docker Compose Commands

##### Basic Commands

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

##### Managing Specific Services

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

##### Accessing Container Shells

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

##### Maintenance Commands

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

##### Environment Validation

```bash
# Validate docker-compose configuration
docker compose config

# Check PostgreSQL connection from Node container
docker compose exec node ash -c "nc -zv postgres 5432"

# List PostgreSQL tables
docker compose exec postgres psql -U backend -d simplerqms_test_db -c "\dt;"

# Test API endpoints
curl https://localhost:3000/api/users
curl https://localhost:3000/health
```

### Additional Resources

#### Live Reloading

The application has been configured with live reloading enabled for development. This means that changes to the source files will automatically be reflected in the running application without needing to restart the server.

#### Accessing the FAQ

The application includes a FAQ page that provides quick access to important links and information about the system. You can access this by clicking on the 'FAQ' link in the navigation bar.

#### Running Tests

To run the tests for the application:

```bash
# For backend tests
docker compose exec node npm test

# For frontend tests
docker compose exec frontend npm test
```
