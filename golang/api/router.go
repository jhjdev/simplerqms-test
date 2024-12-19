package api

import (
	"net/http"

	"github.com/rs/cors"
)

type Router struct {
	mux	*http.ServeMux
}

func NewRouter() Router {
	return Router {
		mux: http.NewServeMux(),
	}
}

func (router *Router) ListenAndServe(address string) error {
	handler := cors.Default().Handler(router.mux)
	return http.ListenAndServe(address, handler)
}