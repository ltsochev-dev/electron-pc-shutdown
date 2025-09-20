# Remote App

An Electron application with a bundled React SPA served by an HTTP server.

## Project Structure

- **Electron Main Process**: `src/main.ts`
- **Electron Preload**: `src/preload.ts`
- **Electron Renderer**: `src/renderer.ts` (for Electron windows)
- **Web SPA**: `src/web/` (React app served by HTTP server)
- **HTTP Server**: `src/server.ts` (serves the bundled web app)

## Development

### Install Dependencies

```bash
npm install
```

### Development Commands

- **Start Electron app**: `npm start`
- **Build web assets**: `npm run build:web`
- **Dev server for web**: `npm run dev:web`
- **Build everything**: `npm run build:all`

### Web Development Workflow

1. **Development**: Use `npm run dev:web` to start Vite dev server for hot reload
2. **Production**: Use `npm run build:web` to bundle assets to `dist/web/`

The HTTP server automatically serves:

- **Development**: Raw files from `src/web/`
- **Production**: Bundled files from `dist/web/`

## How It Works

1. **Vite Configuration**: `vite.web.config.ts` handles bundling the React SPA
2. **Electron Forge**: `forge.config.ts` includes the web build in the build process
3. **HTTP Server**: `src/server.ts` serves static files with SPA routing support
4. **Build Output**: Bundled assets go to `dist/web/` directory

## File Structure

```
src/
├── web/                    # React SPA source
│   ├── index.html         # HTML template
│   ├── frontend.tsx       # React entry point
│   └── App.tsx            # Main React component
├── server.ts              # HTTP server
└── main.ts                # Electron main process

dist/web/                  # Bundled web assets (generated)
├── index.html
└── assets/
    └── main-[hash].js
```

## Features

- ✅ Electron Forge + Vite integration
- ✅ React SPA with TypeScript
- ✅ Tailwind CSS styling
- ✅ HTTP server with static file serving
- ✅ SPA routing support (fallback to index.html)
- ✅ Development and production builds
- ✅ Hot reload in development
