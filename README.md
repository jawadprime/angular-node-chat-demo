# Chat Demo

## Overview

A real-time chat demo built on Azure Communication Services — like a mini WhatsApp. One
person starts a chat, gets a link, and shares it with someone else; once that person
opens the link, both land in the same conversation with messages, typing status, and
read receipts syncing live between them.

## Features

- Custom virtual scrolling — smooth scrolling through long message history without
  rendering every message at once
- Create a chat room with multiple participants
- Read receipts
- Typing indicators

## How to run

1. Make sure you have an Azure Communication Services (ACS) resource in the Azure portal.
2. Open your ACS resource, go to **Keys**, and copy the connection string.
3. Create a `backend/.env` file and copy the contents of `backend/.env.example` into it.
4. Paste the ACS connection string into `backend/.env`.
5. From the project root, run:
   ```
   docker compose up --build
   ```
6. Open http://localhost:4200 — the app is running.

Want to test just the backend API? Import the Postman collection in `backend/postman/`
into Postman.

## Tech stack

- **Frontend**: Angular, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB
- **Realtime**: Azure Communication Services (Chat)
- **Infra**: Docker Compose
