const axios = require('axios');

/**
 * Fallback: voice-onset-simulating Smart Time Aligner
 * Allocates lyrics line durations proportionally based on word count & character length,
 * adding onset padding to match real song start tempos.
 */
const smartProportionalAlign = (lyrics, duration) => {
  if (!lyrics || typeof lyrics !== 'string') return '';
  
  const lines = lyrics.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  if (lines.length === 0) return '';
  
  // Calculate relative weight based on word count and character length
  const lineWeights = lines.map(line => {
    const wordCount = line.split(/\s+/).length;
    const charCount = line.length;
    // Blend word count and character count to form a robust metric
    return (wordCount * 0.7) + (charCount * 0.3);
  });
  
  const totalWeight = lineWeights.reduce((sum, w) => sum + w, 0);
  
  // Give an onset buffer so lyrics don't start immediately
  const onsetBuffer = Math.min(4, duration * 0.08); // e.g. 8% of song duration or 4s max
  const outroBuffer = Math.min(5, duration * 0.1);  // 10% of song duration or 5s max
  const usableDuration = Math.max(10, duration - onsetBuffer - outroBuffer);
  
  let currentOffset = onsetBuffer;
  const syncedLines = lines.map((line, index) => {
    const weight = lineWeights[index];
    const lineDuration = (weight / totalWeight) * usableDuration;
    
    const minutes = Math.floor(currentOffset / 60);
    const seconds = Math.floor(currentOffset % 60);
    const hundredths = Math.floor((currentOffset % 1) * 100);
    
    const formattedMins = minutes.toString().padStart(2, '0');
    const formattedSecs = seconds.toString().padStart(2, '0');
    const formattedHund = hundredths.toString().padStart(2, '0');
    
    const timestampedLine = `[${formattedMins}:${formattedSecs}.${formattedHund}] ${line}`;
    
    // Progress the timeline for the next line
    currentOffset += lineDuration;
    
    return timestampedLine;
  });
  
  return syncedLines.join('\n');
};

/**
 * Core Synced Lyrics Service: Query LRCLIB public database for crowd-sourced timed lyrics,
 * falling back to our Smart Time Aligner if not found or on network failure.
 */
const generateLRCLibLyrics = async (audioSource, rawLyrics, duration, title, artist) => {
  const hasRaw = rawLyrics && typeof rawLyrics === 'string' && rawLyrics.trim().length > 0;
  
  // If it already has timestamps, don't modify it
  if (hasRaw && /\[\d{2}:\d{2}\]/.test(rawLyrics)) {
    return rawLyrics;
  }

  const cleanTitle = title || '';
  const cleanArtist = artist || '';

  if (!cleanTitle.trim() || !cleanArtist.trim()) {
    console.log('[LRCLIB] Missing title or artist. Using voice-onset Smart Aligner...');
    return hasRaw ? smartProportionalAlign(rawLyrics, duration) : '';
  }

  try {
    console.log(`[LRCLIB] Querying synced lyrics for: "${cleanTitle}" by "${cleanArtist}" (duration: ${duration}s)...`);
    
    const encodedTitle = encodeURIComponent(cleanTitle.trim());
    const encodedArtist = encodeURIComponent(cleanArtist.trim());
    
    let url = `https://lrclib.net/api/get?artist_name=${encodedArtist}&track_name=${encodedTitle}`;
    if (duration && duration > 0) {
      url += `&duration=${Math.round(duration)}`;
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'MusicoApp/1.0 (https://github.com/jhond/musico)'
      },
      timeout: 5000 // 5 seconds timeout
    });

    if (response.data && response.data.syncedLyrics) {
      console.log(`[LRCLIB] Found synced lyrics for: "${cleanTitle}"!`);
      return response.data.syncedLyrics;
    } else {
      console.log(`[LRCLIB] Synced lyrics not found on LRCLIB for: "${cleanTitle}". Using Smart Aligner...`);
    }
  } catch (error) {
    console.log(`[LRCLIB] Query failed/no-match for: "${cleanTitle}". Error: ${error.message || error}. Using Smart Aligner...`);
  }

  // Fallback to Smart Time Aligner
  return hasRaw ? smartProportionalAlign(rawLyrics, duration) : '';
};

module.exports = {
  generateLRCLibLyrics,
  smartProportionalAlign
};
