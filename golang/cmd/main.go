package main

import (
	"context"
	"log"

	"simplerqms/api"
	"simplerqms/db"
)

func main() {
	ctx := context.Background()

	// Get a database pool
	databaseConnectionProvider, err := db.NewConnectionProvider(ctx)
	if err != nil {
		log.Fatal(err)
	}

	// Start the Web Server
	apiServer := api.APIServer{
		Router: api.NewRouter(),
	}

	log.Println("Starting server on 0.0.0.0:3000")

	err = apiServer.Start("0.0.0.0:3000", databaseConnectionProvider)
	if err != nil {
		log.Fatal(err)
	}
}