// Mock jamendo lyrics sync generation test
const generateSyncedLyrics = (lyrics, duration) => {
  if (!lyrics || !duration) return lyrics;

  const lines = lyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return lyrics;

  // Distribute duration linearly across lines
  // Assumes a start buffer and end buffer
  const startBuffer = 10; // seconds before first line
  const endBuffer = 10;   // seconds after last line

  let usableTime = duration - startBuffer - endBuffer;
  if (usableTime < 10) usableTime = duration; // fallback

  const timePerLine = usableTime / lines.length;

  const syncedLines = lines.map((line, index) => {
    let seconds = startBuffer + (index * timePerLine);
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    const formattedMins = mins.toString().padStart(2, '0');
    const formattedSecs = secs.toString().padStart(2, '0');

    return `[${formattedMins}:${formattedSecs}.00] ${line}`;
  });

  return syncedLines.join('\n');
};

const rawLyrics = `Hello world
This is a test
To see if we can evenly distribute
The jamendo lyrics`;

console.log(generateSyncedLyrics(rawLyrics, 180));
