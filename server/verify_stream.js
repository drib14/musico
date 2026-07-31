const axios = require('axios');
const ytdl = require('@distube/ytdl-core');

async function searchYouTubeVideo(query) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    const html = response.data;
    const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    const matches = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      matches.push(match[1]);
    }

    if (matches.length > 0) {
      return matches[0];
    }
    return null;
  } catch (error) {
    console.error('YouTube search scraping failed:', error.message);
    return null;
  }
}

async function run() {
  const query = 'Blinding Lights The Weeknd';
  console.log(`Searching YouTube for "${query}"...`);
  const videoId = await searchYouTubeVideo(query);
  if (!videoId) {
    console.error('Could not find video ID.');
    return;
  }

  console.log(`Found video ID: ${videoId}`);
  console.log('Fetching stream info from ytdl...');
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly' });
    console.log('Successfully retrieved format details!');
    console.log('MimeType:', format.mimeType);
    console.log('Stream URL is available!');
  } catch (err) {
    console.error('ytdl failed:', err.message);
  }
}

run();
