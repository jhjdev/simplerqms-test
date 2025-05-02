import postgres from 'postgres';

if (!process.env.DATABASE_PASSWORD) {
  console.warn('Warning: DATABASE_PASSWORD environment variable is not set. Using empty password.');
}

// Default connection settings
const sql = postgres({
  host: 'postgres',
  port: 5432,
  database: 'simplerqms_test_db',
  username: 'backend',
  password: 'PPk4nz5Zd1csikqjqnsc',
  onnotice: () => {}, // Suppress notices
  idle_timeout: 20, // Idle connection timeout in seconds
  connect_timeout: 30, // Connection timeout in seconds
  max_lifetime: 60 * 60 // Connection max lifetime in seconds
});

// Add connection error handling
sql.unsafe('SELECT 1')
  .then(() => console.log('Successfully connected to the database'))
  .catch(err => console.error('Failed to connect to the database:', err.message));

export default sql;
