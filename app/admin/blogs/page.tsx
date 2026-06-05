'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Blog {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  view_count: number
  created_at: string
  updated_at: string
  author: {
    full_name: string
  } | null
}

interface BlogResponse {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  view_count: number
  created_at: string
  updated_at: string
  author: Array<{
    full_name: string
  }>
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchBlogs()
  }, [statusFilter])

  const fetchBlogs = async () => {
    try {
      let query = supabase
        .from('blogs')
        .select(`
          id,
          title,
          slug,
          status,
          view_count,
          created_at,
          updated_at,
          author:author_id(full_name)
        `)
        .order('updated_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Transform the response to match our Blog type
      const transformedData: Blog[] = (data || []).map((item: BlogResponse) => ({
        ...item,
        author: item.author?.[0] || null,
      }))
      
      setBlogs(transformedData)
    } catch (error) {
      console.error('Error fetching blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return

    try {
      const { error } = await supabase.from('blogs').delete().eq('id', id)
      if (error) throw error
      fetchBlogs()
    } catch (error) {
      console.error('Error deleting blog:', error)
    }
  }

  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy dark:border-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-clash font-bold text-navy dark:text-blue">
            Blog Posts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your blog content
          </p>
        </div>
        <Link href="/admin/blogs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'published' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('published')}
            size="sm"
          >
            Published
          </Button>
          <Button
            variant={statusFilter === 'draft' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('draft')}
            size="sm"
          >
            Drafts
          </Button>
        </div>
      </div>

      {/* Table */}
      {filteredBlogs.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery
              ? 'No posts found matching your search.'
              : 'No blog posts yet. Create your first one!'}
          </p>
          {!searchQuery && (
            <Link href="/admin/blogs/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Post
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBlogs.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/blogs/${blog.id}`}
                      className="hover:text-blue transition-colors"
                    >
                      {blog.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={blog.status === 'published' ? 'success' : 'secondary'}
                    >
                      {blog.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {Array.isArray(blog.author) && blog.author.length > 0
                      ? blog.author[0]?.full_name || 'Unknown'
                      : blog.author?.full_name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      {blog.view_count}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(blog.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/blogs/${blog.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(blog.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Stats Footer */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>
          Showing {filteredBlogs.length} of {blogs.length} posts
        </div>
        <div>
          {blogs.filter((b) => b.status === 'published').length} published •{' '}
          {blogs.filter((b) => b.status === 'draft').length} drafts
        </div>
      </div>
    </div>
  )
}