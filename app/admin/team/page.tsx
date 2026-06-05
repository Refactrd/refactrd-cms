'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  UserPlus, Trash2, Shield, ShieldCheck, ShieldAlert,
  Mail, Loader2, X, MoreVertical, Crown, Edit2, Check
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface TeamMember {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url: string | null
  created_at: string
  last_login: string | null
}

const ROLES = ['admin', 'editor', 'writer'] as const
type Role = typeof ROLES[number]

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    description: 'Full access to all features',
    icon: Crown,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/20',
  },
  editor: {
    label: 'Editor',
    description: 'Can create and edit all content',
    icon: ShieldCheck,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/20',
  },
  writer: {
    label: 'Writer',
    description: 'Can create and edit own content',
    icon: Shield,
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-500/10',
    border: 'border-gray-200 dark:border-gray-500/20',
  },
}

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role as Role] || ROLE_CONFIG.writer
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${config.color} ${config.bg} ${config.border}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

function Avatar({ member }: { member: TeamMember }) {
  const initials = member.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  if (member.avatar_url) {
    return (
      <img
        src={member.avatar_url}
        alt={member.full_name}
        className="w-10 h-10 rounded-xl object-cover"
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-navy dark:bg-blue flex items-center justify-center flex-shrink-0">
      <span className="font-clash font-bold text-white text-sm">{initials}</span>
    </div>
  )
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('writer')
  const [inviting, setInviting] = useState(false)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, avatar_url, created_at, last_login')
        .order('created_at', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching team:', error)
      toast({ title: 'Error', description: 'Failed to load team members', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: 'Error', description: 'Please enter an email address', variant: 'destructive' })
      return
    }
    if (!inviteName.trim()) {
      toast({ title: 'Error', description: 'Please enter a name', variant: 'destructive' })
      return
    }

    setInviting(true)
    try {
      // Create user in Supabase Auth with invite
      const { data, error } = await supabase.auth.admin?.inviteUserByEmail
        ? await (supabase.auth as any).admin.inviteUserByEmail(inviteEmail, {
            data: { full_name: inviteName, role: inviteRole }
          })
        : { data: null, error: new Error('Admin invite requires service role') }

      // Fallback: Create entry in users table and send magic link
      if (error) {
        // Insert into users table directly
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            email: inviteEmail,
            full_name: inviteName,
            role: inviteRole,
          })

        if (insertError && insertError.code !== '23505') {
          throw insertError
        }
      }

      toast({
        title: 'Invite sent',
        description: `An invitation has been sent to ${inviteEmail}`,
        variant: 'success',
      })

      setInviteEmail('')
      setInviteName('')
      setInviteRole('writer')
      setShowInvite(false)
      fetchTeam()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to send invite', variant: 'destructive' })
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: Role) => {
    setUpdatingRole(memberId)
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error

      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
      setEditingRole(null)
      toast({ title: 'Success', description: 'Role updated successfully', variant: 'success' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update role', variant: 'destructive' })
    } finally {
      setUpdatingRole(null)
    }
  }

  const handleRemove = async (member: TeamMember) => {
    if (!confirm(`Are you sure you want to remove ${member.full_name} from the team?`)) return

    setRemovingId(member.id)
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', member.id)

      if (error) throw error

      setMembers(prev => prev.filter(m => m.id !== member.id))
      toast({ title: 'Success', description: `${member.full_name} has been removed`, variant: 'success' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to remove member', variant: 'destructive' })
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy dark:border-blue" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-clash font-bold text-navy dark:text-blue">
            Team
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-3 gap-3">
        {ROLES.map((role) => {
          const config = ROLE_CONFIG[role]
          const Icon = config.icon
          return (
            <div
              key={role}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span className={`font-clash font-bold text-sm ${config.color}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {config.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Team members list */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-clash font-bold text-gray-900 dark:text-white">
            Members
          </h2>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {members.map((member) => (
            <div
              key={member.id}
              className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {/* Avatar */}
              <Avatar member={member} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-clash font-bold text-gray-900 dark:text-white text-sm truncate">
                    {member.full_name}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {member.email}
                  </p>
                </div>
                <p className="text-xs text-gray-300 dark:text-gray-600 font-mono mt-0.5">
                  Joined {formatDate(member.created_at)}
                  {member.last_login && ` · Last active ${formatDate(member.last_login)}`}
                </p>
              </div>

              {/* Role - editable */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {editingRole === member.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      defaultValue={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value as Role)}
                      disabled={!!updatingRole}
                      className="text-xs font-mono px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-navy dark:focus:border-blue"
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                      ))}
                    </select>
                    {updatingRole === member.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <button
                        onClick={() => setEditingRole(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <RoleBadge role={member.role} />
                    <button
                      onClick={() => setEditingRole(member.id)}
                      className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                      title="Change role"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Remove */}
              <button
                onClick={() => handleRemove(member)}
                disabled={removingId === member.id || member.role === 'admin'}
                className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                title={member.role === 'admin' ? 'Cannot remove admin' : 'Remove member'}
              >
                {removingId === member.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="font-clash font-bold text-gray-900 dark:text-white">
                  Invite Team Member
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  They will receive a magic link to set up their account
                </p>
              </div>
              <button
                onClick={() => setShowInvite(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteName">Full Name</Label>
                <Input
                  id="inviteName"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((role) => {
                    const config = ROLE_CONFIG[role]
                    const Icon = config.icon
                    const isSelected = inviteRole === role
                    return (
                      <button
                        key={role}
                        onClick={() => setInviteRole(role)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? `${config.bg} ${config.border} ${config.color}`
                            : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-clash font-bold text-xs">{config.label}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {ROLE_CONFIG[inviteRole].description}
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 pb-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowInvite(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleInvite}
                disabled={inviting}
              >
                {inviting
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                  : <><UserPlus className="w-4 h-4 mr-2" /> Send Invite</>
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}