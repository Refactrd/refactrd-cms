'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  User, Mail, Lock, Camera, Loader2,
  ShieldCheck, Save, Eye, EyeOff
} from 'lucide-react'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Avatar state
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setAvatarUrl(profile.avatar_url || '')
    }
    if (user) {
      setEmail(user.email || '')
    }
  }, [profile, user])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `avatars/${user.id}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('cms-media')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('cms-media')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      toast({ title: 'Success', description: 'Profile photo updated', variant: 'success' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to upload photo', variant: 'destructive' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast({ title: 'Error', description: 'Name cannot be empty', variant: 'destructive' })
      return
    }

    setSavingProfile(true)
    try {
      // Update users table
      const { error: profileError } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user?.id)

      if (profileError) throw profileError

      // Update email if changed
      if (email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email })
        if (emailError) throw emailError
        toast({
          title: 'Verify your email',
          description: 'A confirmation link has been sent to your new email address.',
          variant: 'success',
        })
      } else {
        toast({ title: 'Success', description: 'Profile updated successfully', variant: 'success' })
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update profile', variant: 'destructive' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast({ title: 'Error', description: 'Please enter a new password', variant: 'destructive' })
      return
    }
    if (newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }

    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast({ title: 'Success', description: 'Password changed successfully', variant: 'success' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to change password', variant: 'destructive' })
    } finally {
      setSavingPassword(false)
    }
  }

  const getInitials = () => {
    if (!fullName) return 'U'
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-clash font-bold text-navy dark:text-blue">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Manage your account and preferences
        </p>
      </div>

      {/* ── PROFILE SECTION ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {/* Section header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="font-clash font-bold text-gray-900 dark:text-white text-base">
              Profile
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Update your personal information
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-clash font-bold text-2xl text-gray-400 dark:text-gray-500">
                    {getInitials()}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 w-7 h-7 bg-navy dark:bg-blue rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
              >
                {uploadingAvatar
                  ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  : <Camera className="w-3.5 h-3.5 text-white" />
                }
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-clash font-semibold text-gray-900 dark:text-white text-sm">
                Profile Photo
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                JPG, PNG or GIF. Max 5MB.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-500 font-semibold mt-1 hover:text-blue-600 transition-colors"
              >
                Change photo
              </button>
            </div>
          </div>

          {/* Role badge */}
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
              Role:
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold rounded-full capitalize border border-emerald-200 dark:border-emerald-500/20">
              {profile?.role || 'admin'}
            </span>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="pl-9"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Changing your email will require verification.
            </p>
          </div>

          {/* Account created */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              Account created:{' '}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : '—'
              }
            </p>
          </div>

          <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
            {savingProfile
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              : <><Save className="w-4 h-4 mr-2" /> Save Profile</>
            }
          </Button>
        </div>
      </div>

      {/* ── PASSWORD SECTION ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-50 dark:bg-orange-500/10 rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h2 className="font-clash font-bold text-gray-900 dark:text-white text-base">
              Password
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Change your account password
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="pl-9 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength indicator */}
            {newPassword && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[
                    newPassword.length >= 8,
                    /[A-Z]/.test(newPassword),
                    /[0-9]/.test(newPassword),
                    /[^A-Za-z0-9]/.test(newPassword),
                  ].map((met, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        met ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {newPassword.length < 8
                    ? 'Too short'
                    : !/[A-Z]/.test(newPassword)
                    ? 'Add an uppercase letter'
                    : !/[0-9]/.test(newPassword)
                    ? 'Add a number'
                    : !/[^A-Za-z0-9]/.test(newPassword)
                    ? 'Add a special character'
                    : 'Strong password'}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className={`pl-9 pr-9 ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-red-300 dark:border-red-500 focus:border-red-400'
                    : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={savingPassword || !newPassword || !confirmPassword}
            variant="outline"
            className="w-full"
          >
            {savingPassword
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Changing Password...</>
              : <><Lock className="w-4 h-4 mr-2" /> Change Password</>
            }
          </Button>
        </div>
      </div>

      {/* ── DANGER ZONE ── */}
      <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/50">
          <h2 className="font-clash font-bold text-red-600 dark:text-red-400 text-base">
            Danger Zone
          </h2>
          <p className="text-xs text-red-400 dark:text-red-500 mt-0.5">
            Irreversible actions. Proceed with caution.
          </p>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="font-clash font-semibold text-gray-900 dark:text-white text-sm">
              Sign out of all devices
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Revokes all active sessions across every device.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={async () => {
              await supabase.auth.signOut({ scope: 'global' })
              window.location.href = '/login'
            }}
          >
            Sign Out All
          </Button>
        </div>
      </div>
    </div>
  )
}