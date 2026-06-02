# Real-Time Chat Feature

KisanSetu includes a real-time messaging system allowing **Buyers** and **Farmers** to communicate directly regarding orders or general inquiries.

## Architecture

The chat feature is built using **Socket.IO** for real-time, bi-directional communication, with a standard **Express REST API** for fetching historical data and managing conversations.

### Technologies Used
- **Backend:** Node.js, Express, Socket.IO, Mongoose (MongoDB)
- **Frontend:** React, Socket.IO Client, TailwindCSS

## Database Models

### 1. Conversation
Tracks an active chat session between exactly two users.
- `participants`: Array of User ObjectIds (Size: 2)
- `order`: (Optional) The Order ObjectId this chat is related to
- `lastMessage`: Preview of the most recent message sent
- `lastMessageAt`: Timestamp for sorting the conversation list

### 2. Message
Individual text messages belonging to a Conversation.
- `conversation`: Reference to the Conversation ObjectId
- `sender`: Reference to the User ObjectId who sent the message
- `text`: The message content
- `read`: Boolean indicating if the receiver has viewed the message

## API Endpoints

All chat endpoints are protected by JWT authentication (`/api/chat/*`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/conversation` | Gets an existing conversation with a `partnerId`, or creates a new one. |
| `GET`  | `/conversations` | Fetches all active conversations for the logged-in user, including unread message counts. |
| `GET`  | `/messages/:conversationId` | Fetches the full message history for a specific conversation. |
| `POST` | `/messages/:conversationId` | Fallback REST endpoint to send a message (Primary method is Socket.IO). |
| `PUT`  | `/messages/:conversationId/read` | Marks all unread messages in a conversation as read. |

## Real-Time Events (Socket.IO)

The backend Socket.IO server is initialized on the same port as the Express API and uses JWT for authentication during the handshake.

### Client-to-Server Events
- `join_conversation(conversationId)`: Subscribes the user's socket to a specific conversation room.
- `send_message({ conversationId, text })`: Emits a new message, saves it to MongoDB, updates the Conversation's `lastMessage`, and broadcasts it to the room.
- `mark_read({ conversationId })`: Marks unread messages as read in the database for the active conversation.

### Server-to-Client Events
- `receive_message(messageObj)`: Broadcasts the newly saved message object to all connected clients in the `conversationId` room.

## Frontend Integration

The UI is driven by the `ChatWidget.js` component, which is a reusable slide-out panel embedded in both `BuyerDashboard.js` and `FarmerDashboard.js`.

### Features
- **Global Availability:** Users can open their messages tab from anywhere in their dashboard.
- **Order Context:** Clicking "Chat with Farmer/Buyer" from an order card automatically initializes a conversation context tied to that specific order.
- **Unread Badges:** The conversation sidebar displays the count of unread messages.
- **Optimistic UI Updates:** Messages sent are immediately appended to the local state while being emitted over the socket.
