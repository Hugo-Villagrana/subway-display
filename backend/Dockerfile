# Build from the directory that contains go.mod (backend/).
# docker build -t blinky-api ./backend

FROM golang:1.25-bookworm AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /server ./cmd

FROM gcr.io/distroless/static-debian12:nonroot

ENV GIN_MODE=release

COPY --from=builder /server /server

EXPOSE 8080
ENTRYPOINT ["/server"]
