# Testing Guide for Command Integration Module

This guide outlines the steps to manually test the Command Integration module in a Foundry VTT environment.

## Prerequisites

1.  **Foundry VTT Instance:** You need a working Foundry VTT setup.
2.  **Module Installation:**
    *   Copy the `foundryvtt-command-integration` (or your module's directory name) into your Foundry VTT `Data/modules/` directory.
    *   Launch Foundry VTT.
3.  **Enable Module:** In your chosen world, go to "Game Settings" (gear icon) -> "Manage Modules" and enable the "Command Integration Tool" module.
4.  **GM User:** Log in as a Game Master (GM) user to access all testing features (like the settings panel button).

## I. Testing Setup

1.  **Open Browser Developer Console:** Press F12 in your browser to open the developer console. This will be useful for observing module logs and running API commands. Module logs are prefixed with "Command Integration |".
2.  **Create a Test Macro (Script Macro):**
    *   Go to the "Macros" tab in the sidebar.
    *   Click "Create Macro".
    *   Name it `TestMacro`.
    *   Set its type to "Script".
    *   In the command box, enter: `console.log("Command Integration | TestMacro executed successfully!"); ui.notifications.info("TestMacro executed!");`
    *   Click "Save Macro".

## II. Test Cases

### 1. Test UI Button (Settings Panel)

*   **Action:**
    1.  Go to the "Game Settings" sidebar tab (gear icon).
    2.  Look for the "Command Integration Tool" section and button.
    3.  Click the "Execute Sample Command" button.
*   **Expected Outcome:**
    *   A chat message appears in the chat log: "Hello from the UI! This command was triggered by a button click." (or similar, sent by "Command Integration UI").
    *   A notification "Command Integration: Sample command executed!" appears.
    *   Console logs from the module indicating the button click and command execution.

### 2. Test Macro Execution via API

*   **Action:**
    1.  In the browser developer console, paste and run:
        ```javascript
        game.modules.get('command-integration').api.executeCommand({ action: 'executeMacro', target: 'TestMacro' });
        ```
    2.  Alternatively, to test the direct function:
        ```javascript
        game.modules.get('command-integration').api.executeMacro('TestMacro');
        ```
*   **Expected Outcome:**
    *   The `TestMacro`'s effects occur: a console message "Command Integration | TestMacro executed successfully!" and a UI notification "TestMacro executed!".
    *   Module console logs indicating the `executeCommand` or `executeMacro` call and successful execution.

### 3. Test Chat Message Creation via API

*   **Action:**
    1.  In the browser developer console, paste and run:
        ```javascript
        game.modules.get('command-integration').api.executeCommand({ action: 'sendMessage', message: 'API Test Message', options: { speaker: { alias: 'API Tester' } } });
        ```
    2.  Alternatively, to test the direct function:
        ```javascript
        game.modules.get('command-integration').api.sendMessage('Direct API Test Message', { speaker: { alias: 'Direct API Tester' } });
        ```
*   **Expected Outcome:**
    *   The specified chat messages appear in the chat log, attributed to "API Tester" or "Direct API Tester".
    *   Module console logs indicating the `executeCommand` or `sendMessage` call and successful message sending.

### 4. Test Socket Interface

*   **Action:**
    1.  In the browser developer console, paste and run the following to simulate an incoming socket event:
        ```javascript
        const socketCommand = {
          action: 'executeMacro',
          target: 'TestMacro',
          source: 'Test Script in Console'
        };
        game.socket.emit('module.command-integration.command', socketCommand);
        ```
    2.  Then, test sending a chat message via socket:
        ```javascript
        const socketMessageCommand = {
          action: 'sendMessage',
          message: 'Hello from a socket event!',
          options: { speaker: { alias: 'Socket Event' } },
          source: 'Test Script in Console'
        };
        game.socket.emit('module.command-integration.command', socketMessageCommand);
        ```
*   **Expected Outcome:**
    *   For the `executeMacro` socket command:
        *   The `TestMacro`'s effects occur (console log and UI notification).
        *   Module console logs indicating:
            *   "Socket event received".
            *   "executeCommand received" with the command details.
            *   Successful macro execution.
    *   For the `sendMessage` socket command:
        *   A chat message "Hello from a socket event!" (attributed to "Socket Event") appears in the chat log.
        *   Module console logs indicating:
            *   "Socket event received".
            *   "executeCommand received" with the command details.
            *   Successful message sending.

### 5. Test API Function Availability

*   **Action:**
    1.  In the browser developer console, type `game.modules.get('command-integration').api` and press Enter.
*   **Expected Outcome:**
    *   The console displays an object containing the keys: `executeMacro`, `sendMessage`, and `executeCommand`, along with their function definitions.
    *   The console log from the `init` hook: "Command Integration | Module API initialized with executeMacro, sendMessage, and executeCommand." should be visible from when the world loaded.

## III. Observing Logs

Throughout testing, keep an eye on the browser's developer console for logs prefixed with `Command Integration |`. These logs provide insight into the module's operations and can help diagnose issues.
The `Hooks.once('ready', ...)` block in `main.js` also emits some example socket events when the world loads. You should see logs related to these in the console on startup, potentially attempting to execute `TestMacro` if it exists at that point.
