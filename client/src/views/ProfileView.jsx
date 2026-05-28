import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Music, Play, Crown, Calendar, Sparkles, CheckCircle, Globe, Facebook, Twitter, Instagram } from 'lucide-react';
import PlaylistCover from '../components/PlaylistCover';

const ProfileView = () => {
  const { API_URL, activeProfileId, playTrack, showToast, setActivePlaylistId, setActiveView, user: currentUser, token, updateUser } = useContext(AppContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editedArtistName, setEditedArtistName] = useState('');
  const [editedArtistBio, setEditedArtistBio] = useState('');
  const [editedWebsite, setEditedWebsite] = useState('');
  const [editedFacebook, setEditedFacebook] = useState('');
  const [editedTwitter, setEditedTwitter] = useState('');
  const [editedInstagram, setEditedInstagram] = useState('');
  const [editedArtistAvatar, setEditedArtistAvatar] = useState('');
  const [editedArtistBanner, setEditedArtistBanner] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventVenue, setNewEventVenue] = useState('');
  const [newEventCity, setNewEventCity] = useState('');

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, "");
  };

  useEffect(() => {
    if (activeProfileId) {
      fetchProfileDetails();
    }
  }, [activeProfileId]);

  useEffect(() => {
    if (profileData && profileData.user) {
      setEditedArtistName(profileData.user.artistName || profileData.user.name || '');
      setEditedArtistBio(profileData.user.artistBio || '');
      setEditedWebsite(profileData.user.website || '');
      setEditedFacebook(profileData.user.facebook || '');
      setEditedTwitter(profileData.user.twitter || '');
      setEditedInstagram(profileData.user.instagram || '');
      setEditedArtistAvatar(profileData.user.artistAvatar || profileData.user.userAvatar || '');
      setEditedArtistBanner(profileData.user.artistBanner || '');
    }
  }, [profileData]);

  const saveProfileField = async (fieldName, value) => {
    if (!token) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [fieldName]: value })
      });
      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
        setProfileData(prev => prev ? {
          ...prev,
          user: {
            ...prev.user,
            [fieldName]: value
          }
        } : prev);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      showToast('Error saving profile changes', 'error');
    }
  };

  const handleFieldChange = (fieldName, value) => {
    if (fieldName === 'artistName') setEditedArtistName(value);
    if (fieldName === 'artistBio') setEditedArtistBio(value);
    if (fieldName === 'website') setEditedWebsite(value);
    if (fieldName === 'facebook') setEditedFacebook(value);
    if (fieldName === 'twitter') setEditedTwitter(value);
    if (fieldName === 'instagram') setEditedInstagram(value);
    if (fieldName === 'artistAvatar') setEditedArtistAvatar(value);
    if (fieldName === 'artistBanner') setEditedArtistBanner(value);
  };

  const handleFieldBlur = (fieldName, value) => {
    const originalValue = profileData.user[fieldName] || '';
    if (value.trim() !== originalValue.trim()) {
      saveProfileField(fieldName, value.trim());
    }
  };

  const fetchProfileDetails = async () => {
    setLoading(true);
    try {
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(activeProfileId);
      const endpoint = isMongoId
        ? `${API_URL}/auth/users/${activeProfileId}`
        : `${API_URL}/tracks/jamendo/artist/${activeProfileId}`;
        
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to load profile details');
      const data = await res.json();
      setProfileData(data);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profileData || !profileData.user) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
        <Music className="w-16 h-16 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
        <h3>User Profile Not Found</h3>
      </div>
    );
  }

  const { user, tracks, playlists } = profileData;
  const isOwnProfile = currentUser && activeProfileId === currentUser._id;
  const joinDate = new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });

  const handleAddConcert = () => {
    if (!newEventDate.trim() || !newEventTitle.trim() || !newEventVenue.trim() || !newEventCity.trim()) {
      return showToast('Please fill in all event fields', 'error');
    }
    const newConcert = {
      date: newEventDate.trim(),
      title: newEventTitle.trim(),
      venue: newEventVenue.trim(),
      city: newEventCity.trim()
    };
    const updatedConcerts = [...(user.concerts || []), newConcert];
    saveProfileField('concerts', updatedConcerts);
    
    // Reset state fields
    setNewEventDate('');
    setNewEventTitle('');
    setNewEventVenue('');
    setNewEventCity('');
  };

  const handleDeleteConcert = (idx) => {
    const updatedConcerts = [...(user.concerts || [])];
    updatedConcerts.splice(idx, 1);
    saveProfileField('concerts', updatedConcerts);
  };

  const hasBanner = user.artistBanner && user.artistBanner.trim().length > 0;
  const bannerBackground = hasBanner 
    ? `linear-gradient(rgba(7, 10, 19, 0.45), rgba(7, 10, 19, 0.85)), url(${user.artistBanner}) center/cover no-repeat`
    : 'linear-gradient(135deg, rgba(13, 21, 39, 0.95) 0%, rgba(59, 130, 246, 0.2) 100%)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 1. LARGE PREMIUM ARTIST BANNER */}
      <div 
        style={{
          background: bannerBackground,
          borderRadius: '20px',
          padding: '48px 40px',
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--glass-shadow)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '220px'
        }}
      >
        {isOwnProfile && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '6px 12px',
            borderRadius: '20px',
            backgroundColor: 'rgba(7, 10, 19, 0.6)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 10
          }}>
            {saveStatus === 'idle' && (
              <span style={{ color: 'var(--text-secondary)' }}>✏️ Own Profile (inline-editable)</span>
            )}
            {saveStatus === 'saving' && (
              <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="spinner" style={{ width: '10px', height: '10px', margin: 0 }}></div>
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span style={{ color: 'var(--success)' }}>✓ Profile Auto-saved</span>
            )}
            {saveStatus === 'error' && (
              <span style={{ color: 'var(--danger)' }}>✗ Error auto-saving</span>
            )}
          </div>
        )}
        {user.artistAvatar || user.userAvatar ? (
          <img 
            src={user.artistAvatar || user.userAvatar} 
            alt={user.artistName || user.name} 
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--accent)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              flexShrink: 0
            }}
          />
        ) : (
          <div 
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontFamily: 'Outfit',
              fontWeight: '800',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
              flexShrink: 0
            }}
          >
            {(user.artistName || user.name).charAt(0).toUpperCase()}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: '5' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {user.isArtistVerified ? (
              <span 
                className="user-badge" 
                style={{ 
                  fontSize: '11px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  margin: 0, 
                  backgroundColor: 'rgba(59, 130, 246, 0.25)', 
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)'
                }}
              >
                <CheckCircle className="w-3.5 h-3.5 fill-current" /> Verified Artist
              </span>
            ) : user.isPremium ? (
              <span className="user-badge" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                <Crown style={{ width: '12px', height: '12px' }} /> Premium Artist
              </span>
            ) : (
              <span className="user-badge" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', margin: 0 }}>
                <Sparkles style={{ width: '12px', height: '12px' }} /> Creator
              </span>
            )}
          </div>

          {isOwnProfile ? (
            <input
              type="text"
              value={editedArtistName}
              onChange={(e) => handleFieldChange('artistName', e.target.value)}
              onBlur={() => handleFieldBlur('artistName', editedArtistName)}
              placeholder="Enter Artist Name"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: '#fff',
                fontSize: '36px',
                fontWeight: '800',
                fontFamily: 'Outfit',
                outline: 'none',
                width: '100%',
                maxWidth: '450px',
                marginTop: '4px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
              }}
            />
          ) : (
            <h1 style={{ 
              fontSize: '42px', 
              fontFamily: 'Outfit', 
              fontWeight: '800', 
              lineHeight: '1.1',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#fff'
            }}>
              {user.artistName || user.name}
              {user.isArtistVerified && (
                <span 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
                  }}
                  title="Verified Artist check badge"
                >
                  ✓
                </span>
              )}
            </h1>
          )}
          
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar className="w-4 h-4 text-muted" /> Joined {joinDate}
            </span>
            <span>•</span>
            <span><strong>{tracks.length}</strong> Songs uploaded</span>
            <span>•</span>
            <span><strong>{playlists.length}</strong> Playlists created</span>
          </div>

        </div>

        {/* Decorative background element */}
        <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', fontSize: '180px', fontWeight: '800', color: 'rgba(59, 130, 246, 0.03)', pointerEvents: 'none', fontFamily: 'Outfit' }}>
          CREATOR
        </div>
      </div>

      {/* 1.5 SPOTIFY ABOUT / BIOGRAPHY SECTION */}
      {(user.artistBio || isOwnProfile) && (
        <section 
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: 'var(--glass-shadow)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0',
            alignItems: 'stretch',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {user.artistAvatar && (
            <div 
              style={{
                width: '100%',
                minHeight: '250px',
                background: `url(${user.artistAvatar}) center/cover no-repeat`,
                borderRight: '1px solid var(--border-color)'
              }}
            />
          )}
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '1px' }}>
                Artist Biography
              </span>
              {user.isArtistVerified && (
                <span style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: '#3b82f6',
                  padding: '2px 8px',
                  borderRadius: '99px',
                  fontSize: '10px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  Official Verified
                </span>
              )}
            </div>
            
            <h3 style={{ fontSize: '24px', fontFamily: 'Outfit', fontWeight: '800', margin: 0 }}>
              About {user.artistName || user.name}
            </h3>
            
            {isOwnProfile ? (
              <textarea
                value={editedArtistBio}
                onChange={(e) => handleFieldChange('artistBio', e.target.value)}
                onBlur={() => handleFieldBlur('artistBio', editedArtistBio)}
                placeholder="Tell your fans about yourself! Add your biography, inspirations, and history..."
                rows="6"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '14px',
                  fontSize: '14px',
                  lineHeight: '1.7',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
            ) : (
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '14px', 
                lineHeight: '1.7', 
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {stripHtml(user.artistBio)}
              </p>
            )}

            {/* Dynamic Clickable Social Icons shortcut */}
            {(user.facebook || user.twitter || user.instagram || user.website) && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center' }}>
                {user.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Website">
                    <Globe style={{ width: '16px', height: '16px' }} />
                  </a>
                )}
                {user.facebook && (
                  <a href={user.facebook.startsWith('http') ? user.facebook : `https://facebook.com/${user.facebook}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Facebook">
                    <Facebook style={{ width: '16px', height: '16px' }} />
                  </a>
                )}
                {user.twitter && (
                  <a href={user.twitter.startsWith('http') ? user.twitter : `https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Twitter">
                    <Twitter style={{ width: '16px', height: '16px' }} />
                  </a>
                )}
                {user.instagram && (
                  <a href={user.instagram.startsWith('http') ? user.instagram : `https://instagram.com/${user.instagram}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Instagram">
                    <Instagram style={{ width: '16px', height: '16px' }} />
                  </a>
                )}
              </div>
            )}

            {isOwnProfile && (
              <div style={{ 
                marginTop: '20px', 
                borderTop: '1px solid var(--border-color)', 
                paddingTop: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <h4 style={{ 
                  fontSize: '13px', 
                  fontWeight: '800', 
                  color: 'var(--accent)', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Edit Creator Visuals, Socials & Contact Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  {[
                    { label: 'Website Link', field: 'website', value: editedWebsite, placeholder: 'https://mywebsite.com' },
                    { label: 'Facebook Username / URL', field: 'facebook', value: editedFacebook, placeholder: 'facebook.com/username' },
                    { label: 'Twitter / X Username / URL', field: 'twitter', value: editedTwitter, placeholder: 'twitter.com/username' },
                    { label: 'Instagram Username / URL', field: 'instagram', value: editedInstagram, placeholder: 'instagram.com/username' },
                    { label: 'Artist Avatar Image URL', field: 'artistAvatar', value: editedArtistAvatar, placeholder: 'https://images.unsplash.com/... (square)' },
                    { label: 'Artist Banner Image URL', field: 'artistBanner', value: editedArtistBanner, placeholder: 'https://images.unsplash.com/... (landscape)' }
                  ].map((s) => (
                    <div key={s.field} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{s.label}</label>
                      <input
                        type="text"
                        value={s.value}
                        onChange={(e) => handleFieldChange(s.field, e.target.value)}
                        onBlur={() => handleFieldBlur(s.field, s.value)}
                        placeholder={s.placeholder}
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '12.5px',
                          outline: 'none',
                          transition: 'border-color var(--transition-fast)'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Spotify Monthly Listeners stats */}
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '14px', flexWrap: 'wrap' }}>
              <span><strong>{user.monthlyListeners?.toLocaleString() || 0}</strong> Monthly Listeners</span>
              <span>•</span>
              <span><strong>{user.totalPlays?.toLocaleString() || 0}</strong> Lifetime Streams</span>
            </div>
          </div>
        </section>
      )}

      {/* 2. UPLOADED TRACKS LIST */}
      {tracks.length > 0 && (
        <section>
          <h2 style={{ fontSize: '22px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Uploaded Songs
          </h2>
          <table className="track-table">
            <thead>
              <tr>
                <th className="table-index">#</th>
                <th>Title</th>
                <th>Genre</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track, idx) => (
                <tr key={track._id} onClick={() => playTrack(track, tracks)} style={{ cursor: 'pointer' }}>
                  <td className="table-index">{idx + 1}</td>
                  <td>
                    <div className="table-track-info">
                      {track.coverUrl ? (
                        <img className="table-cover" src={track.coverUrl} alt={track.title} />
                      ) : (
                        <div className="table-cover" style={{ backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                          <Music className="w-5 h-5 text-accent" />
                        </div>
                      )}
                      <div>
                        <div className="table-title">{track.title}</div>
                        <div className="table-artist" style={{ color: 'var(--text-muted)' }}>{track.artistName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-genre">{track.genre}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); playTrack(track, tracks); }}>
                      <Play fill="currentColor" className="w-3 h-3" style={{ transform: 'translateX(1px)' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* 3. PUBLIC PLAYLISTS */}
      {playlists.length > 0 && (
        <section>
          <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>Public Playlists</h2>
          <div className="grid-container carousel-desktop">
            {playlists.map((pl) => (
              <div
                key={pl._id}
                className="song-card"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setActivePlaylistId(pl._id);
                  setActiveView('playlist-details');
                }}
              >
                <div className="song-card-cover-wrapper">
                  <PlaylistCover playlist={pl} className="song-card-cover" />
                </div>
                <div className="song-card-title">{pl.name}</div>
                <div className="song-card-artist">{pl.tracks?.length || 0} songs</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. UPCOMING CONCERTS & CREATOR MANAGER */}
      {((user.concerts && user.concerts.length > 0) || isOwnProfile) && (
        <section style={{ animation: 'fadeIn 0.3s ease' }}>
          <h2 style={{ fontSize: '22px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar className="w-6 h-6 text-accent" /> Upcoming Concerts & Events
          </h2>
          {user.concerts && user.concerts.length > 0 ? (
            <div className="concert-grid-container">
              {user.concerts.map((c, idx) => (
                <div 
                  key={idx}
                  className="concert-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      color: 'var(--accent)',
                      backgroundColor: 'var(--accent-light)',
                      padding: '4px 10px',
                      borderRadius: '20px'
                    }}>
                      Live Show
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{c.date}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{c.title}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{c.venue}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{c.city}</p>
                  </div>
                  
                  {isOwnProfile ? (
                    <button 
                      onClick={() => handleDeleteConcert(idx)}
                      className="btn btn-secondary"
                      style={{
                        marginTop: '8px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        borderRadius: '20px',
                        color: 'var(--danger)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      Delete Event
                    </button>
                  ) : (
                    c.url && (
                      <a 
                        href={c.url}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-primary"
                        style={{
                          marginTop: '8px',
                          padding: '8px 16px',
                          fontSize: '13px',
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          textDecoration: 'none',
                          fontWeight: 'bold'
                        }}
                      >
                        Get Tickets
                      </a>
                    )
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic', margin: '0 0 16px 0' }}>
              No concerts added yet. Add your first live tour or local gig below!
            </p>
          )}

          {isOwnProfile && (
            <div style={{
              marginTop: '24px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--glass-shadow)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Add Upcoming Live Event
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Event Date / Time</label>
                  <input
                    type="text"
                    placeholder="e.g. October 15, 2026 at 8:00 PM"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Event Title / Tour Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Echoes of Midnight Tour"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Madison Square Garden"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>City / Country</label>
                  <input
                    type="text"
                    placeholder="e.g. New York, USA"
                    value={newEventCity}
                    onChange={(e) => setNewEventCity(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleAddConcert}
                className="btn btn-primary"
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 24px',
                  borderRadius: '24px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                + Add Live Event
              </button>
            </div>
          )}
        </section>
      )}

    </div>
  );
};

export default ProfileView;
