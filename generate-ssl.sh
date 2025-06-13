#!/bin/bash

# SimplerQMS SSL Certificate Generation Script
# This script generates self-signed SSL certificates for local development

set -e  # Exit on any error

echo "🔒 SimplerQMS SSL Certificate Generator"
echo "====================================="
echo

# Check if OpenSSL is installed
if ! command -v openssl >/dev/null 2>&1; then
    echo "❌ Error: OpenSSL is not installed or not in PATH"
    echo "   Please install OpenSSL first:"
    echo "   - macOS: brew install openssl"
    echo "   - Ubuntu/Debian: sudo apt-get install openssl"
    echo "   - Windows: Download from https://slproweb.com/products/Win32OpenSSL.html"
    exit 1
fi

echo "✅ OpenSSL found: $(openssl version)"
echo

# Create ssl directory if it doesn't exist
if [ ! -d "ssl" ]; then
    echo "📁 Creating ssl directory..."
    mkdir -p ssl
else
    echo "📁 Using existing ssl directory..."
fi

cd ssl

# Check if certificates already exist
if [ -f "cert.pem" ] && [ -f "key.pem" ] && [ -f "ca-cert.pem" ]; then
    echo "⚠️  SSL certificates already exist!"
    echo "   Found: cert.pem, key.pem, ca-cert.pem"
    echo
    read -p "Do you want to regenerate them? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Keeping existing certificates. Exiting..."
        exit 0
    fi
    echo "🗑️  Removing existing certificates..."
    rm -f *.pem *.csr *.srl *.conf
fi

echo "🔧 Generating SSL certificates..."
echo

# Step 1: Generate CA private key
echo "1️⃣  Generating Certificate Authority (CA) private key..."
openssl genrsa -out ca-key.pem 4096
echo "   ✅ ca-key.pem created"

# Step 2: Generate CA certificate
echo "2️⃣  Generating CA certificate..."
openssl req -new -x509 -days 365 -key ca-key.pem -sha256 -out ca-cert.pem -subj "/C=US/ST=CA/L=San Francisco/O=SimplerQMS Development/CN=SimplerQMS CA"
echo "   ✅ ca-cert.pem created"

# Step 3: Generate server private key
echo "3️⃣  Generating server private key..."
openssl genrsa -out key.pem 4096
echo "   ✅ key.pem created"

# Step 4: Generate certificate signing request
echo "4️⃣  Generating certificate signing request..."
openssl req -subj "/C=US/ST=CA/L=San Francisco/O=SimplerQMS Development/CN=localhost" -new -key key.pem -out localhost.csr
echo "   ✅ localhost.csr created"

# Step 5: Create certificate extensions file
echo "5️⃣  Creating certificate extensions file..."
cat > localhost.conf << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = CA
L = San Francisco
O = SimplerQMS Development
CN = localhost

[v3_req]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
basicConstraints = CA:FALSE

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
echo "   ✅ localhost.conf created"

# Step 6: Generate server certificate
echo "6️⃣  Generating server certificate..."
openssl x509 -req -in localhost.csr -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out cert.pem -days 365 -extensions v3_req -extfile localhost.conf
echo "   ✅ cert.pem created"

# Step 7: Create symbolic links
echo "7️⃣  Creating symbolic links..."
ln -sf cert.pem localhost.pem
ln -sf key.pem localhost-key.pem
echo "   ✅ localhost.pem -> cert.pem"
echo "   ✅ localhost-key.pem -> key.pem"

# Step 8: Set appropriate permissions
echo "8️⃣  Setting file permissions..."
chmod 600 ca-key.pem key.pem
chmod 644 ca-cert.pem cert.pem localhost.csr localhost.conf
echo "   ✅ Permissions set (private keys: 600, certificates: 644)"

echo
echo "🎉 SSL Certificate Generation Complete!"
echo "======================================="
echo
echo "📂 Generated files in ssl/ directory:"
echo "   📄 ca-cert.pem          - Certificate Authority certificate"
echo "   🔐 ca-key.pem           - Certificate Authority private key (secure)"
echo "   📄 cert.pem             - Server certificate"
echo "   🔐 key.pem              - Server private key (secure)"
echo "   📄 localhost.csr        - Certificate signing request"
echo "   📄 localhost.conf       - Certificate configuration"
echo "   🔗 localhost.pem        - Symbolic link to cert.pem"
echo "   🔗 localhost-key.pem    - Symbolic link to key.pem"
echo "   📄 ca-cert.srl          - CA serial number file"
echo
echo "🚀 Next steps:"
echo "   1. Run 'docker compose up --build' to start the application"
echo "   2. Access https://localhost:5173 for the frontend"
echo "   3. Access https://localhost:3000 for the API"
echo
echo "💡 Optional: To avoid browser security warnings, you can trust the CA certificate:"
echo "   macOS: sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ssl/ca-cert.pem"
echo "   Linux: sudo cp ssl/ca-cert.pem /usr/local/share/ca-certificates/simplerqms-ca.crt && sudo update-ca-certificates"
echo
echo "⚠️  Important: SSL files are included in .gitignore to protect private keys"
echo

