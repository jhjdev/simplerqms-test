import postgres from 'postgres'

const sql = postgres({
  host: 'postgres',
  database: 'hiring_case',
  username: 'backend',
  password: process.env.DATABASE_PASSWORD
})

export default sql