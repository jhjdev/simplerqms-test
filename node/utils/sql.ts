import { Pool, PoolConfig, QueryResult } from 'pg';

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

const pool = new Pool(getDatabaseConfig());

// Test the connection
pool.query('SELECT NOW()', (err: Error | null, res: QueryResult) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Successfully connected to the database');
  }
});

export default pool;
