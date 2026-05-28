import React, { useState, useEffect, useContext } from 'react';
import { Search, Flame, Music, TrendingUp } from 'lucide-react';
import EventCard from '../components/EventCard';
import { AppContext } from '../context/AppContext';

const EventsView = () => {
  const { API_URL, showToast } = useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'trending'
  const [hasSearched, setHasSearched] = useState(false);

  // Load trending events on mount
  useEffect(() => {
    fetchTrendingEvents();
  }, []);

  const fetchTrendingEvents = async () => {
    setTrendingLoading(true);
    try {
      const res = await fetch(`${API_URL}/events/trending?size=20`);
      if (!res.ok) throw new Error('Failed to fetch trending events');
      const data = await res.json();
      setTrendingEvents(data.data || []);
    } catch (error) {
      console.error('Error fetching trending events:', error);
      showToast('Failed to load trending events', 'error');
    } finally {
      setTrendingLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      showToast('Please enter an artist name or keyword', 'warning');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`${API_URL}/events/search?q=${encodeURIComponent(searchQuery)}&size=20`);
      if (!res.ok) throw new Error('Failed to search events');
      const data = await res.json();
      setEvents(data.data || []);

      if (data.data.length === 0) {
        showToast(`No events found for "${searchQuery}"`, 'info');
      }
    } catch (error) {
      console.error('Error searching events:', error);
      showToast(error.message || 'Failed to search events', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* Hero Banner */}
      <div className="hero-banner">
        <span className="hero-subtitle">Discover Live Music</span>
        <h1 className="hero-title">Find Upcoming Concerts & Events</h1>
        <p className="hero-desc">
          Search for your favorite artists and discover upcoming concerts, festivals, and live events near you.
        </p>
      </div>

      {/* Search Bar */}
      <section
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              className="w-4 h-4"
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search by artist name, venue, or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ minWidth: '100px' }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </section>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <button
          className={`btn ${activeTab === 'search' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('search')}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            borderRadius: '6px',
            background: activeTab !== 'search' ? 'none' : undefined,
            boxShadow: activeTab !== 'search' ? 'none' : undefined,
          }}
        >
          <Search className="w-4 h-4" /> My Search
        </button>
        <button
          className={`btn ${activeTab === 'trending' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('trending')}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            borderRadius: '6px',
            background: activeTab !== 'trending' ? 'none' : undefined,
            boxShadow: activeTab !== 'trending' ? 'none' : undefined,
          }}
        >
          <Flame className="w-4 h-4" /> Trending Events
        </button>
      </div>

      {/* Search Results */}
      {activeTab === 'search' && (
        <section>
          {!hasSearched ? (
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '48px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <Search className="w-12 h-12 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Search for Events
              </h3>
              <p style={{ fontSize: '14px' }}>
                Enter an artist name or keyword above to find upcoming concerts and events.
              </p>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner"></div>
            </div>
          ) : events.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '48px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <Music className="w-12 h-12 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                No Events Found
              </h3>
              <p style={{ fontSize: '14px' }}>
                Try searching with a different artist name or keyword.
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
                Found {events.length} Event{events.length !== 1 ? 's' : ''} for "{searchQuery}"
              </h2>
              <div className="grid-container">
                {events.map((event) => (
                  <EventCard key={event._id || event.ticketmasterId} event={event} />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Trending Events */}
      {activeTab === 'trending' && (
        <section>
          {trendingLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner"></div>
            </div>
          ) : trendingEvents.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '48px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <TrendingUp className="w-12 h-12 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                No Trending Events
              </h3>
              <p style={{ fontSize: '14px' }}>Check back later for trending concerts and events.</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Trending Events</h2>
              <div className="grid-container">
                {trendingEvents.map((event) => (
                  <EventCard key={event._id || event.ticketmasterId} event={event} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default EventsView;
