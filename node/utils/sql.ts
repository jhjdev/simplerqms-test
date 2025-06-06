import postgres from 'postgres';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

const getDatabaseConfig = (): DatabaseConfig => {
  const config: DatabaseConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'simplerqms',
  };

  if (process.env.NODE_ENV === 'production') {
    config.ssl = {
      rejectUnauthorized: true,
    };
  }

  return config;
};

if (!process.env.DATABASE_PASSWORD) {
  console.warn(
    'Warning: DATABASE_PASSWORD environment variable is not set. Using default password.'
  );
}

const config = getDatabaseConfig();

// Create postgres connection with template literal support
const sql = postgres({
  host: config.host,
  port: config.port,
  username: config.user,
  password: config.password,
  database: config.database,
  ssl: config.ssl,
});

// Test the connection
(async () => {
  try {
    await sql`SELECT NOW()`;
    console.log('Successfully connected to the database');
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
})();

export default sql;
