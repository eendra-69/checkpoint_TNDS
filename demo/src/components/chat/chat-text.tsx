const BOLD = /\*\*(.+?)\*\*/g;

/** Chat bubble text: renders the agent's `**bold**`; everything else stays plain (pre-wrap). */
export function ChatText({ text }: { text: string }) {
  // split() with a capture group puts the bold runs at odd indexes.
  return text.split(BOLD).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

/** Text for speech synthesis: drop markdown markers so they aren't read aloud. */
export function plainChatText(text: string): string {
  return text.replace(BOLD, "$1");
}
