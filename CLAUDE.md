# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (Turbopack, http://localhost:3000)
npm run dev

# Production build and start
npm run build && npm start

# Lint
npm run lint

# Tests (all)
npm test

# Run a single test file
npx vitest run src/path/to/file.test.ts

# Database reset
npm run db:reset
```

The `NODE_OPTIONS='--require ./node-compat.cjs'` prefix is baked into npm scripts to patch Node 25+ Web Storage SSR incompatibilities — don't remove it.

## Architecture Overview

UIGen is an AI-powered React component generator. Users describe components in natural language; Claude generates code into a virtual file system; components render live in a preview iframe.

### Key data flow

1. User sends message → `POST /api/chat` streams a response from Claude (Haiku 4.5 via `@ai-sdk/anthropic`)
2. Claude uses two tools during generation: `str_replace_editor` (file edits) and `file_manager` (CRUD on virtual files)
3. Tool calls mutate an in-memory `VirtualFileSystem` (`src/lib/file-system.ts`) that lives in `FileSystemProvider` context
4. The preview panel serializes the VFS and renders the component inside a sandboxed iframe (`src/components/preview/`)
5. For authenticated users, projects (messages + serialized VFS) are persisted to SQLite via Prisma server actions

### Directory layout

```
src/
  app/
    page.tsx              # Root — redirects auth users to /[projectId], else shows landing
    [projectId]/page.tsx  # Loads a saved project
    main-content.tsx      # Resizable three-panel layout (chat | editor | preview)
    layout.tsx            # Root layout
    api/chat/route.ts     # Streaming chat endpoint — main AI integration point
  actions/index.ts        # Server actions: auth (signUp/signIn/signOut) + project CRUD
  components/
    chat/                 # ChatInterface, MessageList, MessageInput, MarkdownRenderer
    editor/               # FileTree + CodeEditor (Monaco)
    preview/              # PreviewFrame (iframe renderer)
    auth/                 # AuthDialog, SignInForm
    ui/                   # Shadcn/UI primitives
  lib/
    file-system.ts        # VirtualFileSystem class — in-memory file tree, serializable
    auth.ts               # JWT session helpers (jose, 7-day expiry)
    prisma.ts             # Prisma singleton
    provider.ts           # AI provider setup; falls back to MockLanguageModel if no API key
    prompts/generation.tsx # System prompt instructing Claude on component generation style
    tools/
      str-replace.ts      # str_replace_editor tool definition
      file-manager.ts     # file_manager tool definition
    contexts/
      file-system-context.tsx # React context wrapping VirtualFileSystem
      chat-context.tsx        # React context for messages and streaming state
  middleware.ts           # JWT auth guard for /api/projects and /api/filesystem
prisma/
  schema.prisma           # User + Project models (SQLite)
  dev.db                  # Local SQLite database
```

### AI provider

`src/lib/provider.ts` exports the model used in `/api/chat`. If `ANTHROPIC_API_KEY` is unset, it returns a `MockLanguageModel` that streams canned responses — useful for UI development without API costs.

The generation system prompt (`src/lib/prompts/generation.tsx`) constrains Claude to: Tailwind CSS styling, JSX with `@/` import aliases, and the two file-operation tools.

### Preview rendering

`src/components/preview/PreviewFrame.tsx` renders the active component in a sandboxed iframe. `src/lib/transform/jsx-transformer.ts` uses Babel Standalone to transpile JSX → plain JS, extracts imports, and generates blob URL import maps so the iframe can resolve `@/` aliases and third-party modules without a bundler.

### Authentication

JWT-based, stored in an httpOnly cookie. `src/lib/auth.ts` handles token creation and verification. `src/actions/index.ts` exposes `signUp`, `signIn`, `signOut`, `getUser` as server actions. Unauthenticated users can still generate components but projects aren't persisted.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | No | Enables real AI generation (falls back to mock if absent) |
| `JWT_SECRET` | Yes (prod) | Signs session tokens |
| `DATABASE_URL` | Defaults to `file:./dev.db` | Prisma connection string |
