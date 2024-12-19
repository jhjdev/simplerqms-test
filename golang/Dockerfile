FROM golang:1.23-alpine

WORKDIR /app

RUN apk update && apk add git make upx

RUN go install github.com/air-verse/air@latest
COPY go.mod go.sum ./
RUN go mod download

EXPOSE 3000

CMD ["air", "-c", ".air.toml"]