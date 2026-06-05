'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { ArrowLeft, Save, Send, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { slugify, formatDateTime } from '@/lib/utils'

export default function EditBlogPage() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [tags, setTags] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [updatedAt, setUpdatedAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const supabase = createClient()

  const blogId = params?.id as string

  useEffect(() => {
    if (blogId) {
      fetchBlog()
    }
  }, [blogId])

  const fetchBlog = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', blogId)
        .single()

      if (error) throw error

      setTitle(data.title)
      setSlug(data.slug)
      setExcerpt(data.excerpt || '')
      setContent(data.content)
      setMetaTitle(data.meta_title || '')
      setMetaDescription(data.meta_description || '')
      setTags(data.tags?.join(', ') || '')
      setStatus(data.status)
      setUpdatedAt(data.updated_at)
    } catch (error) {
      console.error('Error fetching blog:', error)
      alert('Failed to load blog post')
      router.push('/admin/blogs')
    } finally {
      setLoading(false)
    }
  }

  const saveBlog = async (newStatus: 'draft' | 'published') => {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }

    setSaving(true)

    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)

      const { error } = await supabase
        .from('blogs')
        .update({
          title,
          slug: slug || slugify(title),
          excerpt,
          content,
          status: newStatus,
          meta_title: metaTitle || title,
          meta_description: metaDescription || excerpt,
          tags: tagsArray,
        })
        .eq('id', blogId)

      if (error) throw error

      router.push('/admin/blogs')
    } catch (error: any) {
      console.error('Error saving blog:', error)
      alert(error.message || 'Failed to save blog post')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this blog post?')) return

    try {
      const { error } = await supabase.from('blogs').delete().eq('id', blogId)
      if (error) throw error
      router.push('/admin/blogs')
    } catch (error) {
      console.error('Error deleting blog:', error)
      alert('Failed to delete blog post')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy dark:border-blue" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/blogs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-clash font-bold text-navy dark:text-blue">
              Edit Blog Post
            </h1>
            {updatedAt && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {formatDateTime(updatedAt)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button
            variant="outline"
            onClick={() => saveBlog('draft')}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={() => saveBlog('published')} disabled={saving}>
            <Send className="w-4 h-4 mr-2" />
            {status === 'published' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title..."
            className="text-2xl font-clash font-bold h-14"
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="auto-generated-from-title"
          />
          <p className="text-xs text-gray-500">
            Preview: /blog/{slug || 'your-post-slug'}
          </p>
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary of your post..."
            rows={3}
          />
        </div>

        {/* Content Editor */}
        <div className="space-y-2">
          <Label>Content *</Label>
          <TipTapEditor content={content} onChange={setContent} />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="ai, automation, workflow (comma-separated)"
          />
        </div>

        {/* SEO Section */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
          <h3 className="text-lg font-clash font-bold text-navy dark:text-blue mb-4">
            SEO Settings
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={title || 'Same as post title'}
                maxLength={60}
              />
              <p className="text-xs text-gray-500">
                {metaTitle.length}/60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={excerpt || 'Same as excerpt'}
                rows={2}
                maxLength={160}
              />
              <p className="text-xs text-gray-500">
                {metaDescription.length}/160 characters
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}