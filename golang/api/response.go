package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

func WriteResponse(ctx context.Context, w http.ResponseWriter, response interface{}) {
	responseJSON, err := json.Marshal(response)
	if err != nil {
		w.WriteHeader(500)
		w.Write([]byte(fmt.Sprintf("failed to marshall response: %s", err.Error())))
		return
	}

	w.WriteHeader(200)
	w.Header().Add("content-type", "application/json")
	w.Write(responseJSON)
}