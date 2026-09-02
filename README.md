# SupportNook

## Real-Time Collaborative Support and Development Workspace

SupportNook is a full-stack real-time collaboration platform designed to help teams communicate, debug problems, write and execute code, and collaborate visually within a shared workspace.

The application provides **real-time chat, collaborative code editing, multi-language code execution, and an interactive whiteboard** using WebSockets and Socket.IO.

---

## Live Demo

**Frontend:** https://support-nook.vercel.app/

**Backend API:** https://supportnook.onrender.com/

---

## Overview

SupportNook combines multiple collaboration tools into a single browser-based workspace.

Users can create or join a workspace using a unique Room ID and collaborate with other users in real time.

### Core Features

- Real-time collaborative chat
- Room creation and room joining
- Real-time code synchronization
- Multi-language code editor
- Online code execution using Judge0
- Real-time code output synchronization
- Collaborative digital whiteboard
- Real-time drawing synchronization
- Canvas history synchronization
- Persistent room data using MongoDB
- WebSocket communication using Socket.IO
- RESTful API architecture
- Responsive web interface
- Cloud deployment using Vercel and Render

---

# Features

## 1. Real-Time Collaboration

SupportNook uses **Socket.IO and WebSockets** to enable real-time communication between users.

Multiple users can join the same workspace and receive updates without refreshing the page.

Real-time functionality includes:

- Chat messages
- Code changes
- Code execution output
- Whiteboard strokes
- Canvas clearing
- Room presence

---

## 2. Collaborative Code Editor

The integrated code editor allows multiple users to work on the same code simultaneously.

Supported languages include:

- JavaScript
- Python
- Java
- C
- C++
- C#
- Go
- Rust
- PHP
- Ruby
- Kotlin
- Swift
- TypeScript
- SQL

Code updates are transmitted through Socket.IO and synchronized between users inside the same room.

---

## 3. Multi-Language Code Execution

SupportNook integrates with **Judge0** to execute source code in a sandboxed environment.

The application sends:

- Source code
- Programming language ID
- Standard input

to the backend, which communicates with Judge0 and returns the execution result.

The output is then synchronized with other users in the workspace.

---

## 4. Real-Time Chat

Users inside the same room can communicate through the built-in chat system.

Chat messages are transmitted using Socket.IO, allowing users to receive messages instantly without refreshing the browser.

---

## 5. Collaborative Whiteboard

SupportNook provides a browser-based digital canvas for visual collaboration.

Users can:

- Draw using pointer events
- Adjust brush size
- Clear the canvas
- Synchronize drawing strokes
- Load previous canvas history

Canvas coordinates are normalized so that drawing data can be synchronized across different screen sizes.

---

## 6. Room-Based Collaboration

Each workspace is identified using a unique Room ID.

Users can:

1. Create a new workspace
2. Receive a unique Room ID
3. Share the Room ID
4. Join the workspace from another browser or device
5. Collaborate in real time

---

# Technology Stack

## Frontend

- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- WebSocket Client
- Socket.IO Client

## Backend

- Node.js
- Express.js
- Socket.IO
- REST APIs
- JavaScript

## Database

- MongoDB
- Mongoose
- MongoDB Atlas

## Code Execution

- Judge0

## Deployment

- Vercel
- Render
- MongoDB Atlas

---

# System Architecture

```text
                     ┌─────────────────────┐
                     │      User Browser   │
                     │                     │
                     │   React + Vite      │
                     │   Socket.IO Client  │
                     └──────────┬──────────┘
                                │
                    HTTPS / WebSocket
                                │
                                ▼
                     ┌─────────────────────┐
                     │   Node.js Server    │
                     │                     │
                     │   Express.js        │
                     │   Socket.IO         │
                     │   REST APIs         │
                     └───────┬─────┬───────┘
                             │     │
                 ┌───────────┘     └────────────┐
                 ▼                              ▼
        ┌─────────────────┐            ┌─────────────────┐
        │ MongoDB Atlas   │            │     Judge0      │
        │                 │            │                 │
        │ Room Data       │            │ Code Execution  │
        └─────────────────┘            └─────────────────┘
