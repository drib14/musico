const axios = require('axios');

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

/**
 * Search for events by keyword (artist name, venue, etc.)
 */
const searchEvents = async (keyword, params = {}) => {
  try {
    const response = await axios.get(`${TICKETMASTER_BASE_URL}/events.json`, {
      params: {
        apikey: TICKETMASTER_API_KEY,
        keyword,
        size: params.size || 20,
        page: params.page || 0,
        sort: params.sort || 'date,asc',
        ...params,
      },
    });

    return response.data._embedded?.events || [];
  } catch (error) {
    console.error('Ticketmaster search error:', error.message);
    throw new Error(`Failed to fetch events: ${error.message}`);
  }
};

/**
 * Get events by artist name
 */
const getEventsByArtist = async (artistName, params = {}) => {
  try {
    const response = await axios.get(`${TICKETMASTER_BASE_URL}/events.json`, {
      params: {
        apikey: TICKETMASTER_API_KEY,
        keyword: artistName,
        size: params.size || 20,
        page: params.page || 0,
        sort: params.sort || 'date,asc',
        classificationName: params.classificationName || 'music',
        ...params,
      },
    });

    return response.data._embedded?.events || [];
  } catch (error) {
    console.error('Ticketmaster artist search error:', error.message);
    throw new Error(`Failed to fetch artist events: ${error.message}`);
  }
};

/**
 * Get events by venue
 */
const getEventsByVenue = async (venueId, params = {}) => {
  try {
    const response = await axios.get(`${TICKETMASTER_BASE_URL}/venues/${venueId}/events.json`, {
      params: {
        apikey: TICKETMASTER_API_KEY,
        size: params.size || 20,
        page: params.page || 0,
        sort: params.sort || 'date,asc',
        ...params,
      },
    });

    return response.data._embedded?.events || [];
  } catch (error) {
    console.error('Ticketmaster venue search error:', error.message);
    throw new Error(`Failed to fetch venue events: ${error.message}`);
  }
};

/**
 * Get trending events (upcoming events sorted by popularity)
 */
const getTrendingEvents = async (params = {}) => {
  try {
    const response = await axios.get(`${TICKETMASTER_BASE_URL}/events.json`, {
      params: {
        apikey: TICKETMASTER_API_KEY,
        size: params.size || 40,
        page: params.page || 0,
        sort: params.sort || 'popularity,desc',
        classificationName: params.classificationName || 'music',
        ...params,
      },
    });

    return response.data._embedded?.events || [];
  } catch (error) {
    console.error('Ticketmaster trending search error:', error.message);
    throw new Error(`Failed to fetch trending events: ${error.message}`);
  }
};

/**
 * Get events by classification (genre)
 */
const getEventsByGenre = async (genre, params = {}) => {
  try {
    const response = await axios.get(`${TICKETMASTER_BASE_URL}/events.json`, {
      params: {
        apikey: TICKETMASTER_API_KEY,
        classificationName: genre,
        size: params.size || 20,
        page: params.page || 0,
        sort: params.sort || 'date,asc',
        ...params,
      },
    });

    return response.data._embedded?.events || [];
  } catch (error) {
    console.error('Ticketmaster genre search error:', error.message);
    throw new Error(`Failed to fetch genre events: ${error.message}`);
  }
};

/**
 * Transform Ticketmaster event data to our schema format
 */
const transformEvent = (event) => {
  const {
    id,
    name,
    images,
    url,
    dates,
    priceRanges,
    _embedded: { venues = [], attractions = [] } = {},
    classifications = [],
    promoters = [],
    status,
  } = event;

  const venue = venues[0] || {};
  const image =
    images && images.length > 0
      ? images.reduce((max, img) => (img.width > max.width ? img : max)).url
      : '';

  return {
    ticketmasterId: id,
    name,
    artists: attractions.map((attr) => ({
      id: attr.id,
      name: attr.name,
      image: attr.images?.[0]?.url || '',
    })),
    venue: {
      id: venue.id,
      name: venue.name,
      address: venue.address?.address1,
      city: venue.city?.name,
      state: venue.state?.stateCode,
      country: venue.country?.countryCode,
      postalCode: venue.postalCode,
      coordinates: {
        latitude: venue.location?.latitude,
        longitude: venue.location?.longitude,
      },
    },
    dates: {
      startDate: dates.start.dateTime
        ? new Date(dates.start.dateTime)
        : new Date(dates.start.localDate),
      startTime: dates.start.localTime,
      endDate: dates.end?.dateTime ? new Date(dates.end.dateTime) : null,
      timezone: dates.timezone,
    },
    priceRange: priceRanges?.[0] || { min: null, max: null, currency: 'USD' },
    image,
    url,
    ticketsUrl: url,
    status: status?.code || 'onsale',
    classification: {
      segment: classifications?.[0]?.segment?.name,
      genre: classifications?.[0]?.genre?.name,
      subGenre: classifications?.[0]?.subGenre?.name,
      type: classifications?.[0]?.type?.name,
      subType: classifications?.[0]?.subType?.name,
    },
    promoter: {
      id: promoters?.[0]?.id,
      name: promoters?.[0]?.name,
    },
    source: 'ticketmaster',
  };
};

module.exports = {
  searchEvents,
  getEventsByArtist,
  getEventsByVenue,
  getTrendingEvents,
  getEventsByGenre,
  transformEvent,
};
