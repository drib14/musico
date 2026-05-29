import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Play, Pause, Disc, Calendar, MoreVertical, Edit2 } from 'lucide-react';
import TrackCard from '../components/TrackCard';

const ArtistDashboard = () => {
  const { user, API_URL, token, currentTrack, isPlaying, togglePlay, showToast } = useContext(AppContext);
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [concerts, setConcerts] = useState(user?.artistProfile?.concerts || []);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    artistBio: user?.artistProfile?.artistBio || '',
    website: user?.artistProfile?.website || '',
    instagram: user?.artistProfile?.instagram || '',
    twitter: user?.artistProfile?.twitter || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user && user.artistProfile) {
      fetchArtistContent();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchArtistContent = async () => {
    try {
      // Use user._id because this is their own artist profile
      const res = await fetch(`${API_URL}/tracks?artist=${user._id}`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // We send FormData so it's compatible with multer fields on the backend route /api/artists
    const formData = new FormData();
    formData.append('artistBio', editForm.artistBio);
    formData.append('website', editForm.website);
    formData.append('instagram', editForm.instagram);
    formData.append('twitter', editForm.twitter);

    try {
      const res = await fetch(`${API_URL}/artists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        showToast('Artist profile updated!');
        setIsEditModalOpen(false);
        // Page reload will trigger AppContext to fetch fresh /me data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast('Failed to update profile', 'error');
      }
    } catch (error) {
      showToast('Error updating profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || !user.artistProfile) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
        <h2>You do not have an active artist profile.</h2>
        <p>Please update your settings to become an artist.</p>
      </div>
    );
  }

  const profile = user.artistProfile;

  return (
    <div className="artist-dashboard fade-in" style={{ padding: '32px' }}>

      {/* Banner / Header */}
      <div style={{
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-end',
        paddingBottom: '32px',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '32px'
      }}>
        <div style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: 'var(--glass-shadow)',
          border: '4px solid var(--bg-tertiary)'
        }}>
          {profile.artistAvatar ? (
            <img src={profile.artistAvatar} alt={profile.artistName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', color: 'var(--text-muted)' }}>
              {profile.artistName?.charAt(0)}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
            Artist Dashboard
          </span>
          <h1 style={{ fontSize: '48px', margin: '8px 0', fontWeight: '900' }}>{profile.artistName}</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: '1.6' }}>
            {profile.artistBio || 'Add a bio to tell fans about yourself.'}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => setIsEditModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '30px' }}
        >
          <Edit2 className="w-4 h-4" /> Edit Profile
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>

        {/* Left Column: Tracks */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Your Tracks</h2>
          </div>
          {loading ? (
            <div>Loading tracks...</div>
          ) : tracks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tracks.map((track, idx) => (
                <div key={track._id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', transition: 'background 0.2s' }} className="hover:bg-tertiary cursor-pointer">
                  <div style={{ width: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</div>
                  <img src={track.coverUrl} alt={track.title} style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{track.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{track.plays} plays</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
              You haven't uploaded any tracks yet.
            </div>
          )}
        </div>

        {/* Right Column: Stats & Concerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Artist Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Monthly Listeners</span>
                <span style={{ fontWeight: 'bold' }}>{user.monthlyListeners || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Plays</span>
                <span style={{ fontWeight: 'bold' }}>{user.totalPlays || 0}</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Upcoming Concerts</h3>
            {concerts && concerts.length > 0 ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {concerts.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <Calendar className="w-5 h-5 text-accent" style={{ color: 'var(--accent)' }}/>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{c.city}, {c.country}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(c.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                 ))}
               </div>
            ) : (
               <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No upcoming concerts added.</p>
            )}
          </div>
        </div>

      </div>

      {/* Edit Drawer / Modal */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', justifyContent: 'flex-end'
        }}>
          <div style={{
            width: '400px', height: '100%', background: 'var(--bg-primary)',
            padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>Edit Artist Profile</h2>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Bio</label>
                <textarea
                  rows="4"
                  value={editForm.artistBio}
                  onChange={(e) => setEditForm({...editForm, artistBio: e.target.value})}
                  className="input-field"
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Website</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                  className="input-field"
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Instagram Link</label>
                <input
                  type="url"
                  value={editForm.instagram}
                  onChange={(e) => setEditForm({...editForm, instagram: e.target.value})}
                  className="input-field"
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Twitter Link</label>
                <input
                  type="url"
                  value={editForm.twitter}
                  onChange={(e) => setEditForm({...editForm, twitter: e.target.value})}
                  className="input-field"
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, padding: '12px', borderRadius: '30px' }}>Cancel</button>
                <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '30px' }}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ArtistDashboard;
