/**
 * App Component
 * Main TUI application component
 */

import React, { useState, useEffect } from 'react';
import { Box, render } from 'ink';
import { Welcome } from './Welcome.js';
import { CommandPrompt } from './CommandPrompt.js';
import { Input } from './Input.js';
import { Messages } from './Messages.js';
import { FileManager } from '../../core/file-manager.js';
import { AIService } from '../../core/ai.js';
import { ConfigManager } from '../../core/config.js';
import { IssueType } from '../../core/types.js';
import { validateIssueType, parseSlashCommand } from '../../utils/validation.js';
import { getTimestamp } from '../../utils/date.js';
import {
  initCommandHandler,
  addCommandHandler,
  openCommandHandler,
  closeCommandHandler,
} from '../handlers/index.js';

interface Message {
  type: 'info' | 'success' | 'error' | 'warning';
  content: string;
}

export const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (type: Message['type'], content: string) => {
    setMessages((prev) => [...prev, { type, content }]);
  };

  const handleCommand = async (input: string) => {
    if (!input.trim()) {
      return;
    }

    const trimmedInput = input.trim();

    // Check for exit command
    if (trimmedInput === '/exit' || trimmedInput === 'exit') {
      addMessage('info', 'Goodbye!');
      setTimeout(() => process.exit(0), 100);
      return;
    }

    // Check for slash command
    if (trimmedInput.startsWith('/')) {
      await handleSlashCommand(trimmedInput);
    } else {
      addMessage('error', 'Invalid command. Use /add:TYPE or /exit');
    }
  };

  const handleSlashCommand = async (command: string) => {
    const parsed = parseSlashCommand(command);

    if (!parsed) {
      // Try to parse as simple command like /init, /open, /close
      if (command === '/init') {
        await handleInitCommand();
        return;
      }

      if (command.startsWith('/open')) {
        const identifier = command.slice(6).trim();
        await handleOpenCommand(identifier);
        return;
      }

      if (command.startsWith('/close')) {
        const identifier = command.slice(7).trim();
        await handleCloseCommand(identifier);
        return;
      }

      addMessage('error', 'Invalid command format. Use /add:TYPE, /init, /open, or /close');
      addMessage('info', 'Valid types: feat, todo, bug, refact');
      return;
    }

    // Handle /add:TYPE command
    if (parsed.action === 'add') {
      const type = validateIssueType(parsed.type);
      if (!type) {
        addMessage('error', `Invalid issue type: ${parsed.type}`);
        addMessage('info', 'Valid types: feat, todo, bug, refact');
        return;
      }

      // Use the description from the command
      if (!parsed.description || parsed.description.trim().length === 0) {
        addMessage('error', 'Description is required. Use /add:TYPE description');
        return;
      }

      await handleAddCommand(type, parsed.description);
    } else {
      addMessage('error', `Unsupported command: ${parsed.action}`);
      addMessage('info', 'Supported commands: /add:TYPE, /init, /open, /close');
    }
  };

  const handleInitCommand = async () => {
    addMessage('info', 'Initializing configuration...');
    const result = await initCommandHandler();

    if (result.success) {
      addMessage('success', 'Configuration initialized successfully');
      addMessage('info', `Config file: ${result.configPath}`);
    } else {
      addMessage('error', `Failed to initialize configuration: ${result.error}`);
    }
  };

  const handleAddCommand = async (type: IssueType, description: string) => {
    const result = await addCommandHandler(type, description, process.cwd());

    if (result.success) {
      addMessage('success', `Issue #${result.issue?.number} created: ${result.issue?.title}`);
      addMessage('info', `Type: ${result.issue?.type}`);
      addMessage('info', `File: ${result.filePath}`);
    } else {
      addMessage('error', `Failed to create issue: ${result.error}`);
    }
  };

  const handleOpenCommand = async (identifier: string) => {
    if (!identifier) {
      addMessage('error', 'Please provide an issue identifier. Use /open <number|title>');
      return;
    }

    addMessage('info', `Opening issue: ${identifier}...`);
    const result = await openCommandHandler(identifier, process.cwd());

    if (result.success) {
      addMessage('success', `Issue #${result.issue?.number} opened successfully`);
      addMessage('info', `Title: ${result.issue?.title}`);
      addMessage('info', `Type: ${result.issue?.type}`);
      addMessage('info', `Solution file: ${result.solutionPath}`);
      addMessage('info', `AGENTS.md: ${result.agentsPath}`);
    } else {
      addMessage('error', `Failed to open issue: ${result.error}`);
    }
  };

  const handleCloseCommand = async (identifier: string) => {
    if (!identifier) {
      addMessage('error', 'Please provide an issue identifier. Use /close <number|title>');
      return;
    }

    addMessage('info', `Closing issue: ${identifier}...`);
    const result = await closeCommandHandler(identifier, process.cwd());

    if (result.success) {
      addMessage('success', 'Issue closed successfully');
      addMessage('info', `Archived: ${result.archivedPath}`);
      addMessage('info', `AGENTS.md cleaned: ${result.agentsPath}`);
    } else {
      addMessage('error', `Failed to close issue: ${result.error}`);
      if (result.error?.includes('Solution file not found')) {
        addMessage('warning', 'Hint: Please create solution.md first or ask your agent to create it');
      }
    }
  };

  

  return (
    <Box flexDirection="column">
      <Welcome />
      <CommandPrompt />
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Messages messages={messages} />
      </Box>
      <Input onSubmit={handleCommand} placeholder="> " />
    </Box>
  );
};

/**
 * Start the TUI application
 */
export const startTUI = () => {
  render(<App />);
};