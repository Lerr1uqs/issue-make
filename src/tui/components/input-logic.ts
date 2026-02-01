// Command completion logic extracted for testability

export const AVAILABLE_COMMANDS = [
  '/init',
  '/add:feat',
  '/add:todo',
  '/add:bug',
  '/add:refact',
  '/open',
  '/close',
  '/list',
  '/exit',
  '/quit',
];

export function getMatchingCommands(value: string): string[] {
  if (!value.startsWith('/')) {
    return [];
  }

  const matches = AVAILABLE_COMMANDS.filter(cmd =>
    cmd.toLowerCase().startsWith(value.toLowerCase())
  );

  return matches.sort((a, b) => {
    const aExact = a.toLowerCase() === value.toLowerCase();
    const bExact = b.toLowerCase() === value.toLowerCase();

    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.length - b.length;
  });
}

export function getCompletionPreview(value: string, command: string): string {
  if (!value || !command.startsWith(value)) {
    return '';
  }
  return command.slice(value.length);
}

export function getNextSelectedIndex(
  currentIndex: number,
  direction: 'up' | 'down',
  total: number
): number {
  if (total <= 0) {
    return 0;
  }

  if (direction === 'up') {
    return Math.max(0, currentIndex - 1);
  }
  return Math.min(total - 1, currentIndex + 1);
}
