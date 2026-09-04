# SupportNook

## 📌 Purpose

**SupportNook** is a real-time collaborative support workspace that allows multiple users to work together in the same room.

It provides:

- 💬 Real-time Chat
- 💻 Collaborative Code Editor
- ▶️ Multi-language Code Execution using Judge0
- 🎨 Real-time Collaborative Whiteboard
- 🔗 Room-based collaboration
---
## 🛠️ Tech Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express.js, Socket.IO
- **Database:** MongoDB
- **Code Execution:** Judge0
- **Deployment:** Vercel, Render
- **Containerization:** Docker & Docker Compose
---
## 🏗️ Architecture

                         SUPPORTNOOK
                Real-Time Collaboration Platform
                              │
             ┌────────────────┴────────────────┐
             │                                 │
             ▼                                 ▼
      ┌──────────────┐                  ┌──────────────┐
      │   FRONTEND   │                  │    BACKEND   │
      │              │                  │              │
      │ React + Vite │◄──── Socket ────►│ Node.js      │
      │              │                  │ Express      │
      │              │                  │ Socket.IO    │
      └──────┬───────┘                  └──────┬───────┘
             │                                 │
             │                                 ├──────────────┐
             │                                 │              │
             │                                 ▼              ▼
             │                          ┌────────────┐ ┌────────────┐
             │                          │  MongoDB   │ │   Judge0   │
             │                          │  Database  │ │ Code Runner│
             │                          └────────────┘ └────────────┘
             │
             ▼
    ┌─────────────────────────────────────────────┐
    │              SUPPORTNOOK FEATURES           │
    │                                             │
    │    Real-Time Chat                         │
    │    Collaborative Code Editor               │
    │    Multi-Language Code Execution           │
    │    Collaborative Whiteboard                │
    │    Room-Based Collaboration                │
    └─────────────────────────────────────────────┘


             DOCKERIZED LOCAL ENVIRONMENT

    ┌─────────────────────────────────────────────┐
    │              Docker Compose                 │
    │                                             │
    │   ┌──────────┐   ┌──────────┐   ┌────────┐ │
    │   │ Frontend │   │ Backend  │   │ MongoDB│ │
    │   │  Nginx   │   │ Node.js  │   │        │ │
    │   │  :5173   │   │  :5000   │   │ :27017 │ │
    │   └──────────┘   └──────────┘   └────────┘ │
    │                                             │
    └─────────────────────────────────────────────┘
