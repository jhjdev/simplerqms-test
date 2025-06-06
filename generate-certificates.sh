#!/bin/bash

# Create ssl directory if it doesn't exist
mkdir -p ssl

# Create a temporary config file for OpenSSL
cat > ssl/openssl.cnf << EOF
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = Organization
OU = Unit
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
EOF

# Generate private key and certificate with SAN
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -config ssl/openssl.cnf

# Set appropriate permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

# Clean up
rm ssl/openssl.cnf

echo "SSL certificates generated successfully" 