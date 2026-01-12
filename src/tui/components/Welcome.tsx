/**
 * Welcome Component
 * Displays welcome message and header
 */

import React from 'react';
import { Box, Text } from 'ink';

export const Welcome: React.FC = () => {
  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={2}>
        <Text bold color="cyan">
          Issue-Make TUI v1.0.0
        </Text>
      </Box>
    </Box>
  );
};