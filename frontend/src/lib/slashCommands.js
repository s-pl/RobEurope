/**
 * Slash command registry for the messaging system.
 */

export const SLASH_COMMANDS = [
  { name: '/help',      description: 'Show available commands',  type: 'local' },
  { name: '/shrug',     description: 'Append ¯\\_(ツ)_/¯',        type: 'replace', value: '¯\\_(ツ)_/¯' },
  { name: '/tableflip', description: 'Flip the table',           type: 'replace', value: '(ノ°Д°)ノ︵ ┻━┻' },
  { name: '/unflip',    description: 'Put the table back',       type: 'replace', value: '┬─┬ノ( º _ ºノ)' },
  { name: '/lenny',     description: 'Append lenny face',        type: 'replace', value: '( ͡° ͜ʖ ͡°)' },
  { name: '/me',        description: 'Send as action',           type: 'action' },
  { name: '/ai',        description: 'Ask AI a question',        type: 'backend' },
];

export const HELP_TEXT = `Available commands:\n${SLASH_COMMANDS.map(c => `${c.name} — ${c.description}`).join('\n')}`;

/**
 * Parse a slash command from input text.
 * Returns { type, text, args } or null if not a slash command.
 */
export function parseSlashCommand(input, username = 'User') {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  const spaceIdx = trimmed.indexOf(' ');
  const cmd = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const args = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1).trim();

  const command = SLASH_COMMANDS.find(c => c.name === cmd.toLowerCase());
  if (!command) return null;

  switch (command.type) {
    case 'local':
      return { type: 'local', text: HELP_TEXT };
    case 'replace':
      return { type: 'replace', text: args ? `${args} ${command.value}` : command.value };
    case 'action':
      return { type: 'replace', text: `*${username} ${args}*` };
    case 'backend':
      return { type: 'backend', name: cmd, text: trimmed, args };
    default:
      return null;
  }
}

/**
 * Filter commands matching a partial input (e.g. "/sh" → [/shrug]).
 */
export function filterCommands(input) {
  if (!input.startsWith('/')) return [];
  const lower = input.toLowerCase();
  return SLASH_COMMANDS.filter(c => c.name.startsWith(lower));
}
