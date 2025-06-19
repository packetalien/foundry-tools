const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object.
// For now, we might not need specific IPC calls for basic WebSocket,
// as WebSocket can be used directly in the renderer if contextIsolation is true
// and nodeIntegration is false, provided it doesn't need Node.js specific modules
// for the WebSocket implementation itself (like 'ws').
// If we use the browser's native WebSocket, it's fine.
// If we need the 'ws' npm package, we'd expose it via contextBridge.

contextBridge.exposeInMainWorld('electronAPI', {
  // Example: if we needed to send messages from renderer to main
  // send: (channel, data) => ipcRenderer.send(channel, data),
  // receive: (channel, func) => {
  //   ipcRenderer.on(channel, (event, ...args) => func(...args));
  // }
  // For now, this can be minimal as WebSocket client can run in renderer.
});

console.log('Preload script loaded.');
