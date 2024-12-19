package db

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DatabaseConnectionProvider interface {
	GetConnectionPool(ctx context.Context) (*pgxpool.Pool, error)
}

type connectionProvider struct {
	pool *pgxpool.Pool
}

func NewConnectionProvider(ctx context.Context) (*connectionProvider, error) {
	dbpool, err := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to create connection pool: %v\n", err)
		return nil, err
	}

	return &connectionProvider{
		pool: dbpool,
	}, nil
}

func (cp *connectionProvider) GetConnectionPool(ctx context.Context) (*pgxpool.Pool, error) {
	return cp.pool, nil
}