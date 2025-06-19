// CONSTANTS
const SOCKET_EVENT_NAME = 'module.command-integration.command';

// --- CORE API FUNCTIONS ---
/**
 * Executes a Foundry VTT macro by its name or ID.
 * @param {string} macroNameOrId - The name or ID of the macro to execute.
 * @returns {Promise<boolean>} True if execution was attempted and believed to succeed, false otherwise.
 */
async function executeFoundryMacro(macroNameOrId) {
  if (!game.macros) {
    console.error('Command Integration | Macros collection is not available.');
    return false;
  }

  let targetMacro = game.macros.getName(macroNameOrId);
  if (!targetMacro) {
    targetMacro = game.macros.get(macroNameOrId);
  }

  if (targetMacro) {
    console.log(`Command Integration | Executing macro: ${targetMacro.name} (ID: ${targetMacro.id})`);
    try {
      await targetMacro.execute(); // Macro.execute can be async
      console.log(`Command Integration | Macro ${targetMacro.name} executed successfully.`);
      return true;
    } catch (err) {
      console.error(`Command Integration | Error executing macro ${targetMacro.name}:`, err);
      return false;
    }
  } else {
    console.warn(`Command Integration | Macro "${macroNameOrId}" not found.`);
    return false;
  }
}

/**
 * Sends a chat message in Foundry VTT.
 * @param {string} messageContent - The HTML content of the message to send.
 * @param {object} [options={}] - Additional options for ChatMessage.create (e.g., speaker, whisper, type).
 * @returns {Promise<boolean>} True if the message was successfully created, false otherwise.
 */
async function sendFoundryChatMessage(messageContent, options = {}) {
  if (!game.messages) {
    console.error('Command Integration | ChatMessages collection is not available.');
    return false;
  }

  const defaultOptions = {
    user: game.user.id,
    speaker: ChatMessage.getSpeaker(),
    type: CONST.CHAT_MESSAGE_TYPES.OOC
  };

  const chatData = { ...defaultOptions, content: messageContent, ...options };

  try {
    console.log(`Command Integration | Sending chat message: "${messageContent}" with options:`, chatData);
    await ChatMessage.create(chatData); // ChatMessage.create is async
    console.log(`Command Integration | Chat message sent successfully.`);
    return true;
  } catch (error) {
    console.error(`Command Integration | Error sending chat message:`, error);
    return false;
  }
}

// --- CENTRAL COMMAND HANDLER ---
/**
 * Executes a structured command object.
 * The commandObject should have an 'action' property defining what to do.
 * Supported actions:
 *  - 'executeMacro': Requires 'target' (macro name/ID).
 *  - 'sendMessage': Requires 'message' (string) and optional 'options' (object).
 *  - 'ping': No other parameters required. Logs a ping and sends a confirmation chat message.
 * @param {object} commandObject - The command object.
 * @param {string} commandObject.action - The action to perform (e.g., "executeMacro", "sendMessage", "ping").
 * @param {string} [commandObject.target] - The target for the action (e.g., macro name/ID for "executeMacro").
 * @param {string} [commandObject.message] - The message content for "sendMessage".
 * @param {object} [commandObject.options] - Additional options for the action (e.g., chat message options).
 * @param {*} [commandObject.payload] - Optional payload for actions like 'ping'.
 * @returns {Promise<boolean>} True if the command was recognized and attempted successfully, false otherwise.
 * @example
 * // To run a macro
 * executeCommand({ action: 'executeMacro', target: 'MyMacroName' });
 * // To send a chat message
 * executeCommand({ action: 'sendMessage', message: 'Hello!', options: { type: CONST.CHAT_MESSAGE_TYPES.OOC } });
 * // To ping the module
 * executeCommand({ action: 'ping', payload: 'Optional payload from client' });
 */
