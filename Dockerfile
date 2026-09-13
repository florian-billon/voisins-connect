FROM rust:1.91-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy Cargo files
COPY backend/Cargo.toml backend/Cargo.lock ./

# Create a dummy main.rs to cache dependencies
RUN mkdir backend/src && \
    echo "fn main() {}" > backend/src/main.rs && \
    cargo build --release && \
    rm -rf backend/src

# Copy the actual source code
COPY backend/src ./backend/src
COPY backend/migrations ./backend/migrations

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/target/release/hello_world_backend /app/hello_world_backend

# Copy migrations
COPY --from=builder /app/backend/migrations /app/migrations

EXPOSE 3001

ENV RUST_LOG=info
ENV PORT=3001

CMD ["/app/hello_world_backend"]
