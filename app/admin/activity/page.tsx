'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/hooks/useToast'
import { Input } from '@/components/ui/input'
import {
  Search, FileText, FolderKanban, Briefcase,
  Image, User, Plus, Edit, Trash2, Eye,
  Send, Save, Archive, Filter, X,
  Activity
} from 'lucide-react'

interface ActivityLog {
  id: string
  action: string
  content_type: string
  content_id: string
  details: Record<string, any> | null
  created_at: string
  user: {
    full_name: string
    avatar_url: string | null
    role: string
  } | null
}

// ── CONFIG ────────────────────────────────────────────────
const ACTION_CONFIG: Record<string, {
  label: string
  icon: any
  color: string
  bg: string
}> = {
  created:   { label: 'Created',   icon: Plus,    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  updated:   { label: 'Updated',   icon: Edit,    color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-500/10' },
  deleted:   { label: 'Deleted',   icon: Trash2,  color: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-500/10' },
  published: { label: 'Published', icon: Send,    color: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-500/10' },
  drafted:   { label: 'Drafted',   icon: Save,    color: 'text-gray-600 dark:text-gray-400',       bg: 'bg-gray-50 dark:bg-gray-800' },
  archived:  { label: 'Archived',  icon: Archive, color: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-50 dark:bg-orange-500/10' },
  viewed:    { label: 'Viewed',    icon: Eye,     color: 'text-gray-400 dark:text-gray-500',       bg: 'bg-gray-50 dark:bg-gray-800' },
  uploaded:  { label: 'Uploaded',  icon: Image,   color: 'text-teal-600 dark:text-teal-400',       bg: 'bg-teal-50 dark:bg-teal-500/10' },
  login:     { label: 'Logged in', icon: User,    color: 'text-gray-500 dark:text-gray-400',       bg: 'bg-gray-50 dark:bg-gray-800' },
}

const ENTITY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  blog:         { label: 'Blog',        icon: FileText,     color: 'text-blue-500' },
  case_study:   { label: 'Case Study',  icon: FolderKanban, color: 'text-violet-500' },
  career:       { label: 'Career',      icon: Briefcase,    color: 'text-emerald-500' },
  media:        { label: 'Media',       icon: Image,        color: 'text-teal-500' },
  user:         { label: 'User',        icon: User,         color: 'text-gray-500' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getInitials(name: string) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function ActivityRow({ log }: { log: ActivityLog }) {
  const action = ACTION_CONFIG[log.action] || ACTION_CONFIG.updated
  const entity = ENTITY_CONFIG[log.content_type] || ENTITY_CONFIG.blog
  const ActionIcon = action.icon
  const EntityIcon = entity.icon
  const title = log.details?.title || log.details?.name || log.details?.job_title || null

  return (
    <div className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
      {/* Action icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${action.bg}`}>
        <ActionIcon className={`w-4 h-4 ${action.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-clash font-bold text-gray-900 dark:text-white text-sm">
            {log.user?.full_name || 'Unknown'}
          </span>
          <span className={`font-mono text-xs font-semibold ${action.color}`}>
            {action.label}
          </span>
          <span className="flex items-center gap-1">
            <EntityIcon className={`w-3.5 h-3.5 ${entity.color}`} />
            <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
              {entity.label}
            </span>
          </span>
        </div>

        {title && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            "{title}"
          </p>
        )}
      </div>

      {/* Avatar + time */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-mono text-xs text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors whitespace-nowrap">
          {timeAgo(log.created_at)}
        </span>
        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {log.user?.avatar_url ? (
            <img src={log.user.avatar_url} alt={log.user?.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-clash font-bold text-gray-500 dark:text-gray-400 text-xs">
              {getInitials(log.user?.full_name || '')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [filterEntity, setFilterEntity] = useState('all')
  const [page, setPage] = useState(1)
  const PER_PAGE = 20
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          id,
          action,
          content_type,
          content_id,
          details,
          created_at,
          user:user_id (
            full_name,
            avatar_url,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error
      setLogs((data || []) as unknown as ActivityLog[])
    } catch (error) {
      console.error('Activity log error:', error)
      toast({ title: 'Error', description: 'Failed to load activity', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Filter
  const filtered = logs.filter((log) => {
    const matchesAction = filterAction === 'all' || log.action === filterAction
    const matchesEntity = filterEntity === 'all' || log.content_type === filterEntity
    const title = log.details?.title || log.details?.name || ''
    const matchesSearch = !searchQuery ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesAction && matchesEntity && matchesSearch
  })

  // Pagination
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const hasFilters = filterAction !== 'all' || filterEntity !== 'all' || searchQuery

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-clash font-bold text-navy dark:text-blue">
            Activity
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
            {hasFilters && ' matching filters'}
          </p>
        </div>

        {hasFilters && (
          <button
            onClick={() => { setSearchQuery(''); setFilterAction('all'); setFilterEntity('all'); setPage(1) }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear filters
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by content or user..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>

        {/* Action filter */}
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-navy dark:focus:border-blue"
        >
          <option value="all">All Actions</option>
          {Object.entries(ACTION_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        {/* Entity filter */}
        <select
          value={filterEntity}
          onChange={(e) => { setFilterEntity(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-navy dark:focus:border-blue"
        >
          <option value="all">All Content</option>
          {Object.entries(ENTITY_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Log list */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy dark:border-blue" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-20">
            <Activity className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="font-clash font-bold text-gray-400 dark:text-gray-500">
              No activity found
            </p>
            <p className="text-sm text-gray-300 dark:text-gray-600 mt-1">
              {hasFilters ? 'Try adjusting your filters' : 'Activity will appear here as you use the CMS'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginated.map((log) => (
              <ActivityRow key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs text-gray-400 dark:text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-clash font-semibold border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-clash font-semibold border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Fix missing import
