#!/bin/bash

# Create ssl directory if it doesn't exist
mkdir -p ../ssl

# Generate private key and certificate
openssl req -x509 -newkey rsa:2048 -keyout ../ssl/key.pem -out ../ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"

# Set permissions
chmod 600 ../ssl/key.pem
chmod 644 ../ssl/cert.pem

echo "SSL certificates generated successfully!" 