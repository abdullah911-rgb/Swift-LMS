import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { IoPersonOutline, IoKeyOutline, IoMailOutline, IoCallOutline, IoVideocamOutline } from 'react-icons/io5';

const InstructorProfile = () => {
  const { user, setUser } = useAuth();
  
  // Profile Info States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Zoom Integration States
  const [zoomConnected, setZoomConnected] = useState(false);
  const [zoomEmail, setZoomEmail] = useState('');
  const [loadingZoom, setLoadingZoom] = useState(true);
  const [disconnectingZoom, setDisconnectingZoom] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        if (res.data?.data?.user) {
          const profile = res.data.data.user;
          setName(profile.name || '');
          setPhone(profile.phone || '');
          setBio(profile.bio || '');
          if (profile.avatar) {
            setAvatarPreview(profile.avatar.startsWith('/') ? `http://localhost:5000${profile.avatar}` : profile.avatar);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Failed to load profile data.');
      }
    };

    const fetchZoomStatus = async () => {
      try {
        const res = await api.get('/zoom/oauth/status');
        if (res.data?.success) {
          setZoomConnected(res.data.data.connected);
          setZoomEmail(res.data.data.email || '');
        }
      } catch (err) {
        console.error('Error fetching Zoom status:', err);
      } finally {
        setLoadingZoom(false);
      }
    };

    fetchProfile();
    fetchZoomStatus();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const zoomStatus = params.get('zoom');
    if (zoomStatus === 'connected') {
      toast.success('Successfully connected your Zoom account!');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (zoomStatus === 'error') {
      const msg = params.get('message') || 'Failed to connect Zoom account.';
      toast.error(`Zoom connection failed: ${msg}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('bio', bio);
      if (avatar) {
        formData.append('avatar', avatar);
      }

      const res = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        toast.success('Instructor profile updated successfully!');
        setUser(res.data.data.user);
        if (res.data.data.user.avatar) {
          const avatarUrl = res.data.data.user.avatar;
          setAvatarPreview(avatarUrl.startsWith('/') ? `http://localhost:5000${avatarUrl}` : avatarUrl);
        }
      }
    } catch (err) {
      console.error('Error saving profile details:', err);
      toast.error(err.response?.data?.message || 'Failed to update details.');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match.');
    }
    setSavingPassword(true);
    try {
      const res = await api.put('/users/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.data?.success) {
        toast.success('Password changed successfully! Please log in again.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Error updating password:', err);
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleConnectZoom = async () => {
    try {
      const res = await api.get('/zoom/oauth/connect');
      if (res.data?.success && res.data.data.oauthUrl) {
        window.location.href = res.data.data.oauthUrl;
      } else {
        toast.error('Failed to get connection URL.');
      }
    } catch (err) {
      console.error('Error getting OAuth URL:', err);
      toast.error('Failed to initiate Zoom login. Please verify config.');
    }
  };

  const handleDisconnectZoom = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Zoom account? You will not be able to host live classes until you reconnect.')) {
      return;
    }
    setDisconnectingZoom(true);
    try {
      const res = await api.delete('/zoom/oauth/disconnect');
      if (res.data?.success) {
        setZoomConnected(false);
        setZoomEmail('');
        toast.success('Zoom account disconnected successfully.');
      }
    } catch (err) {
      console.error('Error disconnecting Zoom:', err);
      toast.error('Failed to disconnect Zoom account.');
    } finally {
      setDisconnectingZoom(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-heading font-bold text-primary-900">Instructor Settings</h1>
        <p className="text-sm text-slate-500">Manage your trainer details, professional biography, profile photo, and credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Profile Details */}
        <Card hover={false} className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-6">
            <IoPersonOutline size={18} className="text-primary-700" />
            <h3 className="text-base font-bold text-slate-800">Trainer Information</h3>
          </div>

          <form onSubmit={handleInfoSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-2 border-primary-100" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-heading font-bold text-2xl border-2 border-emerald-200">
                    {user?.name?.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
              <div className="space-y-1.5 text-center sm:text-left">
                <h4 className="text-sm font-bold text-slate-800">Trainer Photo</h4>
                <p className="text-xs text-slate-400">JPG, PNG format (Max 2MB)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="instructor-avatar-upload"
                />
                <label
                  htmlFor="instructor-avatar-upload"
                  className="inline-block px-3 py-1.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Choose File
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  Email Address <span className="text-[10px] text-slate-400 (Locked)"></span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <IoMailOutline size={16} />
                  </span>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-sm focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <IoCallOutline size={16} />
                  </span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Professional Biography (Bio)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Describe your expertise, teaching experience, and safety accreditations..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm resize-none"
              ></textarea>
            </div>

            <div className="pt-2 border-t border-slate-50">
              <Button type="submit" variant="primary" size="md" disabled={savingInfo}>
                {savingInfo ? 'Saving settings...' : 'Save Profile details'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Sidebar Info Columns */}
        <div className="space-y-6">
          {/* Zoom Integration */}
          <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-6">
              <IoVideocamOutline size={18} className="text-primary-700" />
              <h3 className="text-base font-bold text-slate-800">Zoom Integration</h3>
            </div>

            {loadingZoom ? (
              <div className="py-4 text-center text-xs text-slate-400 animate-pulse">
                Checking integration status...
              </div>
            ) : zoomConnected ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-800 text-xs leading-relaxed">
                  <p className="font-bold mb-1">Status: Active & Connected</p>
                  <p>All classes you start will be created under your connected account: <strong className="break-all">{zoomEmail}</strong>.</p>
                </div>
                <Button
                  onClick={handleDisconnectZoom}
                  variant="secondary"
                  size="md"
                  className="w-full text-red-650 hover:text-red-700 hover:bg-red-50 border-red-200"
                  disabled={disconnectingZoom}
                >
                  {disconnectingZoom ? 'Disconnecting...' : 'Disconnect Zoom Account'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-slate-500 text-xs leading-relaxed">
                  Connect your Zoom account so that your live classrooms are hosted on your own account.
                </div>
                <Button
                  onClick={handleConnectZoom}
                  variant="primary"
                  size="md"
                  className="w-full bg-gradient-to-r from-blue-600 to-primary-600 text-white"
                >
                  Connect Zoom Account
                </Button>
              </div>
            )}
          </Card>

          {/* Security Credentials */}
          <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-6">
              <IoKeyOutline size={18} className="text-accent-600" />
              <h3 className="text-base font-bold text-slate-800">Security Credentials</h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm"
                />
              </div>

              <div className="pt-2 border-t border-slate-50">
                <Button type="submit" variant="primary" size="md" className="w-full" disabled={savingPassword}>
                  {savingPassword ? 'Changing Password...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfile;
