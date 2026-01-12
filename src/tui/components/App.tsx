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

interface Message {
  type: 'info' | 'success' | 'error' | 'warning';
  content: string;
}

export const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileManager] = useState(() => new FileManager(process.cwd()));
  const [aiService, setAiService] = useState<AIService | null>(null);

  useEffect(() => {
    initializeAI();
  }, []);

  const addMessage = (type: Message['type'], content: string) => {
    setMessages((prev) => [...prev, { type, content }]);
  };

  const initializeAI = async () => {
    try {
      const configManager = new ConfigManager();
      const config = await configManager.getConfig();

      if (config.url && config.api && config.model) {
        const service = new AIService(config);
        setAiService(service);
        addMessage('info', 'AI service initialized');
      } else {
        addMessage('warning', 'AI not configured');
      }
    } catch (error) {
      addMessage('warning', 'Failed to initialize AI service');
    }
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
      addMessage('error', 'Invalid command format. Use /add:TYPE description');
      addMessage('info', 'Valid types: feat, todo, bug, refact');
      return;
    }

    if (parsed.action !== 'add') {
      addMessage('error', 'Only /add command is supported in TUI mode');
      return;
    }

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

    await createIssue(type, parsed.description);
  };

  const createIssue = async (type: IssueType, description: string) => {
    if (!description.trim()) {
      addMessage('error', 'Description cannot be empty');
      return;
    }

    // Generate title
    let title: string;
    if (aiService) {
      addMessage('info', 'Generating title with AI...');
      try {
        const result = await aiService.generateTitle(description);
        if (result.success && result.title) {
          title = result.title;
          addMessage('success', `Generated title: ${title}`);
        } else {
          addMessage('warning', 'AI generation failed, using fallback');
          title = `Issue-${getTimestamp()}`;
        }
      } catch (error) {
        addMessage('warning', 'AI service error, using fallback title');
        title = `Issue-${getTimestamp()}`;
      }
    } else {
      addMessage('warning', 'AI not configured, using fallback title');
      title = `Issue-${getTimestamp()}`;
    }

    // Create issue
    const result = await fileManager.createIssue(title, type, description);

    if (result.success) {
      addMessage('success', `Issue #${result.issue?.number} created: ${result.issue?.title}`);
      addMessage('info', `File: ${result.filePath}`);
    } else {
      addMessage('error', `Failed to create issue: ${result.error}`);
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