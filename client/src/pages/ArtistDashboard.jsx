import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Play, Pause, Disc, Calendar, Edit2, UploadCloud, Plus, Globe, Facebook, Twitter, Instagram, CheckCircle, Crown, Sparkles, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import TrackCard from '../components/TrackCard';
import SkeletonLoader from '../components/SkeletonLoader';

const ArtistDashboard = () => {
  const { user: currentUser, API_URL, token, currentTrack, isPlaying, togglePlay, playTrack, showToast, setActiveView } = useContext(AppContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const isOwnProfile = !id || (currentUser && id === currentUser._id);
  const artistId = id || currentUser?._id;

  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publicProfile, setPublicProfile] = useState(null);
  
  // Follow/unfollow states
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    artistBio: '',
    website: '',
    instagram: '',
    twitter: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Creator Onboarding State
  const [onboardName, setOnboardName] = useState(currentUser?.name || '');
  const [onboardBio, setOnboardBio] = useState('');
  const [onboardWebsite, setOnboardWebsite] = useState('');
  const [onboardFacebook, setOnboardFacebook] = useState('');
  const [onboardTwitter, setOnboardTwitter] = useState('');
  const [onboardInstagram, setOnboardInstagram] = useState('');
  const [onboardAvatar, setOnboardAvatar] = useState(null);
  const [onboardBanner, setOnboardBanner] = useState(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  useEffect(() => {
    fetchArtistContent();
  }, [id, currentUser]);

  useEffect(() => {
    const activeProfile = isOwnProfile ? currentUser?.artistProfile : publicProfile?.artistProfile;
    if (activeProfile) {
      setEditForm({
        artistBio: activeProfile.artistBio || '',
        website: activeProfile.website || '',
        instagram: activeProfile.instagram || '',
        twitter: activeProfile.twitter || ''
      });
    }
  }, [publicProfile, currentUser, isOwnProfile]);

  const fetchArtistContent = async () => {
    if (!artistId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (isOwnProfile) {
        // Fetch authenticated user's private creator content
        const [tracksRes, albumsRes] = await Promise.all([
          fetch(`${API_URL}/tracks/my-uploads`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/playlists/my-playlists`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (tracksRes.ok) {
          const data = await tracksRes.json();
          setTracks(data);
        }
        if (albumsRes.ok) {
          const data = await albumsRes.json();
          setAlbums(data);
        }
        if (currentUser?.artistProfile) {
          setConcerts(currentUser.artistProfile.concerts || []);
        }
      } else {
        // Fetch public artist's profile details and content
        const res = await fetch(`${API_URL}/auth/users/${artistId}`);
        if (!res.ok) throw new Error('Failed to load artist details');
        const data = await res.json();
        
        setPublicProfile(data.user);
        setTracks(data.tracks || []);
        setAlbums(data.playlists || []);
        
        if (data.user?.artistProfile) {
          setConcerts(data.user.artistProfile.concerts || []);
        }
        
        // Handle following state
        const followersList = data.user?.followers || [];
        setFollowersCount(followersList.length);
        if (currentUser) {
          const hasFollowed = followersList.some(f => (f._id || f) === currentUser._id);
          setIsFollowing(hasFollowed);
        }
      }
    } catch (err) {
      console.error('Error fetching artist content:', err);
      showToast('Error loading creator content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);

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

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!onboardName.trim()) {
      return showToast('Artist Name is required', 'error');
    }
    setIsOnboarding(true);
    const formData = new FormData();
    formData.append('artistName', onboardName.trim());
    formData.append('artistBio', onboardBio.trim());
    formData.append('website', onboardWebsite.trim());
    formData.append('facebook', onboardFacebook.trim());
    formData.append('twitter', onboardTwitter.trim());
    formData.append('instagram', onboardInstagram.trim());
    if (onboardAvatar) {
      formData.append('artistAvatar', onboardAvatar);
    }
    if (onboardBanner) {
      formData.append('artistBanner', onboardBanner);
    }

    try {
      const res = await fetch(`${API_URL}/artists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Congratulations! Artist profile created successfully.');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast(data.message || 'Failed to create artist profile', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error creating artist profile', 'error');
    } finally {
      setIsOnboarding(false);
    }
  };

  const toggleFollow = async () => {
    if (!token) {
      return showToast('Please log in to follow creators.', 'error');
    }
    try {
      const res = await fetch(`${API_URL}/auth/users/${artistId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to follow/unfollow');
      const data = await res.json();
      setIsFollowing(data.isFollowing);
      setFollowersCount(data.followersCount);
      showToast(data.message);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px' }}>
        <SkeletonLoader type="detail" count={5} />
      </div>
    );
  }

  // Handle case where we are viewing a standard user's profile at /artist-dashboard/:id
  if (!isOwnProfile && publicProfile && !publicProfile.artistProfile) {
    return (
      <div style={{
        maxWidth: '650px',
        margin: '60px auto',
        padding: '32px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        <User className="w-16 h-16 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Artist Profile Not Found
        </h3>
        <p style={{ fontSize: '14px', marginBottom: '24px' }}>
          <strong>{publicProfile.name}</strong> is currently a Listener and does not have an active artist profile.
        </p>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setActiveView(`profile/${publicProfile._id}`);
            navigate(`/pages/profile/${publicProfile._id}`);
          }}
          style={{ padding: '10px 24px', borderRadius: '24px' }}
        >
          View Standard Listener Profile
        </button>
      </div>
    );
  }

  // Onboarding Wizard for logged-in users without active profiles
  if (isOwnProfile && (!currentUser || !currentUser.artistProfile)) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '32px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--glass-shadow)',
        color: 'var(--text-primary)',
        animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            color: '#fff',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(108, 92, 231, 0.3)'
          }}>
            <Disc className="w-8 h-8 animate-spin-slow" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Claim Your Artist Identity
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '500px', margin: '0 auto' }}>
            Join the Musico creator community. Share your music, build an audience, and track real-time analytics.
          </p>
        </div>

        <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Avatar and Banner Upload Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Avatar Dropzone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Artist Profile Avatar</label>
              <div 
                style={{
                  height: '160px',
                  borderRadius: '16px',
                  border: '2px dashed var(--border-color)',
                  background: avatarPreview ? `url(${avatarPreview}) center/cover no-repeat` : 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s'
                }}
                onClick={() => document.getElementById('onboard-avatar-input').click()}
              >
                {!avatarPreview && (
                  <>
                    <UploadCloud className="w-8 h-8" style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Upload Avatar (Square)</span>
                  </>
                )}
                {avatarPreview && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    fontSize: '11px',
                    textAlign: 'center',
                    padding: '4px'
                  }}>Change Photo</div>
                )}
                <input 
                  id="onboard-avatar-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setOnboardAvatar(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
            </div>

            {/* Banner Dropzone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Artist Dashboard Banner</label>
              <div 
                style={{
                  height: '160px',
                  borderRadius: '16px',
                  border: '2px dashed var(--border-color)',
                  background: bannerPreview ? `url(${bannerPreview}) center/cover no-repeat` : 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s'
                }}
                onClick={() => document.getElementById('onboard-banner-input').click()}
              >
                {!bannerPreview && (
                  <>
                    <UploadCloud className="w-8 h-8" style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Upload Banner (Wide)</span>
                  </>
                )}
                {bannerPreview && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    fontSize: '11px',
                    textAlign: 'center',
                    padding: '4px'
                  }}>Change Banner</div>
                )}
                <input 
                  id="onboard-banner-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setOnboardBanner(file);
                      setBannerPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Artist Name *</label>
            <input 
              type="text"
              placeholder="e.g. DJ Shadow, Daft Punk, Lana Del Rey"
              value={onboardName}
              onChange={(e) => setOnboardName(e.target.value)}
              required
              className="form-input"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
                fontSize: '15px'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Bio / Description</label>
            <textarea 
              placeholder="Tell the world your musical journey, influences, and what drives your sound..."
              value={onboardBio}
              onChange={(e) => setOnboardBio(e.target.value)}
              rows="3"
              className="form-input"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
                fontSize: '15px',
                resize: 'none'
              }}
            />
          </div>

          {/* Social Links & Connections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Website Link</label>
              <input 
                type="url"
                placeholder="https://myband.com"
                value={onboardWebsite}
                onChange={(e) => setOnboardWebsite(e.target.value)}
                className="form-input"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Instagram Username</label>
              <input 
                type="text"
                placeholder="@myhandle"
                value={onboardInstagram}
                onChange={(e) => setOnboardInstagram(e.target.value)}
                className="form-input"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Twitter Username</label>
              <input 
                type="text"
                placeholder="@myhandle"
                value={onboardTwitter}
                onChange={(e) => setOnboardTwitter(e.target.value)}
                className="form-input"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Facebook Page</label>
              <input 
                type="url"
                placeholder="https://facebook.com/myband"
                value={onboardFacebook}
                onChange={(e) => setOnboardFacebook(e.target.value)}
                className="form-input"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isOnboarding}
            className="btn btn-primary"
            style={{
              padding: '14px',
              borderRadius: '30px',
              fontSize: '16px',
              fontWeight: '700',
              marginTop: '16px',
              cursor: isOnboarding ? 'not-allowed' : 'pointer',
              opacity: isOnboarding ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'var(--accent-shadow)'
            }}
          >
            {isOnboarding ? 'Launching Creator Profile...' : 'Claim Artist Identity'}
          </button>
        </form>
      </div>
    );
  }

  // Active Artist Profile View
  const profile = isOwnProfile ? currentUser?.artistProfile : publicProfile?.artistProfile;

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
          border: '4px solid var(--bg-tertiary)',
          flexShrink: 0
        }}>
          {profile.artistAvatar ? (
            <img src={profile.artistAvatar} alt={profile.artistName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', color: 'var(--text-muted)' }}>
              {profile.artistName?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
              {isOwnProfile ? 'Creator Dashboard' : 'Artist Profile'}
            </span>
            {profile.isArtistVerified && (
              <span className="user-badge" style={{ fontSize: '10px', padding: '2px 8px', margin: 0, display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                <CheckCircle className="w-3 h-3 fill-current" /> Verified Artist
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '42px', margin: '8px 0', fontWeight: '900', color: '#fff', fontFamily: 'Outfit' }}>{profile.artistName}</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
            {profile.artistBio || 'Welcome to the artist catalog.'}
          </p>
        </div>
        
        {isOwnProfile ? (
          <button
            className="btn btn-secondary"
            onClick={() => setIsEditModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '30px', flexShrink: 0 }}
          >
            <Edit2 className="w-4 h-4" /> Edit Creator Profile
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={toggleFollow}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '30px', flexShrink: 0 }}
          >
            {isFollowing ? 'Unfollow Creator' : 'Follow Creator'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>

        {/* Left Column: Tracks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Discography</h2>
            </div>
            {tracks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tracks.map((track, idx) => (
                  <div 
                    key={track._id} 
                    onClick={() => playTrack(track, tracks)}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', transition: 'background 0.2s', cursor: 'pointer' }} 
                    className="hover-bg-tertiary"
                  >
                    <div style={{ width: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</div>
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt={track.title} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Disc className="w-5 h-5 text-muted" />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{track.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{track.plays?.toLocaleString() || 0} streams</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <UploadCloud className="w-12 h-12 text-muted" />
                <div>
                  <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No Tracks Uploaded</h3>
                  <p style={{ fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>Start building your catalog by uploading your first track.</p>
                </div>
                {isOwnProfile && (
                  <button className="btn btn-primary" onClick={() => { setActiveView('upload'); navigate('/pages/upload'); }}>
                    <Plus className="w-4 h-4" /> Upload New Track
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Albums & Compilations</h2>
            </div>
            {albums.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {albums.map((album, idx) => (
                  <div 
                    key={album._id} 
                    onClick={() => {
                      setActivePlaylistId(album._id);
                      setActiveView('playlist-details');
                      navigate('/pages/playlist-details');
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', transition: 'background 0.2s', cursor: 'pointer' }} 
                    className="hover-bg-tertiary"
                  >
                    <div style={{ width: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</div>
                    {album.coverUrl ? (
                      <img src={album.coverUrl} alt={album.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Disc className="w-5 h-5 text-muted" />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{album.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{album.tracks?.length || 0} tracks</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <Disc className="w-12 h-12 text-muted" />
                <div>
                  <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No Albums Created</h3>
                  <p style={{ fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>Group your uploaded tracks into albums to share with fans.</p>
                </div>
                {isOwnProfile && (
                  <button className="btn btn-primary" onClick={() => { setActiveView('upload'); navigate('/pages/upload'); }}>
                    <Plus className="w-4 h-4" /> Create New Album
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Stats & Concerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', textTransform: 'uppercase', color: 'var(--accent)' }}>Creator Statistics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Followers</span>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>{followersCount?.toLocaleString() || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Monthly Listeners</span>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>{(isOwnProfile ? currentUser?.monthlyListeners : publicProfile?.monthlyListeners)?.toLocaleString() || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Lifetime Streams</span>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>{(isOwnProfile ? currentUser?.totalPlays : publicProfile?.totalPlays)?.toLocaleString() || 0}</span>
              </div>
            </div>
            
            {/* Social Website connection icons */}
            {(profile.website || profile.instagram || profile.twitter) && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} className="hover:text-accent" title="Website">
                    <Globe className="w-5 h-5" />
                  </a>
                )}
                {profile.instagram && (
                  <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} className="hover:text-accent" title="Instagram">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {profile.twitter && (
                  <a href={`https://twitter.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} className="hover:text-accent" title="Twitter">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', textTransform: 'uppercase', color: 'var(--accent)' }}>Live Gigs & Tours</h3>
            {concerts && concerts.length > 0 ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {concerts.map((c, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: i < concerts.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: i < concerts.length - 1 ? '12px' : 0 }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <Calendar className="w-5 h-5 text-accent" style={{ color: 'var(--accent)', marginTop: '2px' }}/>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{c.title}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.venue} • {c.city}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{c.date}</div>
                        </div>
                      </div>
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '12px', borderRadius: '12px', marginTop: '4px', textDecoration: 'none' }}>
                          Get Tickets
                        </a>
                      )}
                    </div>
                 ))}
               </div>
            ) : (
               <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                 <Calendar className="w-8 h-8 text-muted" />
                 <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No upcoming live shows added.</div>
                 {isOwnProfile && (
                   <button 
                     className="btn btn-secondary btn-sm" 
                     onClick={() => {
                       setActiveView(`profile`);
                       navigate(`/pages/profile`);
                     }}
                     style={{ padding: '6px 12px', borderRadius: '12px', fontSize: '12px' }}
                   >
                     Add Event via Profile
                   </button>
                 )}
               </div>
            )}
          </div>
        </div>

      </div>

      {/* Edit Drawer / Modal */}
      {isOwnProfile && isEditModalOpen && (
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
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Website</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                  className="input-field"
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Instagram Username / Link</label>
                <input
                  type="text"
                  value={editForm.instagram}
                  onChange={(e) => setEditForm({...editForm, instagram: e.target.value})}
                  className="input-field"
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Twitter Username / Link</label>
                <input
                  type="text"
                  value={editForm.twitter}
                  onChange={(e) => setEditForm({...editForm, twitter: e.target.value})}
                  className="input-field"
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', outline: 'none' }}
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
