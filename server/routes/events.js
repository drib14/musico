const express = require('express');
const Event = require('../models/Event');
const ticketmaster = require('../utils/ticketmaster');
const auth = require('../middleware/authMiddleware').protect;

const router = express.Router();

/**
 * Search events by keyword
 * GET /api/events/search?q=artist_name&size=20&page=0
 */
router.get('/search', async (req, res) => {
  try {
    const { q, size = 20, page = 0 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search keyword is required' });
    }

    // Get events from Ticketmaster
    const events = await ticketmaster.searchEvents(q, { size: parseInt(size), page: parseInt(page) });

    // Transform and save events to database
    const transformedEvents = events.map(ticketmaster.transformEvent);

    // Upsert events in database
    const savedEvents = await Promise.all(
      transformedEvents.map((event) =>
        Event.findOneAndUpdate(
          { ticketmasterId: event.ticketmasterId },
          event,
          { upsert: true, new: true }
        )
      )
    );

    res.json({
      success: true,
      count: savedEvents.length,
      data: savedEvents,
    });
  } catch (error) {
    console.error('Search events error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get events by artist name
 * GET /api/events/artist/:name?size=20&page=0
 */
router.get('/artist/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { size = 20, page = 0 } = req.query;

    // Get events from Ticketmaster
    const events = await ticketmaster.getEventsByArtist(name, {
      size: parseInt(size),
      page: parseInt(page),
    });

    // Transform and save events
    const transformedEvents = events.map(ticketmaster.transformEvent);

    const savedEvents = await Promise.all(
      transformedEvents.map((event) =>
        Event.findOneAndUpdate(
          { ticketmasterId: event.ticketmasterId },
          event,
          { upsert: true, new: true }
        )
      )
    );

    res.json({
      success: true,
      artist: name,
      count: savedEvents.length,
      data: savedEvents,
    });
  } catch (error) {
    console.error('Get artist events error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get trending events
 * GET /api/events/trending?size=20&page=0
 */
router.get('/trending', async (req, res) => {
  try {
    const { size = 20, page = 0 } = req.query;

    const events = await ticketmaster.getTrendingEvents({
      size: parseInt(size),
      page: parseInt(page),
    });

    const transformedEvents = events.map(ticketmaster.transformEvent);

    const savedEvents = await Promise.all(
      transformedEvents.map((event) =>
        Event.findOneAndUpdate(
          { ticketmasterId: event.ticketmasterId },
          event,
          { upsert: true, new: true }
        )
      )
    );

    res.json({
      success: true,
      count: savedEvents.length,
      data: savedEvents,
    });
  } catch (error) {
    console.error('Get trending events error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get events by genre
 * GET /api/events/genre/:genre?size=20&page=0
 */
router.get('/genre/:genre', async (req, res) => {
  try {
    const { genre } = req.params;
    const { size = 20, page = 0 } = req.query;

    const events = await ticketmaster.getEventsByGenre(genre, {
      size: parseInt(size),
      page: parseInt(page),
    });

    const transformedEvents = events.map(ticketmaster.transformEvent);

    const savedEvents = await Promise.all(
      transformedEvents.map((event) =>
        Event.findOneAndUpdate(
          { ticketmasterId: event.ticketmasterId },
          event,
          { upsert: true, new: true }
        )
      )
    );

    res.json({
      success: true,
      genre,
      count: savedEvents.length,
      data: savedEvents,
    });
  } catch (error) {
    console.error('Get genre events error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all events from database (cached)
 * GET /api/events?size=20&page=0
 */
router.get('/', async (req, res) => {
  try {
    const { size = 20, page = 0, status } = req.query;
    const skip = parseInt(page) * parseInt(size);

    const filter = status ? { status } : {};
    const events = await Event.find(filter)
      .sort({ 'dates.startDate': 1 })
      .limit(parseInt(size))
      .skip(skip);

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(size)),
      data: events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get single event by ID
 * GET /api/events/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete event
 * DELETE /api/events/:id
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
