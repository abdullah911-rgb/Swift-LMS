import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getImageUrl } from '../../constants';
import { IoPersonOutline, IoKeyOutline, IoMailOutline, IoCallOutline } from 'react-icons/io5';

const StudentProfile = () => {
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
            setAvatarPreview(getImageUrl(profile.avatar));
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Failed to load profile data.');
      }
    };
    fetchProfile();
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
        toast.success('Profile details updated successfully!');
        // Update user state context
        setUser(res.data.data.user);
        if (res.data.data.user.avatar) {
          setAvatarPreview(getImageUrl(res.data.data.user.avatar));
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
        // Sign out user or clear state
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

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-heading font-bold text-primary-900">My Profile Settings</h1>
        <p className="text-sm text-slate-500">Manage your registration information, bio description, and password details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Card: Info Update */}
        <Card hover={false} className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-6">
            <IoPersonOutline size={18} className="text-primary-700" />
            <h3 className="text-base font-bold text-slate-800">Profile Information</h3>
          </div>

          <form onSubmit={handleInfoSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-2 border-primary-100" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-heading font-bold text-2xl border-2 border-primary-200">
                    {user?.name?.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
              <div className="space-y-1.5 text-center sm:text-left">
                <h4 className="text-sm font-bold text-slate-800">Profile Picture</h4>
                <p className="text-xs text-slate-400">JPG, PNG format (Max 2MB)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
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

              {/* Email (Read Only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  Email Address <span className="text-[10px] text-slate-400 capitalize">(Locked)</span>
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
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
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biography</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Write a brief overview of your background, experience, or certifications..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-primary-600 text-sm resize-none"
              ></textarea>
            </div>

            <div className="pt-2 border-t border-slate-50">
              <Button type="submit" variant="primary" size="md" disabled={savingInfo}>
                {savingInfo ? 'Saving Details...' : 'Save Profile Details'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Right Card: Password Settings */}
        <Card hover={false} className="bg-white border border-slate-100 p-6 rounded-2xl">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-6">
            <IoKeyOutline size={18} className="text-accent-600" />
            <h3 className="text-base font-bold text-slate-800">Security Credentials</h3>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* Current Password */}
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

            {/* New Password */}
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

            {/* Confirm Password */}
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
  );
};

export default StudentProfile;
