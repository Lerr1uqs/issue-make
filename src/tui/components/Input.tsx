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
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [historyDraft, setHistoryDraft] = useState('');
  const [cursorIndex, setCursorIndex] = useState(0);

  // Filter and sort commands based on input
  const filteredCommands = useMemo(() => getMatchingCommands(value), [value]);

  useInput((input: string, key: any) => {
    const clearHistoryNavigation = () => {
      if (historyIndex !== null) {
        setHistoryIndex(null);
        setHistoryDraft('');
      }
    };

    const deleteWordBeforeCursor = (
      current: string,
      cursor: number
    ): { value: string; cursor: number } => {
      if (!current || cursor <= 0) {
        return { value: current, cursor: Math.max(cursor, 0) };
      }
      let index = cursor - 1;
      while (index >= 0 && /\s/.test(current[index])) {
        index -= 1;
      }
      while (index >= 0 && !/\s/.test(current[index])) {
        index -= 1;
      }
      const newCursor = Math.max(index + 1, 0);
      return {
        value: current.slice(0, newCursor) + current.slice(cursor),
        cursor: newCursor,
      };
    };

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
          clearHistoryNavigation();
          const completedValue = selectedCommand.endsWith(' ')
            ? selectedCommand
            : `${selectedCommand} `;
          setValue(completedValue);
          setCursorIndex(completedValue.length);
          setShowCompletion(false);
          setSelectedIndex(0);
        }
        return;
      }
      if (key.return) {
        const selectedCommand = filteredCommands[selectedIndex];
        if (selectedCommand) {
          clearHistoryNavigation();
          const completedValue = selectedCommand.endsWith(' ')
            ? selectedCommand
            : `${selectedCommand} `;
          setValue(completedValue);
          setCursorIndex(completedValue.length);
          setShowCompletion(false);
          setSelectedIndex(0);
        }
        return;
      }
    }

    // Handle history navigation when completion is not shown
    if (!showCompletion && (key.upArrow || key.downArrow)) {
      if (history.length === 0) {
        return;
      }

      if (key.upArrow) {
        if (historyIndex === null) {
          setHistoryDraft(value);
          const newIndex = history.length - 1;
          setHistoryIndex(newIndex);
          setValue(history[newIndex]);
          setCursorIndex(history[newIndex].length);
        } else {
          const newIndex = Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setValue(history[newIndex]);
          setCursorIndex(history[newIndex].length);
        }
        setShowCompletion(false);
        setSelectedIndex(0);
        return;
      }

      if (key.downArrow) {
        if (historyIndex === null) {
          return;
        }
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(null);
          setValue(historyDraft);
          setCursorIndex(historyDraft.length);
          setShowCompletion(historyDraft.startsWith('/'));
          setHistoryDraft('');
        } else {
          setHistoryIndex(newIndex);
          setValue(history[newIndex]);
          setCursorIndex(history[newIndex].length);
          setShowCompletion(false);
        }
        setSelectedIndex(0);
        return;
      }
    }

    if (key.leftArrow) {
      setCursorIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.rightArrow) {
      setCursorIndex((prev) => Math.min(value.length, prev + 1));
      return;
    }

    // Handle regular input
    if (key.return) {
      if (value.trim()) {
        const submitted = value.trim();
        onSubmit(submitted);
        setHistory((prev) => {
          if (prev[prev.length - 1] === submitted) {
            return prev;
          }
          return [...prev, submitted];
        });
        setValue('');
        setCursorIndex(0);
        setShowCompletion(false);
        setSelectedIndex(0);
        setHistoryIndex(null);
        setHistoryDraft('');
      }
    } else if (key.ctrl && input === 'c') {
      process.exit(0);
    } else if (key.ctrl && input.toLowerCase() === 'w') {
      clearHistoryNavigation();
      const { value: newValue, cursor: newCursor } = deleteWordBeforeCursor(
        value,
        cursorIndex
      );
      setValue(newValue);
      setCursorIndex(newCursor);
      setShowCompletion(newValue.startsWith('/'));
      setSelectedIndex(0);
    } else if (key.backspace) {
      clearHistoryNavigation();
      if (cursorIndex === 0) {
        return;
      }
      const newValue = value.slice(0, cursorIndex - 1) + value.slice(cursorIndex);
      setValue(newValue);
      setCursorIndex(cursorIndex - 1);
      // Show completion if still starts with /
      setShowCompletion(newValue.startsWith('/'));
      setSelectedIndex(0);
    } else if (key.delete) {
      clearHistoryNavigation();
      if (cursorIndex >= value.length) {
        return;
      }
      const newValue = value.slice(0, cursorIndex) + value.slice(cursorIndex + 1);
      setValue(newValue);
      setShowCompletion(newValue.startsWith('/'));
      setSelectedIndex(0);
    } else if (input) {
      clearHistoryNavigation();
      const newValue = value.slice(0, cursorIndex) + input + value.slice(cursorIndex);
      setValue(newValue);
      setCursorIndex(cursorIndex + input.length);
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
  const beforeCursor = value.slice(0, cursorIndex);
  const cursorChar = value[cursorIndex] ?? ' ';
  const afterCursor = value.slice(cursorIndex + 1);

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan">{placeholder}</Text>
        <Text>{beforeCursor}</Text>
        <Text inverse>{cursorChar}</Text>
        <Text>{afterCursor}</Text>
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
