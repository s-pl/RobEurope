// Simple realtime helper to access Socket.IO instance across modules
let ioInstance = null;

export function setIO(io) {
  ioInstance = io;
}

export function getIO() {
  return ioInstance;
}

// Convenience: emit an event to a specific user's channel
// Frontend listens to `notification:${userId}`
export function emitToUser(userId, eventName, payload) {
  if (!ioInstance) return;
  // We emit on an event name scoped by user, as the client listens directly
  // e.g., eventName = 'notification'
  ioInstance.emit(`${eventName}:${userId}`, payload);
}
