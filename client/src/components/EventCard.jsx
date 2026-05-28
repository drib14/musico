import React from 'react';
import { MapPin, Calendar, Ticket, Music } from 'lucide-react';

const EventCard = ({ event, onClick = () => {} }) => {
  const startDate = new Date(event.dates.startDate);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="event-card" onClick={onClick}>
      {/* Event Image */}
      <div className="event-card-cover-wrapper">
        {event.image ? (
          <img className="event-card-cover" src={event.image} alt={event.name} />
        ) : (
          <div
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <Music className="w-12 h-12 text-accent" />
          </div>
        )}
        {/* Status Badge */}
        {event.status && (
          <div className="event-card-status-badge">
            <span className={`status-${event.status}`}>{event.status.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className="event-card-title">{event.name}</div>

      {/* Artists */}
      {event.artists && event.artists.length > 0 && (
        <div className="event-card-artists">
          {event.artists.slice(0, 2).map((artist, idx) => (
            <span key={idx} className="event-card-artist-name">
              {artist.name}
            </span>
          ))}
          {event.artists.length > 2 && <span className="event-card-more-artists">+{event.artists.length - 2} more</span>}
        </div>
      )}

      {/* Date & Time */}
      <div className="event-card-meta">
        <Calendar className="w-3.5 h-3.5" />
        <div className="event-card-date-time">
          <div className="event-card-date">{formattedDate}</div>
          <div className="event-card-time">{formattedTime}</div>
        </div>
      </div>

      {/* Venue */}
      {event.venue && event.venue.name && (
        <div className="event-card-meta">
          <MapPin className="w-3.5 h-3.5" />
          <div className="event-card-venue">
            <div className="event-card-venue-name">{event.venue.name}</div>
            {event.venue.city && <div className="event-card-venue-city">{event.venue.city}</div>}
          </div>
        </div>
      )}

      {/* Price Range */}
      {event.priceRange && (event.priceRange.min || event.priceRange.max) && (
        <div className="event-card-price">
          <Ticket className="w-3.5 h-3.5" />
          <span>
            ${event.priceRange.min || 0} - ${event.priceRange.max || 'TBD'}
          </span>
        </div>
      )}

      {/* Get Tickets Button */}
      <a
        href={event.url || event.ticketsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="event-card-btn"
        onClick={(e) => e.stopPropagation()}
      >
        Get Tickets
      </a>
    </div>
  );
};

export default EventCard;
