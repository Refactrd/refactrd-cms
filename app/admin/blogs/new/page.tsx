'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { MediaUpload } from '@/components/media/MediaUpload'
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { slugify } from '@/lib/utils'
import Image from 'next/image'
import { useToast } from '@/lib/hooks/useToast'

export default function NewBlogPage() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [tags, setTags] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoSlug, setAutoSlug] = useState(true)
  const [showImageUpload, setShowImageUpload] = useState(false)

  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (autoSlug) {
      setSlug(slugify(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setAutoSlug(false)
    setSlug(slugify(value))
  }

  const handleImageUpload = (url: string) => {
    setFeaturedImage(url)
    setShowImageUpload(false)
    toast({
      title: 'Success',
      description: 'Featured image uploaded',
      variant: 'success',
    })
  }

  const saveBlog = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)

      const { data, error } = await supabase
        .from('blogs')
        .insert({
          title,
          slug: slug || slugify(title),
          excerpt,
          content,
          status,
          meta_title: metaTitle || title,
          meta_description: metaDescription || excerpt,
          tags: tagsArray,
          featured_image_url: featuredImage || null,
          author_id: user?.id,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Success',
        description: `Blog post ${status === 'published' ? 'published' : 'saved as draft'}`,
        variant: 'success',
      })

      router.push('/admin/blogs')
    } catch (error: any) {
      console.error('Error saving blog:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save blog post',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
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
              New Blog Post
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => saveBlog('draft')}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button onClick={() => saveBlog('published')} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Publish
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
            onChange={(e) => handleTitleChange(e.target.value)}
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
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="auto-generated-from-title"
          />
          <p className="text-xs text-gray-500">
            Preview: /blog/{slug || 'your-post-slug'}
          </p>
        </div>

        {/* Featured Image */}
        <div className="space-y-2">
          <Label>Featured Image</Label>
          {featuredImage ? (
            <div className="space-y-2">
              <div className="relative w-full h-64 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <Image
                  src={featuredImage}
                  alt="Featured"
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeaturedImage('')}
              >
                Remove Image
              </Button>
            </div>
          ) : showImageUpload ? (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <MediaUpload onUploadComplete={handleImageUpload} />
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowImageUpload(true)}
            >
              Upload Featured Image
            </Button>
          )}
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