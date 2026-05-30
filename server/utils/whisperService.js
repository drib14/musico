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
 * Sequential alignment of raw lyrics lines to Whisper segment timestamps
 */
const alignLyricsWithSegments = (lines, segments) => {
  if (!segments || segments.length === 0) return null;
  
  return lines.map((line, lineIdx) => {
    // Map lines sequentially to Whisper segment indices based on fractional progress
    const progress = lineIdx / lines.length;
    const targetSegmentIdx = Math.min(
      segments.length - 1,
      Math.floor(progress * segments.length)
    );
    const matchedSegment = segments[targetSegmentIdx];
    const timestamp = matchedSegment ? matchedSegment.start : 0;
    
    const minutes = Math.floor(timestamp / 60);
    const seconds = Math.floor(timestamp % 60);
    const hundredths = Math.floor((timestamp % 1) * 100);
    
    const formattedMins = minutes.toString().padStart(2, '0');
    const formattedSecs = seconds.toString().padStart(2, '0');
    const formattedHund = hundredths.toString().padStart(2, '0');
    
    return `[${formattedMins}:${formattedSecs}.${formattedHund}] ${line}`;
  }).join('\n');
};

/**
 * Core Service: generates time-synchronized LRC lyrics using OpenAI Whisper transcription segments,
 * falling back to the Smart Time Aligner if API key is not present.
 */
const generateWhisperTimestamps = async (audioSource, rawLyrics, duration) => {
  if (!rawLyrics || typeof rawLyrics !== 'string') return '';
  
  // If it already has timestamps, don't modify it
  if (/\[\d{2}:\d{2}\]/.test(rawLyrics)) {
    return rawLyrics;
  }

  const lines = rawLyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return '';

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('[WhisperService] OpenAI API Key not found. Using voice-onset Smart Time Aligner...');
    return smartProportionalAlign(rawLyrics, duration);
  }

  try {
    let audioBuffer;
    if (Buffer.isBuffer(audioSource)) {
      audioBuffer = audioSource;
    } else if (typeof audioSource === 'string' && audioSource.startsWith('http')) {
      console.log(`[WhisperService] Downloading audio file for transcribing: ${audioSource}`);
      const downloadRes = await axios.get(audioSource, { responseType: 'arraybuffer' });
      audioBuffer = Buffer.from(downloadRes.data);
    } else {
      console.log('[WhisperService] Invalid audio source format. Using Smart Aligner...');
      return smartProportionalAlign(rawLyrics, duration);
    }

    console.log('[WhisperService] Sending audio segments to OpenAI Whisper API...');
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    formData.append('file', audioBlob, 'track.mp3');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      const segments = data.segments;
      const aligned = alignLyricsWithSegments(lines, segments);
      if (aligned) {
        console.log('[WhisperService] Transcribed and aligned lyrics successfully.');
        return aligned;
      }
    } else {
      const errText = await response.text();
      console.warn(`[WhisperService] Whisper API returned status ${response.status}:`, errText);
    }
  } catch (error) {
    console.error('[WhisperService] API Request Exception:', error.message || error);
  }

  console.log('[WhisperService] Falling back to Smart Time Aligner...');
  return smartProportionalAlign(rawLyrics, duration);
};

module.exports = {
  generateWhisperTimestamps,
  smartProportionalAlign
};