async function executeCommand(commandObject) {
  if (!commandObject || typeof commandObject !== 'object' || !commandObject.action) {
    console.error('Command Integration | executeCommand: Invalid command object received.', commandObject);
    return false;
  }

  console.log('Command Integration | executeCommand received:', commandObject);

  switch (commandObject.action) {
    case 'executeMacro':
      if (!commandObject.target) {
        console.error('Command Integration | executeCommand: "executeMacro" action requires a "target" (macro name or ID).', commandObject);
        return false;
      }
      return await executeFoundryMacro(commandObject.target);

    case 'sendMessage':
      if (typeof commandObject.message !== 'string') {
        console.error('Command Integration | executeCommand: "sendMessage" action requires a "message" string.', commandObject);
        return false;
      }
      return await sendFoundryChatMessage(commandObject.message, commandObject.options || {});

    case 'ping': // New action
      console.log('Command Integration | executeCommand: Received ping.', commandObject.payload ? `Payload: ${JSON.stringify(commandObject.payload)}` : '');
      // For now, send a general chat message as acknowledgement.
      // A true "pong" back to the specific client would require more complex client tracking.
      await sendFoundryChatMessage('Ping acknowledged by Command Integration module!', {
        speaker: ChatMessage.getSpeaker({ alias: 'Command Integration Module' }),
        type: CONST.CHAT_MESSAGE_TYPES.OOC
      });
      return true; // Indicate ping was processed

    // Example for future expansion:
    // case 'updateActor':
    //   if (!commandObject.target || !commandObject.data) {
    //     console.error('Command Integration | executeCommand: "updateActor" action requires "target" (actor ID) and "data".', commandObject);
    //     return false;
    //   }
    //   // const actor = game.actors.get(commandObject.target);
    //   // if (actor) {
    //   //   await actor.update(commandObject.data);
    //   //   return true;
    //   // }
    //   // return false;
    //   console.log('Command Integration | executeCommand: "updateActor" action is a placeholder.');
    //   return false;

    default:
      console.warn(`Command Integration | executeCommand: Unknown action "${commandObject.action}".`, commandObject);
      return false;
  }
}

// --- SOCKET HANDLER ---
async function handleSocketCommand(data) {
  console.log('Command Integration | Socket event received:', data);

  if (data && typeof data === 'object' && data.action) {
    // Transform data into a commandObject.
    const commandObject = {
        action: data.action,
        target: data.target || data.macroName, // Accommodate old 'macroName' or new 'target'
        message: data.message,
        options: data.options,
        // Add any other relevant properties from data to commandObject
    };

    // Filter out undefined properties to keep commandObject clean
    for (let key in commandObject) {
        if (commandObject[key] === undefined) {
            delete commandObject[key];
        }
    }

    await executeCommand(commandObject);
  } else {
    console.warn('Command Integration | Socket: Received malformed data or data without an action specified:', data);
  }
}

// --- FOUNDRY HOOKS ---
Hooks.once('init', () => {
  /**
   * @typedef {object} CommandIntegrationApi
   * @property {function(string): Promise<boolean>} executeMacro - Executes a Foundry VTT macro by its name or ID.
   * @property {function(string, object=): Promise<boolean>} sendMessage - Sends a chat message with specified content and options.
   * @property {function(object): Promise<boolean>} executeCommand - Executes a structured command object (e.g., for macros, messages).
   */
  /**
   * Public API for the Command Integration module.
   * @type {CommandIntegrationApi}
   */
  game.modules.get('command-integration').api = {
    executeMacro: executeFoundryMacro,
    sendMessage: sendFoundryChatMessage,
    executeCommand: executeCommand      // Expose the new central command handler
  };
  console.log('Command Integration | Module API initialized with executeMacro, sendMessage, and executeCommand.');
});

