package db

import (
	"context"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

var database struct{}

func DatabaseMiddleware(connProvider DatabaseConnectionProvider, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, err := WithDatabaseConnection(r.Context(), connProvider)
		if err != nil {
			http.Error(w, err.Error(), 500)
		}
		next(w, r.WithContext(ctx))
	}
}

func WithDatabaseConnection(ctx context.Context, connProvider DatabaseConnectionProvider) (context.Context, error) {
	dbPool, err := connProvider.GetConnectionPool(ctx)
	if err != nil {
		return nil, err
	}

	return context.WithValue(ctx, database, dbPool), nil
}

func GetConnection(ctx context.Context) (*pgxpool.Pool, error) {
	pool, ok := ctx.Value(database).(*pgxpool.Pool)
	if !ok {
		return nil, fmt.Errorf("failed to get connection pool")
	}
	return pool, nil
}
