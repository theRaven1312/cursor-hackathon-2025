# HTTPS Setup for Mobile Access

## Why HTTPS?

Modern browsers require HTTPS (secure connection) to access sensitive APIs like:
- Camera (`getUserMedia`)
- Geolocation
- Microphone

When accessing the app from a mobile device via HTTP (e.g., `http://100.101.196.116:5173`), these permissions will be blocked.

## Quick Setup

### 1. Generate Self-Signed Certificate

```bash
chmod +x generate-cert.sh
./generate-cert.sh
```

This creates SSL certificates in the `./cert/` directory with your IP address (100.101.196.116) included.

### 2. Create .env File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
VITE_HTTPS=true
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start with HTTPS enabled on `https://0.0.0.0:5173`

### 4. Access from Mobile

1. Navigate to `https://100.101.196.116:5173` on your phone
2. You'll see a security warning (because it's a self-signed certificate)
3. Click **"Advanced"** → **"Proceed to site"** (wording may vary by browser)
4. Camera and location permissions should now work! 🎉

## Troubleshooting

### Certificate Warning
Self-signed certificates always show a security warning. This is normal for development. Click through the warning to proceed.

### Alternative: Using mkcert (Trusted Certificates)

For a better experience without security warnings:

```bash
# Install mkcert
brew install mkcert

# Install local CA
mkcert -install

# Generate certificates
mkdir -p cert
mkcert -key-file cert/key.pem -cert-file cert/cert.pem localhost 127.0.0.1 100.101.196.116
```

Then set `VITE_HTTPS=true` in `.env` and restart the server.

### Backend HTTPS (Optional)

If you need the backend to also use HTTPS, you can configure Express with the same certificates. However, this usually isn't necessary if only the frontend needs secure context for browser APIs.

## Switching Back to HTTP

To disable HTTPS:

1. Set `VITE_HTTPS=false` in `.env` (or remove the line)
2. Restart the dev server

Note: Camera and geolocation will only work on localhost when using HTTP.