Hooks.once('ready', async () => {
  console.log('Command Integration | Module Ready');

  // --- Original Macro and Chat Message Exploration (can be removed or adapted to use executeCommand for testing) ---
  try {
    const macros = game.macros;
    if (macros && macros.size > 0) {
      // console.log('Command Integration | Available Macros:');
      // macros.forEach(macro => console.log(`Command Integration | - ID: ${macro.id}, Name: ${macro.name}, Type: ${macro.type}`));
      const macroNameToExecute = 'TestMacro'; // Ensure this macro exists
      const testMacro = macros.getName(macroNameToExecute);
      if (testMacro) {
        // console.log(`Command Integration | (Ready Hook) Attempting to execute macro: ${macroNameToExecute}`);
        // await executeFoundryMacro(macroNameToExecute); // Or use executeCommand
      } else {
        // console.log(`Command Integration | (Ready Hook) Macro "${macroNameToExecute}" not found.`);
      }
    } else {
      // console.log('Command Integration | (Ready Hook) No macros found.');
    }
  } catch (error) {
    console.error('Command Integration | (Ready Hook) Error during macro exploration:', error);
  }

  try {
    // console.log('Command Integration | (Ready Hook) Attempting to create a chat message.');
    // await sendFoundryChatMessage("Hello from the Command Integration module's ready hook!"); // Or use executeCommand
  } catch (error) {
    console.error('Command Integration | (Ready Hook) Error during ChatMessage creation:', error);
  }
  // --- End of Original Exploration ---


  // --- Socket Interface Setup and Test Emissions ---
  try {
    if (game.socket) {
      console.log(`Command Integration | Registering socket event handler for '${SOCKET_EVENT_NAME}'`);
      game.socket.on(SOCKET_EVENT_NAME, handleSocketCommand);

      // Example: Emit a socket event using the new commandObject structure
      const exampleSocketMacroCommand = {
        action: 'executeMacro',
        target: 'TestMacro', // Ensure this macro exists for testing
        comment: 'This is a test command to execute a macro via socket.', // Example of an additional property
        sender: game.user.id, // Optional: good for logging/auditing on the receiving end
        timestamp: Date.now()   // Optional: good for logging/auditing
      };
      console.log('Command Integration | Emitting example socket macro command:', exampleSocketMacroCommand);
      game.socket.emit(SOCKET_EVENT_NAME, exampleSocketMacroCommand);

      const exampleSocketMessageCommand = {
        action: 'sendMessage',
        message: 'Hello from socket emit via new command structure!',
        options: { type: CONST.CHAT_MESSAGE_TYPES.OOC },
        comment: 'This is a test command to send a message via socket.',
        sender: game.user.id,
        timestamp: Date.now()
      };
      console.log('Command Integration | Emitting example socket message command:', exampleSocketMessageCommand);
      game.socket.emit(SOCKET_EVENT_NAME, exampleSocketMessageCommand);

    } else {
      console.warn('Command Integration | Socket not available or not enabled for the module. Ensure "socket": true in module.json.');
    }
  } catch (error) {
    console.error('Command Integration | Error during socket interface setup/test:', error);
  }
  // --- End of Socket Interface ---
});

// --- UI ELEMENT INTEGRATION ---

// This hook is called when the Settings sidebar tab is rendered
Hooks.on('renderSettings', (app, html, data) => {
  // Only add the button if the current user is a GM
  if (!game.user.isGM) {
    return;
  }

  const sectionSelector = 'section[data-tab="modules"]'; // Target the modules section within settings
  let modulesSection = html.find(sectionSelector);

  // If the modules section doesn't exist, create a generic spot or append to a known area
  // For simplicity, let's try to find a common area or just append to the settings list.
  // A more robust solution might create its own section if needed.
  if (modulesSection.length === 0) {
      // Fallback: find the form element and append there, or another prominent settings element
      modulesSection = html.find('form').first();
      if (modulesSection.length === 0) {
          modulesSection = html.find('.sidebar-tab').first(); // Last resort
      }
  }

  // Define the button HTML
  const buttonHtml = `
    <div class="form-group command-integration-ui">
      <label>Command Integration Tool</label>
      <button type="button" id="executeSampleCommandButton">
        <i class="fas fa-terminal"></i> Execute Sample Command
      </button>
      <p class="notes">Click to send a test chat message via the command integration tool.</p>
    </div>
  `;

  // Prepend the button to the modules section or the determined fallback
  // Using .first() if multiple sections are found, though typically there's one modules section
  modulesSection.first().prepend(buttonHtml);

  // Add event listener to the new button
  html.find('#executeSampleCommandButton').on('click', async (event) => {
    event.preventDefault();
    console.log('Command Integration | Sample Command Button Clicked');

    if (game.modules.get('command-integration')?.api?.executeCommand) {
      const sampleCommand = {
        action: 'sendMessage',
        message: 'Hello from the UI! This command was triggered by a button click.',
        options: {
          speaker: ChatMessage.getSpeaker({ alias: 'Command Integration UI' })
        }
      };
      await game.modules.get('command-integration').api.executeCommand(sampleCommand);
      ui.notifications.info("Command Integration: Sample command executed!");
    } else {
      console.error('Command Integration | executeCommand API not available when button clicked.');
      ui.notifications.error("Command Integration: API not available.");
    }
  });

  console.log('Command Integration | Added UI elements to settings tab.');
});

console.log('Command Integration | main.js loaded');
