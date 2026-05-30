import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Music, Play, Crown, Heart } from 'lucide-react';
import PlaylistCover from '../components/PlaylistCover';
import SkeletonLoader from '../components/SkeletonLoader';
import { useParams } from 'react-router-dom';

const Profile = () => {
  const { API_URL, playTrack, showToast, setActivePlaylistId, setActiveView, user: currentUser, token, updateUser } = useContext(AppContext);
  const { id } = useParams();
  const activeProfileId = id || currentUser?._id;

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const [activeTab, setActiveTab] = useState('liked'); // 'liked', 'playlists', 'followers', 'following', 'edit-profile'

  // Standard User Profile Edit States
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedUserAvatar, setEditedUserAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (activeProfileId) {
      fetchProfileDetails(activeProfileId);
    } else {
      setLoading(false);
    }
  }, [activeProfileId, currentUser]);

  useEffect(() => {
    if (profileData && profileData.user) {
      setEditedName(profileData.user.name || '');
      setEditedEmail(profileData.user.email || '');
      setEditedUserAvatar(profileData.user.userAvatar || '');
    }
  }, [profileData]);

  // Set isFollowing state on load
  useEffect(() => {
    if (profileData && profileData.user && currentUser) {
      const followersList = profileData.user.followers || [];
      const hasFollowed = followersList.some(f => (f._id || f) === currentUser._id);
      setIsFollowing(hasFollowed);
      setFollowersCount(followersList.length);
    }
  }, [profileData, currentUser]);

  const fetchProfileDetails = async (targetId) => {
    if (!targetId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/users/${targetId}`);
      if (!res.ok) throw new Error('Failed to load profile details');
      const data = await res.json();
      setProfileData(data);
      if (data.user) {
        setFollowersCount(data.user.followers?.length || 0);
        if (currentUser) {
          const hasFollowed = data.user.followers?.some(f => (f._id || f) === currentUser._id);
          setIsFollowing(hasFollowed);
        }
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserProfile = async (e) => {
    e.preventDefault();
    if (!editedName.trim()) return showToast('Name is required', 'error');

    setProfileSaving(true);
    const formData = new FormData();
    formData.append('name', editedName.trim());
    if (editedEmail.trim()) formData.append('email', editedEmail.trim());
    if (editedUserAvatar.trim()) formData.append('userAvatar', editedUserAvatar.trim());
    if (avatarFile) formData.append('userAvatar', avatarFile);

    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Profile update failed');
      }

      const data = await res.json();
      updateUser(data.user);
      setProfileData(prev => prev ? {
        ...prev,
        user: {
          ...prev.user,
          name: data.user.name,
          email: data.user.email,
          userAvatar: data.user.userAvatar
        }
      } : prev);
      showToast('Profile updated successfully!');
      setActiveTab('liked');
      setAvatarFile(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const toggleFollow = async () => {
    if (!token) {
      return showToast('Please log in to follow other users.', 'error');
    }
    try {
      const res = await fetch(`${API_URL}/auth/users/${activeProfileId}/follow`, {
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

  if (!profileData || !profileData.user) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
        <Music className="w-16 h-16 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
        <h3>User Profile Not Found</h3>
      </div>
    );
  }

  const { user, playlists } = profileData;
  const isOwnProfile = currentUser && activeProfileId === currentUser._id;
  const joinDate = new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Sleek User Profile Glassmorphic Header */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(13, 21, 39, 0.95) 0%, rgba(108, 92, 231, 0.15) 100%)',
          borderRadius: '20px',
          padding: '40px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--glass-shadow)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '200px'
        }}
      >
        {isOwnProfile && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10
          }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setActiveTab('edit-profile'); }}
              style={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                borderRadius: '20px'
              }}
            >
              Edit Profile
            </button>
          </div>
        )}

        {/* User Avatar */}
        {user.userAvatar ? (
          <img 
            src={user.userAvatar} 
            alt={user.name} 
            style={{
              width: '110px',
              height: '110px',
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
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              fontFamily: 'Outfit',
              fontWeight: '800',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
              flexShrink: 0
            }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: '5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="user-badge" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
              <Crown style={{ width: '12px', height: '12px' }} /> Premium Listener
            </span>
          </div>

          <h1 style={{ 
            fontSize: '36px', 
            fontFamily: 'Outfit', 
            fontWeight: '800', 
            color: '#fff',
            margin: 0
          }}>
            {user.name}
          </h1>

          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Joined {joinDate}</span>
            <span>•</span>
            <span><strong>{user.likedTracks?.length || 0}</strong> Liked Songs</span>
            <span>•</span>
            <span><strong>{playlists.length || 0}</strong> Playlists</span>
            <span>•</span>
            <span><strong>{followersCount}</strong> Followers</span>
            
            {!isOwnProfile && (
              <button
                onClick={toggleFollow}
                className="btn btn-secondary"
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  borderRadius: '20px',
                  marginLeft: '12px'
                }}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'liked', label: 'Liked Songs' },
          { id: 'playlists', label: 'Playlists' },
          { id: 'followers', label: `Followers (${followersCount})` },
          { id: 'following', label: `Following (${user.following?.length || 0})` },
          ...(isOwnProfile ? [{ id: 'edit-profile', label: 'Edit Profile' }] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 4px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '3px solid var(--accent)' : '3px solid transparent',
              transition: 'all var(--transition-fast)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB RENDERING */}
      
      {/* TAB: LIKED SONGS */}
      {activeTab === 'liked' && (
        user.likedTracks && user.likedTracks.length > 0 ? (
          <section style={{ animation: 'fadeIn 0.3s ease' }}>
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
                {user.likedTracks.map((track, idx) => (
                  <tr key={track._id} onClick={() => playTrack(track, user.likedTracks)} style={{ cursor: 'pointer' }}>
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
                          <div className="table-artist" style={{ color: 'var(--text-secondary)' }}>{track.artistName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-genre">{track.genre}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" onClick={(e) => { e.stopPropagation(); playTrack(track, user.likedTracks); }}>
                        <Play fill="currentColor" className="w-3 h-3" style={{ transform: 'translateX(1px)' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No liked songs yet.
          </div>
        )
      )}

      {/* TAB: PLAYLISTS */}
      {activeTab === 'playlists' && (
        playlists.length > 0 ? (
          <section style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="grid-container">
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
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No playlists found on this profile.
          </div>
        )
      )}

      {/* TAB: FOLLOWERS */}
      {activeTab === 'followers' && (
        <section style={{ animation: 'fadeIn 0.3s ease' }}>
          {user.followers && user.followers.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
              {user.followers.map((f) => (
                <div 
                  key={f._id}
                  className="artist-card"
                  onClick={() => {
                    setActiveView(`profile/${f._id}`);
                  }}
                  style={{ height: '160px', padding: '16px', cursor: 'pointer' }}
                >
                  {f.userAvatar ? (
                    <img src={f.userAvatar} alt={f.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                      {f.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>{f.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No followers yet.
            </div>
          )}
        </section>
      )}

      {/* TAB: FOLLOWING */}
      {activeTab === 'following' && (
        <section style={{ animation: 'fadeIn 0.3s ease' }}>
          {user.following && user.following.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
              {user.following.map((f) => (
                <div 
                  key={f._id}
                  className="artist-card"
                  onClick={() => {
                    setActiveView(`profile/${f._id}`);
                  }}
                  style={{ height: '160px', padding: '16px', cursor: 'pointer' }}
                >
                  {f.userAvatar ? (
                    <img src={f.userAvatar} alt={f.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                      {f.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>{f.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Not following anyone yet.
            </div>
          )}
        </section>
      )}

      {/* TAB: EDIT PROFILE */}
      {activeTab === 'edit-profile' && isOwnProfile && (
        <section style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxShadow: 'var(--glass-shadow)',
            maxWidth: '650px',
            margin: '0 auto'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Manage Your Profile</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Update your public display name, email, and upload a profile picture.
            </p>
            
            <form onSubmit={handleUpdateUserProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Profile Avatar Upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {avatarFile ? (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--accent)', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', padding: '4px', textAlign: 'center' }}>
                    New File Selected
                  </div>
                ) : editedUserAvatar ? (
                  <img src={editedUserAvatar} alt={editedName} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '28px', fontWeight: 'bold' }}>
                    {editedName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Profile Avatar Picture</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="profile-avatar-upload" 
                      style={{ display: 'none' }} 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAvatarFile(e.target.files[0]);
                          setEditedUserAvatar('');
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => document.getElementById('profile-avatar-upload').click()}
                      style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '6px' }}
                    >
                      Choose Image File
                    </button>
                    {avatarFile && (
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm" 
                        style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        onClick={() => setAvatarFile(null)}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar URL alternative */}
              {!avatarFile && (
                <div className="form-group">
                  <label className="form-label">Avatar Image URL (Alternative)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://images.unsplash.com/... or upload a file above"
                    value={editedUserAvatar}
                    onChange={(e) => setEditedUserAvatar(e.target.value)}
                    style={{ paddingLeft: '14px', fontSize: '13px' }}
                  />
                </div>
              )}

              {/* Name */}
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Your display name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  style={{ paddingLeft: '14px', fontSize: '13px' }}
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Your email address"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  style={{ paddingLeft: '14px', fontSize: '13px' }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontSize: '13px', borderRadius: '24px', alignSelf: 'flex-start', marginTop: '10px' }}
                disabled={profileSaving}
              >
                {profileSaving ? 'Saving profile changes...' : 'Save Profile Changes'}
              </button>

            </form>
          </div>
        </section>
      )}

    </div>
  );
};

export default Profile;
