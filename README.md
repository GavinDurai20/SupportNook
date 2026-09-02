# SupportNook

> A real-time collaborative workspace for support teams to communicate, code, and share ideas in one place.

## Overview

SupportNook is a full-stack real-time collaboration platform that combines:

- Real-time chat
- Collaborative code editor
- Multi-language code execution using Judge0
- Real-time collaborative whiteboard
- Room-based collaboration
- WebSocket-based synchronization

## Architecture

```text
                 ┌─────────────────────┐
                 │      Vercel         │
                 │   React + Vite      │
                 └──────────┬──────────┘
                            │
                 REST API + WebSocket
                            │
                 ┌──────────▼──────────┐
                 │       Render        │
                 │ Node.js + Express   │
                 │     Socket.IO       │
                 └──────┬───────┬──────┘
                        │       │
              ┌─────────▼─┐   ┌─▼─────────┐
              │ MongoDB   │   │  Judge0   │
              │  Atlas    │   │ Code Exec │
              └───────────┘   └───────────┘

