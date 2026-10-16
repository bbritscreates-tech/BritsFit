import React, { useState } from 'react';
import {
  FamilyProfile,
  AuthUserProfile,
  CloudSyncStatus,
} from '../../types/fitness';
import { db } from '../../services/db';
import {
  signInWithGoogle,
  signOutUser,
} from '../../services/firebase';
import { Modal } from './Modal';
import { BritsFitLogo } from './BritsFitLogo';
import {
  Users,
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Cloud,
  CloudCheck,
  CloudAlert,
  RefreshCw,
  LogOut,
  Shield,
  Check,
} from 'lucide-react';

interface FamilyProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: AuthUserProfile | null;
  syncStatus: CloudSyncStatus;
  profiles: FamilyProfile[];
  activeProfileId: string;
}

const PRESET_COLORS = [
  '#1677E8', // Electric blue
  '#12B8C7', // Teal
  '#102B55', // Deep navy
  '#8B5CF6', // Purple
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#EF4444', // Red
];

const PRESET_EMOJIS = ['⚡', '🏃', '🏋️', '🚴', '🏊', '🧘', '🌟', '🥊', '🧗', '🔥'];

export const FamilyProfilesModal: React.FC<FamilyProfilesModalProps> = ({
  isOpen,
  onClose,
  authUser,
  syncStatus,
  profiles,
  activeProfileId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Partner');
  const [avatarColor, setAvatarColor] = useState('#1677E8');
  const [avatarEmoji, setAvatarEmoji] = useState('⚡');
  const [isSyncing, setIsSyncing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setRelationship('Partner');
    setAvatarColor('#1677E8');
    setAvatarEmoji('⚡');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleOpenEdit = (p: FamilyProfile) => {
    setEditingId(p.id);
    setName(p.name);
    setRelationship(p.relationship);
    setAvatarColor(p.avatarColor);
    setAvatarEmoji(p.avatarEmoji || '⚡');
    setIsEditing(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProfile: FamilyProfile = {
      id: editingId || `profile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      relationship,
      avatarColor,
      avatarEmoji,
      isPrimary: editingId ? profiles.find((p) => p.id === editingId)?.isPrimary : false,
      createdAt: editingId ? (profiles.find((p) => p.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveFamilyProfile(newProfile);
    resetForm();
  };

  const handleDeleteProfile = (id: string, name: string) => {
    if (profiles.length <= 1) {
      alert('You must have at least one family profile.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete profile "${name}"? Existing data linked to this profile will remain archived.`)) {
      db.deleteFamilyProfile(id);
    }
  };

  const handleSwitchProfile = (id: string) => {
    db.setActiveProfile(id);
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in could not be completed. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    await db.pushLocalDataToCloud();
    setTimeout(() => setIsSyncing(false), 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account & Family Profiles"
      subtitle="Google cloud sync and independent family member tracking"
      maxWidth="lg"
    >
      <div className="space-y-6 text-sm">
        {/* BritsFit Brand Identity Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#102B55] to-[#163B6F] text-white flex items-center justify-between shadow-xs">
          <BritsFitLogo size="sm" showText={true} lightText={true} />
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#12B8C7]">
              Multi-Device Cloud
            </span>
          </div>
        </div>

        {/* Google Cloud Account Card */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {authUser?.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt={authUser.displayName || 'User'}
                  className="w-12 h-12 rounded-full border-2 border-[#1677E8]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#102B55] flex items-center justify-center text-white font-bold text-lg border-2 border-[#1677E8]">
                  {authUser?.displayName?.charAt(0) || 'B'}
                </div>
              )}
              <div>
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{authUser ? authUser.displayName || 'Google Account' : 'Guest / Local Storage Mode'}</span>
                  {authUser && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Cloud Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {authUser?.email || 'Sign in with Google to back up data across your phone & desktop.'}
                </p>
              </div>
            </div>

            {authUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Sign out of Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* Sync Status Banner */}
          <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {syncStatus === 'synced' ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cloud synced & up to date
                </span>
              ) : syncStatus === 'syncing' || isSyncing ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#1677E8] font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Syncing with BritsFit cloud...
                </span>
              ) : syncStatus === 'local_only' ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-[#12B8C7]" />
                  Offline / Local safe storage active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-500">
                  <CloudAlert className="w-3.5 h-3.5" />
                  Sync alert (Offline or reconnecting)
                </span>
              )}
            </div>

            {authUser ? (
              <button
                type="button"
                onClick={handleForceSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1677E8] hover:text-[#12B8C7] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Now
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1677E8] hover:bg-[#1361BD] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <svg className="w-3.5 h-3.5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Sign In with Google
              </button>
            )}
          </div>

          {authError && (
            <div className="mt-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-800">
              {authError}
            </div>
          )}
        </div>

        {/* Family Member Profiles Header */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1677E8]" />
                Family Member Accounts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Each family member has independent workouts, cardio, body measurements, and goals.
              </p>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#102B55] hover:bg-[#1677E8] text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Member
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          {isEditing && (
            <form
              onSubmit={handleSaveProfile}
              className="mb-4 p-4 rounded-xl border-2 border-[#1677E8]/40 bg-white dark:bg-slate-900 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Family Profile' : 'New Family Profile'}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah, Dad, Leo"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1677E8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Relationship
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1677E8]"
                  >
                    <option value="Self">Self (Account Owner)</option>
                    <option value="Partner">Partner / Spouse</option>
                    <option value="Child">Child / Teen</option>
                    <option value="Parent">Parent</option>
                    <option value="Other">Other Family Member</option>
                  </select>
                </div>
              </div>

              {/* Avatar Emoji & Color */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Avatar Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatarEmoji(emoji)}
                      className={`w-9 h-9 text-lg rounded-lg border flex items-center justify-center transition-transform ${
                        avatarEmoji === emoji
                          ? 'border-[#1677E8] bg-[#1677E8]/10 scale-110 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Theme Accent Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        avatarColor === c ? 'scale-125 border-white ring-2 ring-[#1677E8]' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#1677E8] hover:bg-[#1361BD] text-white text-xs font-bold transition-colors shadow-xs"
                >
                  {editingId ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </form>
          )}

          {/* Profiles List */}
          <div className="space-y-2.5">
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfileId;
              return (
                <div
                  key={profile.id}
                  onClick={() => handleSwitchProfile(profile.id)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'border-[#1677E8] bg-[#1677E8]/5 dark:bg-[#1677E8]/10 ring-1 ring-[#1677E8]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg text-white font-bold shadow-xs shrink-0"
                      style={{ backgroundColor: profile.avatarColor || '#1677E8' }}
                    >
                      {profile.avatarEmoji || profile.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {profile.name}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1677E8] text-white">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        )}
                        {profile.isPrimary && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {profile.relationship} • Click to switch tracker view
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(profile)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!profile.isPrimary && profiles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteProfile(profile.id, profile.name)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multi-Device Info Box */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p className="font-semibold text-[#102B55] dark:text-[#38E1EE] mb-1 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[#1677E8]" />
            Multi-Device & Family Guarantee
          </p>
          BritsFit data is stored in your private Google Cloud Firestore partition. When you switch to a new phone or open BritsFit on your computer, simply sign in with Google to resume right where you left off. Family profiles keep everyone's fitness logs separate and private.
        </div>
      </div>
    </Modal>
  );
};
