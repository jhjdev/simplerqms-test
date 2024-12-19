# SimplerQMS' Hiring Case
Hello! First of all, thanks for taking the time to do our case study. We're looking forward to seeing what you're able to do and having an in-depth technical discussion afterwards.

## Scope
This case study servers as the foundation of a good & results-driven interview process, to help ensure we can onboard technical talent as quickly as possible.

## Rules
- Please use either `node`, `ruby on rails`, or `golang` for implementing a solution to this case.
- From receipt of this case, you have 2 hours to get as far as you can, and email your solution back to us.
- Please do not hesitate to reach out to us during the assessment if you have any questions

## Task: Implement means of storing & getting `users`, `groups`, and `group members`
Many systems have to deal with users & groups, and their interactions between them. Ours is no different, so it's your task to design & implement a system for doing so. We'd like to see (at a minimum) the ability to do the following via API endpoints:

- Create, list, update, & delete users
- Create, list, update, & delete groups
- Add, remove, & list members of a group
- Check if a member is with a group heirarchy
- Get all members within a group heirarchy

**One important note:**

In our system, a group member can be either a `user` or another `group` (hence the aforementioned "group heirarchy" points). Example:
```md
Europe (Group)
├── Denmark (Group)
│   ├── Product (Group)
│   ├── Finance (Group)
│   ├── Tom (User)
│   └── Mark (User)
│
├── Germany (Group)
│   ├── Sales (Group)
│   ├── Karen (User)
│   └── Fritz (User)
│
└── Sweden (Group)
```

### Bonus Tasks
There are a number of other areas that are also interesting to see your thoughts & methodologies around, including but not limited to:

- Testing
- Documentation
- UIs for interacting with your API
- Scaling strategies
- Multitenancy architectures
- CI/CD strategies

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
