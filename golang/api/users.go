package api

import (
	"net/http"
	"log"
	"time"

	"simplerqms/db"
)

type User struct {
	ID				int			`json:"id"`
	Name			string	`json:"name"`
	Email			string	`json:"email"`
	CreatedAt	time.Time	`json:"created_at"`
	UpdatedAt time.Time	`json:"updated_at"`
}

func ListUsers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log.Println("GET Request on /api/users")

	conn, err := db.GetConnection(ctx)
	if err != nil {
		http.Error(w, "Could not establish a connection to the database", 500)
		return
	}

	rows, err := conn.Query(ctx, "SELECT * FROM users")
	if err != nil {
		http.Error(w, "Could not retrieve list of users from the db", 500)
		return
	}
	defer rows.Close()
	var items[]User
	for rows.Next() {
		var i User
		if err := rows.Scan(&i.ID, &i.Name, &i.Email, &i.CreatedAt, &i.UpdatedAt); err != nil {
			http.Error(w, "Could not retrieve list of users from the db", 500)
			return
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "Error parsing the users", 500)
	}

	WriteResponse(ctx, w, items)
}