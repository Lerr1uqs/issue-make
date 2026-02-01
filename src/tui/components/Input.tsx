/**
 * Input Component
 * Handles user input for commands with auto-completion
 */

import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import {
  getMatchingCommands,
  getNextSelectedIndex,
} from './input-logic.js';

interface InputProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
}

export const Input: React.FC<InputProps> = ({ onSubmit, placeholder = '> ' }) => {
  const [value, setValue] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter and sort commands based on input
  const filteredCommands = useMemo(() => getMatchingCommands(value), [value]);

  useInput((input: string, key: any) => {
    // Handle completion navigation when completion is shown
    if (showCompletion && filteredCommands.length > 0) {
      if (key.upArrow) {
        setSelectedIndex(prev => getNextSelectedIndex(prev, 'up', filteredCommands.length));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex(prev => getNextSelectedIndex(prev, 'down', filteredCommands.length));
        return;
      }
      if (key.tab) {
        const selectedCommand = filteredCommands[selectedIndex];
        if (selectedCommand) {
          setValue(selectedCommand);
          setShowCompletion(false);
          setSelectedIndex(0);
        }
        return;
      }
    }

    // Handle regular input
    if (key.return) {
      if (value.trim()) {
        onSubmit(value.trim());
        setValue('');
        setShowCompletion(false);
        setSelectedIndex(0);
      }
    } else if (key.ctrl && input === 'c') {
      process.exit(0);
    } else if (key.backspace || key.delete) {
      const newValue = value.slice(0, -1);
      setValue(newValue);
      // Show completion if still starts with /
      setShowCompletion(newValue.startsWith('/'));
      setSelectedIndex(0);
    } else if (input) {
      const newValue = value + input;
      setValue(newValue);
      // Show completion if starts with /
      setShowCompletion(newValue.startsWith('/'));
      setSelectedIndex(0);
    }
  });

  // Hide completion if no matches
  if (showCompletion && filteredCommands.length === 0) {
    setShowCompletion(false);
  }

  const selectedCommand = filteredCommands[selectedIndex];

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan">{placeholder}</Text>
        <Text>{value}</Text>
        <Text inverse> </Text>
      </Box>
      {showCompletion && filteredCommands.length > 0 && (
        <Box flexDirection="column" paddingLeft={2}>
          {filteredCommands.map((cmd, index) => (
            <Box key={cmd}>
              <Text color={index === selectedIndex ? 'green' : 'gray'}>
                {index === selectedIndex ? '▶ ' : '  '}
              </Text>
              <Text color={index === selectedIndex ? 'green' : 'white'}>
                {cmd}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
