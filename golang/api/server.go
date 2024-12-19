package api

import (
	"net/http"

	"simplerqms/db"
)

type APIServer struct {
	Router Router
}

func (s *APIServer) registerEndpoint(path string, handler http.HandlerFunc, dbConnProvider db.DatabaseConnectionProvider) {
	handleFunc := db.DatabaseMiddleware(dbConnProvider, handler)

	s.Router.mux.HandleFunc(path, handleFunc)
}

func (s *APIServer) Start(address string, dbConnProvider db.DatabaseConnectionProvider) error {
	// Add routes
	s.registerEndpoint("GET /api/users", ListUsers, dbConnProvider)

	return s.Router.ListenAndServe(address)
}

