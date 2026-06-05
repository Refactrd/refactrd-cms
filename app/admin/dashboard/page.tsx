'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Briefcase, Users, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalBlogs: 0,
    totalCaseStudies: 0,
    totalCareers: 0,
    totalViews: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        const [blogsCount, caseStudiesCount, careersCount] = await Promise.all([
          supabase.from('blogs').select('*', { count: 'exact', head: true }),
          supabase.from('case_studies').select('*', { count: 'exact', head: true }),
          supabase.from('careers').select('*', { count: 'exact', head: true }),
        ])

        // Get total views
        const { data: blogs } = await supabase.from('blogs').select('view_count')
        const totalViews = blogs?.reduce((sum, blog) => sum + (blog.view_count || 0), 0) || 0

        setStats({
          totalBlogs: blogsCount.count || 0,
          totalCaseStudies: caseStudiesCount.count || 0,
          totalCareers: careersCount.count || 0,
          totalViews,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Total Blogs',
      value: stats.totalBlogs,
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Case Studies',
      value: stats.totalCaseStudies,
      icon: Briefcase,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Open Positions',
      value: stats.totalCareers,
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Total Views',
      value: stats.totalViews,
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy dark:border-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-clash font-bold text-navy dark:text-blue">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back! Here's an overview of your content.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <a
            href="/admin/blogs/new"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-navy dark:hover:border-blue transition-colors cursor-pointer"
          >
            <FileText className="h-8 w-8 text-gray-400 mb-2" />
            <span className="font-medium">New Blog Post</span>
          </a>
          <a
            href="/admin/case-studies/new"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-navy dark:hover:border-blue transition-colors cursor-pointer"
          >
            <Briefcase className="h-8 w-8 text-gray-400 mb-2" />
            <span className="font-medium">New Case Study</span>
          </a>
          <a
            href="/admin/careers/new"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-navy dark:hover:border-blue transition-colors cursor-pointer"
          >
            <Users className="h-8 w-8 text-gray-400 mb-2" />
            <span className="font-medium">New Job Posting</span>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}