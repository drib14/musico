const fs = require('fs');

const fixFile = (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  const insertIndex = content.indexOf('{/* SECTION: SIMILAR SONGS */}');

  if (insertIndex !== -1 && !content.includes('{/* SECTION: MUSIC INFO */}')) {
    const toInsert = `
          {/* SECTION: MUSIC INFO */}
          {currentTrack.musicinfo && (currentTrack.musicinfo.vocalinstrumental || currentTrack.musicinfo.gender || currentTrack.musicinfo.speed || (currentTrack.musicinfo.tags && (currentTrack.musicinfo.tags.genres?.length > 0 || currentTrack.musicinfo.tags.instruments?.length > 0))) && (
            <section style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '12px', color: 'var(--text-primary)', fontFamily: 'Outfit', fontWeight: '800' }}>Music Info</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {currentTrack.musicinfo.vocalinstrumental && (
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}><span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Type</span><span style={{ fontSize: '14px', fontWeight: '600' }}>{currentTrack.musicinfo.vocalinstrumental === 'vocal' ? 'Vocal' : 'Instrumental'}</span></div>
                )}
                {currentTrack.musicinfo.gender && (
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}><span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Gender</span><span style={{ fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>{currentTrack.musicinfo.gender}</span></div>
                )}
                {currentTrack.musicinfo.speed && (
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}><span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Speed (BPM)</span><span style={{ fontSize: '14px', fontWeight: '600' }}>{currentTrack.musicinfo.speed}</span></div>
                )}
                {currentTrack.musicinfo.tags?.instruments?.length > 0 && (
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}><span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Instruments</span><span style={{ fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>{currentTrack.musicinfo.tags.instruments.join(', ')}</span></div>
                )}
              </div>
            </section>
          )}
          `;
    content = content.slice(0, insertIndex) + toInsert + content.slice(insertIndex);
    fs.writeFileSync(filepath, content);
  }
}

fixFile('client/src/pages/SongDetails.jsx');
