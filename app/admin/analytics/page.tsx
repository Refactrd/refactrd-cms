'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import {
  Eye, FileText, Briefcase, TrendingUp,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react'

interface Stats {
  totalViews: number
  totalBlogs: number
  totalCaseStudies: number
  totalCareers: number
  publishedBlogs: number
  publishedCaseStudies: number
  openCareers: number
}

interface ViewDataPoint {
  date: string
  blogs: number
  caseStudies: number
}

interface TopContent {
  title: string
  views: number
  type: string
}

interface ContentMix {
  name: string
  value: number
  color: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-gray-400 dark:text-gray-500 text-xs font-mono mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500 dark:text-gray-400 font-mono">{p.name}:</span>
          <span className="text-gray-900 dark:text-white font-mono font-bold">{(p.value || 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent, sub, change }: {
  label: string
  value: number
  icon: any
  accent: string
  sub?: string
  change?: number
}) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (value === 0) return
    let current = 0
    const step = Math.max(1, Math.ceil(value / 60))
    const timer = setInterval(() => {
      current = Math.min(current + step, value)
      setDisplayed(current)
      if (current >= value) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [value])

  return (
    <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 overflow-hidden group hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300">
      {/* Accent glow - light mode subtle, dark mode stronger */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-500"
        style={{ background: accent }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
          >
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full ${
              change >= 0
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
            }`}>
              {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <p className="text-gray-400 dark:text-gray-500 text-xs font-mono uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-4xl font-mono font-bold text-gray-900 dark:text-white tracking-tight">
          {displayed.toLocaleString()}
        </p>
        {sub && (
          <p className="text-gray-400 dark:text-gray-600 text-xs font-mono mt-1">{sub}</p>
        )}
      </div>
    </div>
  )
}

function getLast8Months() {
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (7 - i))
    return {
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
    }
  })
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats>({
    totalViews: 0, totalBlogs: 0, totalCaseStudies: 0, totalCareers: 0,
    publishedBlogs: 0, publishedCaseStudies: 0, openCareers: 0,
  })
  const [viewsData, setViewsData] = useState<ViewDataPoint[]>([])
  const [topContent, setTopContent] = useState<TopContent[]>([])
  const [contentMix, setContentMix] = useState<ContentMix[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { fetchAnalytics() }, [])

  const fetchAnalytics = async () => {
    try {
      const [blogsRes, csRes, careersRes] = await Promise.all([
        supabase.from('blogs').select('id, title, status, view_count, created_at'),
        supabase.from('case_studies').select('id, title, status, view_count, created_at'),
        supabase.from('careers').select('id, job_title, status, view_count, created_at'),
      ])

      const blogs = blogsRes.data || []
      const cs = csRes.data || []
      const careers = careersRes.data || []

      const totalBlogViews = blogs.reduce((s, b) => s + (b.view_count || 0), 0)
      const totalCSViews = cs.reduce((s, c) => s + (c.view_count || 0), 0)
      const totalCareerViews = careers.reduce((s, c) => s + (c.view_count || 0), 0)

      setStats({
        totalViews: totalBlogViews + totalCSViews + totalCareerViews,
        totalBlogs: blogs.length,
        totalCaseStudies: cs.length,
        totalCareers: careers.length,
        publishedBlogs: blogs.filter(b => b.status === 'published').length,
        publishedCaseStudies: cs.filter(c => c.status === 'published').length,
        openCareers: careers.filter(c => c.status === 'open').length,
      })

      const months = getLast8Months()
      setViewsData(months.map(({ label, start, end }) => ({
        date: label,
        blogs: blogs.filter(b => new Date(b.created_at) >= start && new Date(b.created_at) < end)
          .reduce((s, b) => s + (b.view_count || 0), 0),
        caseStudies: cs.filter(c => new Date(c.created_at) >= start && new Date(c.created_at) < end)
          .reduce((s, c) => s + (c.view_count || 0), 0),
      })))

      const allContent = [
        ...blogs.map(b => ({ title: b.title, views: b.view_count || 0, type: 'Blog' })),
        ...cs.map(c => ({ title: c.title, views: c.view_count || 0, type: 'Case Study' })),
        ...careers.map(c => ({ title: c.job_title, views: c.view_count || 0, type: 'Career' })),
      ]
      setTopContent(allContent.sort((a, b) => b.views - a.views).slice(0, 6))

      setContentMix([
        { name: 'Blogs', value: blogs.length, color: '#3b82f6' },
        { name: 'Case Studies', value: cs.length, color: '#a78bfa' },
        { name: 'Careers', value: careers.length, color: '#10b981' },
      ])
    } catch (err) {
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  const typeColors: Record<string, string> = {
    Blog: '#3b82f6',
    'Case Study': '#a78bfa',
    Career: '#10b981',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
          <span className="font-mono text-gray-400 dark:text-gray-500 text-sm">
            Loading analytics...
          </span>
        </div>
      </div>
    )
  }

  // Chart axis/grid colors adapt to theme via CSS vars
  const axisColor = 'var(--chart-axis)'
  const gridColor = 'var(--chart-grid)'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest mb-1">
            Overview
          </p>
          <h1 className="text-3xl font-clash font-bold text-navy dark:text-blue">
            Analytics
          </h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-gray-500 dark:text-gray-400 text-xs">Live data</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Views" value={stats.totalViews} icon={Eye} accent="#3b82f6" change={12} sub="Across all content" />
        <StatCard label="Blog Posts" value={stats.totalBlogs} icon={FileText} accent="#a78bfa" sub={`${stats.publishedBlogs} published`} />
        <StatCard label="Case Studies" value={stats.totalCaseStudies} icon={TrendingUp} accent="#f59e0b" sub={`${stats.publishedCaseStudies} published`} />
        <StatCard label="Job Postings" value={stats.totalCareers} icon={Briefcase} accent="#10b981" sub={`${stats.openCareers} open`} />
      </div>

      {/* Area Chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-mono text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest mb-1">
              Performance
            </p>
            <h2 className="font-clash font-bold text-gray-900 dark:text-white text-xl">
              Views Over Time
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {[{ label: 'Blogs', color: '#3b82f6' }, { label: 'Case Studies', color: '#a78bfa' }].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-3 h-0.5 rounded-full" style={{ background: color }} />
                <span className="font-mono text-gray-400 dark:text-gray-500 text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={viewsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="blogGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="csGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="blogs" name="Blogs" stroke="#3b82f6" strokeWidth={2} fill="url(#blogGrad)" dot={false} activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
            <Area type="monotone" dataKey="caseStudies" name="Case Studies" stroke="#a78bfa" strokeWidth={2} fill="url(#csGrad)" dot={false} activeDot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bar + Pie */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="mb-6">
            <p className="font-mono text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest mb-1">
              Breakdown
            </p>
            <h2 className="font-clash font-bold text-gray-900 dark:text-white text-xl">
              Top Content by Views
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topContent} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" vertical={false} />
              <XAxis
                dataKey="title"
                tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.length > 14 ? v.slice(0, 14) + '…' : v}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="views" name="Views" radius={[6, 6, 0, 0]}>
                {topContent.map((entry, i) => (
                  <Cell key={i} fill={typeColors[entry.type] || '#3b82f6'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="mb-4">
            <p className="font-mono text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest mb-1">
              Distribution
            </p>
            <h2 className="font-clash font-bold text-gray-900 dark:text-white text-xl">
              Content Mix
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={contentMix} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {contentMix.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" fillOpacity={0.9} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {contentMix.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                  <span className="font-mono text-gray-500 dark:text-gray-400 text-xs">{item.name}</span>
                </div>
                <span className="font-mono text-gray-900 dark:text-white font-bold text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <p className="font-mono text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest mb-1">
            Rankings
          </p>
          <h2 className="font-clash font-bold text-gray-900 dark:text-white text-xl">
            Most Viewed Content
          </h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {topContent.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-mono text-gray-300 dark:text-gray-600 text-sm">
                No content data yet
              </p>
            </div>
          ) : (
            topContent.map((item, index) => (
              <div
                key={index}
                className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
              >
                <span className="font-mono text-gray-300 dark:text-gray-600 text-sm w-6 text-right flex-shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-clash font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
                    {item.title}
                  </p>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full font-mono text-xs flex-shrink-0"
                  style={{
                    background: `${typeColors[item.type]}15`,
                    color: typeColors[item.type],
                    border: `1px solid ${typeColors[item.type]}30`,
                  }}
                >
                  {item.type}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0 w-20 justify-end">
                  <Eye className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                  <span className="font-mono text-gray-900 dark:text-white font-bold text-sm">
                    {item.views.toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}