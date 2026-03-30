const CHARS_PER_LINE = 38;
const LINE_HEIGHT = 26;
const CHAR_WIDTH = 8.4;

const getCursorCoordinates = (text = "", position = 0) => {
  const safePosition = Math.max(0, Math.min(position, text.length));
  const lines = text.slice(0, safePosition).split("\n");
  const lineIndex = lines.length - 1;
  const column = lines[lineIndex]?.length || 0;

  return {
    top: lineIndex * LINE_HEIGHT,
    left: Math.min(column, CHARS_PER_LINE) * CHAR_WIDTH,
  };
};

export { getCursorCoordinates };
