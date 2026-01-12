/**
 * CommandPrompt Component
 * Displays available commands and help information
 */

import React from 'react';
import { Box, Text } from 'ink';

export const CommandPrompt: React.FC = () => {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Text bold color="yellow">Available commands:</Text>
      <Box flexDirection="column" paddingLeft={2}>
        <Text color="cyan">/init</Text>
        <Text> - Initialize configuration</Text>
        <Text color="green">/add:feat</Text>
        <Text> - Add a new feature issue</Text>
        <Text color="green">/add:todo</Text>
        <Text> - Add a new todo issue</Text>
        <Text color="green">/add:bug</Text>
        <Text> - Add a new bug issue</Text>
        <Text color="green">/add:refact</Text>
        <Text> - Add a new refactor issue</Text>
        <Text color="blue">/open &lt;number|title&gt;</Text>
        <Text> - Open an issue to work on</Text>
        <Text color="magenta">/close &lt;number|title&gt;</Text>
        <Text> - Close and archive an issue</Text>
        <Text color="red">/exit</Text>
        <Text> - Exit TUI</Text>
      </Box>
    </Box>
  );
};