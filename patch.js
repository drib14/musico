const fs = require('fs');

const fixFile = (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(
    /useEffect\(\(\) => \{\n    const audio = audioRef\?\.current;\n    if \(\!audio\) return;\n\n    const handleTimeUpdate = \(\) => \{\n      setCurrentTime\(audio\.currentTime \|\| 0\);\n    \};\n\n    audio\.addEventListener\('timeupdate', handleTimeUpdate\);\n    \n    \/\/ Initial sync\n    setCurrentTime\(audio\.currentTime \|\| 0\);\n\n    return \(\) => \{\n      audio\.removeEventListener\('timeupdate', handleTimeUpdate\);\n    \};\n  \}, \[audioRef, currentTrack\]\);/g,
    `useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;
    let animationFrameId;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
      animationFrameId = requestAnimationFrame(handleTimeUpdate);
    };

    handleTimeUpdate();

    // Initial sync
    setCurrentTime(audio.currentTime || 0);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioRef, currentTrack]);`
  );
  fs.writeFileSync(filepath, content);
}

fixFile('client/src/pages/Lyrics.jsx');
fixFile('client/src/components/RightSidebar.jsx');
