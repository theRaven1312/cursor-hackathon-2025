#!/bin/bash

# Create cert directory if it doesn't exist
mkdir -p cert

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout cert/key.pem -out cert/cert.pem -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=IP:100.101.196.116,DNS:localhost,IP:127.0.0.1"

echo "✅ Self-signed certificate generated in ./cert/"
echo "Note: Your browser will show a security warning. Click 'Advanced' and 'Proceed' to continue."
