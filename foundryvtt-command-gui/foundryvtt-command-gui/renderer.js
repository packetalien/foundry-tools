// foundryvtt-command-gui/foundryvtt-command-gui/renderer.js
document.addEventListener('DOMContentLoaded', () => {
    const wsAddressInput = document.getElementById('wsAddress');
    const connectButton = document.getElementById('connectButton');
    const disconnectButton = document.getElementById('disconnectButton');
    const statusText = document.getElementById('statusText');
    const sendTestCommandButton = document.getElementById('sendTestCommandButton');
    const logOutput = document.getElementById('logOutput');

    let socket = null;

    function logMessage(message, type = 'info') {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        p.className = type;

        if (logOutput.firstChild && logOutput.firstChild.textContent === 'GUI actions and responses will appear here...') {
            logOutput.innerHTML = '';
        }
        logOutput.prepend(p);
    }

    function updateUIForConnectionState(isConnected) {
        if (isConnected) {
            statusText.textContent = 'Connected';
            statusText.className = 'connected';
            connectButton.disabled = true;
            disconnectButton.disabled = false;
            sendTestCommandButton.disabled = false;
            wsAddressInput.disabled = true;
        } else {
            connectButton.disabled = false;
            disconnectButton.disabled = true;
            sendTestCommandButton.disabled = true;
            wsAddressInput.disabled = false;
            if (socket && socket.readyState === WebSocket.CLOSED) {
                if (statusText.textContent !== 'Error') {
                    statusText.textContent = 'Disconnected';
                    statusText.className = 'disconnected';
                }
            } else if (!socket) {
                statusText.textContent = 'Disconnected';
                statusText.className = 'disconnected';
            }
        }
    }

    connectButton.addEventListener('click', () => {
        const address = wsAddressInput.value;
        if (!address) {
            logMessage('WebSocket address cannot be empty.', 'error');
            alert('WebSocket address cannot be empty.');
            return;
        }

        logMessage(`Attempting to connect to ${address}...`);
        statusText.textContent = 'Connecting...';
        statusText.className = '';

        try {
            socket = new WebSocket(address);
        } catch (error) {
            logMessage(`Error creating WebSocket: ${error.message}`, 'error');
            statusText.textContent = 'Error';
            statusText.className = 'error';
            updateUIForConnectionState(false);
            socket = null;
            return;
        }

        socket.onopen = () => {
            logMessage('Connected to WebSocket server.', 'success');
            updateUIForConnectionState(true);
        };

        socket.onmessage = (event) => {
            logMessage(`Received: ${event.data}`);
        };

        socket.onerror = (error) => {
            logMessage(`WebSocket Error: ${error.message || 'Unknown error. Check console.'}`, 'error');
            console.error('WebSocket Error:', error);
            statusText.textContent = 'Error';
            statusText.className = 'error';
        };

        socket.onclose = (event) => {
            logMessage(`Disconnected from WebSocket server. Code: ${event.code}, Reason: "${event.reason || 'No reason given'}"`, event.wasClean ? 'info' : 'error');
            if (statusText.textContent !== 'Error') {
                 statusText.textContent = 'Disconnected';
                 statusText.className = 'disconnected';
            }
            updateUIForConnectionState(false);
            socket = null;
        };
    });

    disconnectButton.addEventListener('click', () => {
        if (socket) {
            logMessage('Disconnecting from WebSocket server...');
            socket.close();
        }
    });

    // Add event listener for the Send Test Command button
    sendTestCommandButton.addEventListener('click', () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            const testCommand = {
                action: 'sendMessage', // Using the 'sendMessage' action defined in the Foundry module
                message: 'Test command from External GUI!',
                options: {
                    speaker: { alias: 'Electron GUI' }
                }
                // Future: Could add a 'ping' action to the Foundry module and use that here.
                // action: 'ping',
                // payload: 'Hello from Electron GUI - Ping!'
            };

            try {
                const commandString = JSON.stringify(testCommand);
                socket.send(commandString);
                logMessage(`Sent Test Command: ${commandString}`, 'info');
            } catch (error) {
                logMessage(`Error sending test command: ${error.message}`, 'error');
                console.error('Error sending test command:', error);
            }
        } else {
            logMessage('Cannot send command: WebSocket is not connected.', 'error');
            alert('WebSocket is not connected. Please connect first.');
        }
    });

    updateUIForConnectionState(false);
    logMessage("Renderer process initialized and UI event listeners attached.");
});
