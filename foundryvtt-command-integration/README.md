# Foundry VTT Command Integration Module

## Purpose

This module provides a basic framework for sending commands to Foundry Virtual Tabletop, primarily through a JavaScript API and a socket interface. It allows for programmatic execution of macros, sending chat messages, and can be extended to support other command types.

## Features

*   **JavaScript API:** Exposes functions to execute macros, send chat messages, and a general-purpose `executeCommand` function.
*   **Socket Interface:** Allows external tools or other modules to send commands to this module over a websocket connection.
*   **Basic UI Element:** Adds a sample button in the settings panel (GM only) to test command execution.

## Installation and Enabling

1.  Copy the `command-integration` folder (or whatever you've named this module, e.g., `foundryvtt-command-integration`) into your Foundry VTT `Data/modules/` directory.
2.  Launch Foundry VTT.
3.  Enable the "Command Integration Tool" module in your world's module management settings.

## JavaScript API Usage

Once the module is enabled, you can access its API via the `game` object:

```javascript
const cmdApi = game.modules.get('command-integration')?.api;

if (cmdApi) {
  // Example: Execute a macro named 'MyTestMacro'
  await cmdApi.executeMacro('MyTestMacro');

  // Example: Send an OOC chat message
  await cmdApi.sendMessage('Hello from another module!');

  // Example: Send a whisper message to GMs
  const gmUsers = game.users.filter(u => u.isGM);
  await cmdApi.sendMessage('This is a secret whisper.', {
    type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
    whisper: gmUsers.map(gm => gm.id)
  });

  // Example: Using the central command handler
  await cmdApi.executeCommand({
    action: 'executeMacro',
    target: 'MyOtherMacro'
  });

  await cmdApi.executeCommand({
    action: 'sendMessage',
    message: 'A centrally dispatched message!',
    options: { type: CONST.CHAT_MESSAGE_TYPES.IC }
  });
}
```

### API Functions

*   `executeMacro(macroNameOrId: string): Promise<boolean>`: Executes a macro by its name or ID. Returns `true` if the execution was attempted.
*   `sendMessage(messageContent: string, options: object = {}): Promise<boolean>`: Sends a chat message. `options` can include any valid properties for `ChatMessage.create()`, like `type`, `speaker`, `whisper`, etc. Returns `true` if the message was sent.
*   `executeCommand(commandObject: object): Promise<boolean>`: The central command handler. See "Command Object Structure" below. Returns `true` if the command was recognized and attempted.

## Command Object Structure for `executeCommand`

The `commandObject` should have at least an `action` property.

### `executeMacro`

*   `action`: `"executeMacro"`
*   `target`: (string) The name or ID of the macro to execute.

Example:
```json
{
  "action": "executeMacro",
  "target": "NameOrIdOfMacro"
}
```

### `sendMessage`

*   `action`: `"sendMessage"`
*   `message`: (string) The content of the chat message.
*   `options`: (object, optional) An object containing additional parameters for `ChatMessage.create()` (e.g., `type`, `speaker`, `whisper`).

Example:
```json
{
  "action": "sendMessage",
  "message": "Hello world!",
  "options": {
    "type": "ooc",
    "speaker": { "alias": "My Tool" }
  }
}
```

## Socket Interface Usage

The module listens for socket events that can trigger commands.

*   **Event Name**: `module.command-integration.command`
*   **Data Structure**: The data sent with the socket event should be a JSON object matching the "Command Object Structure" described above for `executeCommand`.

Example (client-side JavaScript to emit a socket event):
```javascript
const commandData = {
  action: 'executeMacro',
  target: 'SomeMacroFromSocket',
  // You can add other properties like sender, timestamp if needed by your logic
  // but they are not directly used by executeCommand unless mapped
};

if (game.socket) {
  game.socket.emit('module.command-integration.command', commandData);
}
```
The `handleSocketCommand` function in the module will attempt to process this data using `executeCommand`.

## Development

This module is a basic example and can be extended:
*   Add more actions to `executeCommand`.
*   Enhance the UI elements.
*   Implement more sophisticated error handling or command queuing.
