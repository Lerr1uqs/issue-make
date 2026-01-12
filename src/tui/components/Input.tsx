/**
 * Input Component
 * Handles user input for commands
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface InputProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
}

export const Input: React.FC<InputProps> = ({ onSubmit, placeholder = '> ' }) => {
  const [value, setValue] = useState('');

  useInput((input: string, key: any) => {
    if (key.return) {
      if (value.trim()) {
        onSubmit(value.trim());
        setValue('');
      }
    } else if (key.ctrl && input === 'c') {
      process.exit(0);
    } else if (key.backspace || key.delete) {
      setValue(value.slice(0, -1));
    } else if (input) {
      setValue(value + input);
    }
  });

  return (
    <Box>
      <Text color="cyan">{placeholder}</Text>
      <Text>{value}</Text>
      <Text inverse> </Text>
    </Box>
  );
};