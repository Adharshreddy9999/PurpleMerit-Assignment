# WebSocket Events for Real-Time Collaboration

## Connection
- **connect**: Client connects to the server.
- **disconnect**: Client disconnects from the server.

## Room Management
- **join**
  - Client emits: `{ room: string }`
  - Server response: `user-joined` broadcast to room: `{ userId: string }`
- **leave**
  - Client emits: `{ room: string }`
  - Server response: `user-left` broadcast to room: `{ userId: string }`

## File Change Events
- **file-change**
  - Client emits: `{ room: string, fileId: string, content: string }`
  - Server response: `file-changed` broadcast to room: `{ userId: string, fileId: string, content: string, timestamp: number }`

## Activity / Cursor Events
- **activity**
  - Client emits: `{ room: string, activity: any }`
  - Server response: `activity-update` broadcast to room: `{ userId: string, activity: any, timestamp: number }`

---
**Note:** All events are namespaced per room (workspace). All broadcasts go to all clients in the same room.
