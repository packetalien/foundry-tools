# Foundry VTT Command GUI (Electron)

## Purpose

This application is a simple desktop GUI built with Electron to send commands to a running Foundry Virtual Tabletop instance. It connects to the `foundryvtt-command-integration` module (or a similarly compatible WebSocket endpoint) running in Foundry VTT.

Its primary purpose is to demonstrate how an external application can interact with Foundry VTT via WebSockets.

## Features

*   Connect to a specified WebSocket address.
*   Display connection status (Connected, Disconnected, Error).
*   Send a predefined test command (sends a chat message within Foundry VTT via the integration module).
*   Log basic actions and received messages within the GUI.
*   Can be packaged for Windows.

## Development Setup

1.  **Prerequisites:**
    *   Node.js and npm installed.
    *   Git (for cloning, if applicable).
    *   A running Foundry VTT instance with the `foundryvtt-command-integration` module installed and enabled. (The module listens on a WebSocket, typically accessible if Foundry is running).

2.  **Clone the Repository (if applicable):**
    If you have this project in a Git repository, clone it. Otherwise, ensure you have the project files.

3.  **Navigate to the Project Directory:**
    Open your terminal and change to the directory containing this Electron app's `package.json` (e.g., `cd path/to/foundryvtt-command-gui/foundryvtt-command-gui`).

4.  **Install Dependencies:**
    ```bash
    npm install
    ```
    This will install Electron and other dependencies listed in `package.json`.

5.  **Run the Application (Development Mode):**
    ```bash
    npm start
    ```
    This will launch the Electron application. The developer tools might open automatically.

## How to Use

1.  **Ensure Foundry VTT is Running:** Make sure your Foundry VTT world is active and the `foundryvtt-command-integration` module (or equivalent WebSocket server) is running.
2.  **Launch the GUI:** Run `npm start` from the project directory if in development, or run the packaged executable.
3.  **Enter WebSocket Address:**
    *   The default address for the `foundryvtt-command-integration` module is usually `ws://localhost:30000` (Foundry's default port).
    *   If your Foundry instance is on a different machine or port, or if the module uses a different path/port for its WebSocket, update the address in the input field.
4.  **Connect:** Click the "Connect" button.
    *   The status indicator should change to "Connecting..." and then "Connected" if successful.
    *   Check the log area in the GUI and the Foundry VTT console for messages.
5.  **Send Test Command:** Once connected, click the "Send Test Command" button.
    *   This will send a predefined command to the Foundry module. By default, this command makes the Foundry module send a chat message: "Test command from External GUI!" attributed to "Electron GUI".
    *   Check the chat log in Foundry VTT for this message.
    *   The GUI's log area will show the command that was sent.
6.  **Disconnect:** Click the "Disconnect" button to close the WebSocket connection.

## Building for Distribution (Windows)

To package the application into a distributable format (e.g., an installer or a portable `.exe`) for Windows:

1.  **Navigate to the Project Directory** (where `package.json` is located).
2.  **Run the Build Script:**
    ```bash
    npm run build
    ```
3.  This command uses `electron-builder` to create the packaged application. The output will be in the `dist` folder within the project directory.

## Notes

*   This is a basic example application.
*   Error handling is minimal.
*   The "Send Test Command" is hardcoded. Future improvements could allow for more dynamic command input.
*   Ensure the WebSocket endpoint in Foundry VTT is accessible from the machine running this GUI. If Foundry is on a different machine, use its IP address instead of `localhost`.
