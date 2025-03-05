# Ollama GUI Frontend

The frontend application for Ollama GUI, built with SvelteKit, providing a user-friendly interface for interacting with LLMs via the backend API.

## Features

- Modern, responsive UI with SvelteKit
- Support for multiple conversation threads
- Code highlighting and Markdown rendering
- Theme support (light/dark mode)
- WebSocket-based streaming for real-time LLM responses
- Document uploading for RAG capabilities
- Tag-based organization for conversations
- Model selection and parameter adjustment

## Directory Structure

```plaintext
frontend/
├── src/                  # Source code
│   ├── lib/              # Shared components and utilities
│   │   ├── components/   # UI components
│   │   │   ├── ChatHeader.svelte
│   │   │   ├── ChatInput.svelte
│   │   │   ├── ChatMessage.svelte
│   │   │   ├── ChatThread.svelte
│   │   │   ├── ConversationSearch.svelte
│   │   │   ├── LoadingSpinner.svelte
│   │   │   ├── Sidebar.svelte
│   │   │   └── TagList.svelte
│   │   ├── stores/       # Svelte stores for state management
│   │   │   ├── auth.ts
│   │   │   ├── conversations.ts
│   │   │   ├── models.ts
│   │   │   └── settings.ts
│   │   ├── api/          # API client code
│   │   │   ├── index.ts  # Main API client
│   │   │   └── websocket.ts # WebSocket client
│   │   ├── utils/        # Utility functions
│   │   └── types.ts      # TypeScript type definitions
│   ├── routes/           # SvelteKit routes (pages)
│   │   ├── +layout.svelte # Base layout
│   │   ├── login/        # Login page
│   │   ├── settings/     # Settings page
│   │   └── chat/         # Chat pages
│   │       └── [id]/     # Dynamic chat route
│   ├── app.css           # Global CSS
│   └── app.html          # HTML template
├── static/               # Static assets
├── svelte.config.js      # Svelte configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.js        # Vite configuration
├── package.json          # Node.js dependencies
└── README.md             # This file
```

## Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Backend API running (see the backend README)

## Setup

1. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. Create a `.env` file:

   ```bash
   echo "VITE_API_URL=http://localhost:8000/api" > .env
   ```

## Development

1. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

2. The application will be available at <http://localhost:5173/>

3. For development with HMR and debug tools:

   ```bash
   npm run dev -- --open
   ```

## Building for Production

1. Build the project:

   ```bash
   npm run build
   # or
   yarn build
   # or 
   pnpm build
   ```

2. Preview the production build:

   ```bash
   npm run preview
   # or
   yarn preview
   # or
   pnpm preview
   ```

## Testing and Linting

Run ESLint:

```bash
npm run lint
# or
yarn lint
# or
pnpm lint
```

Check TypeScript:

```bash
npm run check
# or 
yarn check
# or
pnpm check
```

## Environment Variables

The frontend can be configured using environment variables:

- `VITE_API_URL` - URL of the backend API (default: <http://localhost:8000/api>)
- `VITE_WS_URL` - URL for WebSocket connections (default: derived from API_URL)
- `VITE_APP_TITLE` - Application title displayed in the UI and browser tab

## Authentication

The frontend uses JWT tokens for authentication with the backend API. Tokens are stored in the browser's localStorage. User management is handled through the backend API.

## Customization

### Themes

The application supports light and dark themes using Tailwind CSS. You can customize the theme by modifying the `tailwind.config.js` file.

### Components

UI components are built with a component-based architecture using Svelte. You can customize or extend the UI by modifying the components in the `src/lib/components` directory.

## Common Issues

### API Connection Problems

If you can't connect to the backend API, make sure:

- The backend server is running
- The `VITE_API_URL` environment variable is set correctly
- CORS is properly configured on the backend

### WebSocket Connection Issues

WebSocket connections are used for streaming responses. If streaming doesn't work:

- Check that the WebSocket server is running on the backend
- Verify that your network allows WebSocket connections
- Check browser console for connection errors

### Build Errors

If you encounter build errors, try:

- Delete the `node_modules` directory and reinstall dependencies
- Make sure you're using a compatible Node.js version (18+)
- Check that all imports use the correct paths (case-sensitive)
