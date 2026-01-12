/**
 * Messages Component
 * Displays system messages and output
 */

import React from 'react';
import { Box, Text } from 'ink';

interface Message {
  type: 'info' | 'success' | 'error' | 'warning';
  content: string;
}

interface MessagesProps {
  messages: Message[];
}

export const Messages: React.FC<MessagesProps> = ({ messages }) => {
  const getColor = (type: Message['type']): string => {
    switch (type) {
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'warning':
        return 'yellow';
      case 'info':
      default:
        return 'blue';
    }
  };

  const getIcon = (type: Message['type']): string => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <Box flexDirection="column" paddingY={1}>
      {messages.map((message, index) => (
        <Box key={index}>
          <Text color={getColor(message.type)} bold>
            {getIcon(message.type)}{' '}
          </Text>
          <Text color={getColor(message.type)}>{message.content}</Text>
        </Box>
      ))}
    </Box>
  );
};