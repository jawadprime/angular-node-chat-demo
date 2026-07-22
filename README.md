# Chat Demo

## Overview

A real-time chat demo built on Azure Communication Services — like a mini WhatsApp. One
person starts a chat, gets a link, and shares it with someone else; once that person
opens the link, both land in the same conversation with messages, typing status, and
read receipts syncing live between them.

## Features

- Create a chat room with multiple participants
- Read receipts
- Typing indicators

## Performance

- Custom virtual scrolling — smooth scrolling through long message history without
  rendering every message at once (see [docs/virtual-scroll.md](docs/virtual-scroll.md))
- Lazy message loading — only the latest messages load at first; older ones load from
  ACS on demand as you scroll up

## Tech stack

- **Frontend**: Angular, TypeScript — signals-based
- **Backend**: Node.js, Express, TypeScript — vertical slices architecture
- **Database**: MongoDB
- **Realtime**: Azure Communication Services (Chat)
- **Infra**: Docker Compose

## How to run

1. Make sure you have an Azure Communication Services (ACS) resource in the Azure portal.
2. Open your ACS resource, go to **Keys**, and copy the connection string.
3. Create `backend/.env` by copying the contents of `backend/.env.example`.
4. Open `backend/.env` and paste your connection string in place of `ACS_CONNECTION_STRING`. Leave the other values as they are.
5. From the project root, run:
   ```
   docker compose up --build
   ```
6. Open http://localhost:4200 — the app is running.

Want to test just the backend API? Import the Postman collection in `backend/postman/`
into Postman.

## Suggestions for improvement

- Add unit tests for the virtual scroll logic.
- Reuse existing chat threads instead of creating a new one each time.
