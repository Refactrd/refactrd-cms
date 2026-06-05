'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { MediaUpload } from '@/components/media/MediaUpload'
import { ArrowLeft, Save, Send, Loader2, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { slugify } from '@/lib/utils'
import Image from 'next/image'

interface Metric {
  label: string
  value: string
}

export default function NewCaseStudyPage() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [clientName, setClientName] = useState('')
  const [industry, setIndustry] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [challenge, setChallenge] = useState('')
  const [solution, setSolution] = useState('')
  const [results, setResults] = useState('')
  const [testimonial, setTestimonial] = useState('')
  const [testimonialAuthor, setTestimonialAuthor] = useState('')
  const [metrics, setMetrics] = useState<Metric[]>([{ label: '', value: '' }])
  const [featuredImage, setFeaturedImage] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [tags, setTags] = useState('')
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

  const addMetric = () => {
    setMetrics([...metrics, { label: '', value: '' }])
  }

  const removeMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index))
  }

  const updateMetric = (index: number, field: 'label' | 'value', value: string) => {
    const newMetrics = [...metrics]
    newMetrics[index][field] = value
    setMetrics(newMetrics)
  }

  const saveCaseStudy = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title',
        variant: 'destructive',
      })
      return
    }

    if (!clientName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a client name',
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

      const validMetrics = metrics.filter((m) => m.label && m.value)

      const { data, error } = await supabase
        .from('case_studies')
        .insert({
          title,
          slug: slug || slugify(title),
          client_name: clientName,
          industry,
          excerpt,
          problem: challenge,
          solution: solution,
          results: results,
          testimonial_quote: testimonial || null,
          testimonial_author: testimonialAuthor || null,
          metrics: validMetrics.length > 0 ? validMetrics : null,
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
        description: `Case study ${status === 'published' ? 'published' : 'saved as draft'}`,
        variant: 'success',
      })

      router.push('/admin/case-studies')
    } catch (error: any) {
      console.error('Error saving case study:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save case study',
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
          <Link href="/admin/case-studies">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-clash font-bold text-navy dark:text-blue">
              New Case Study
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => saveCaseStudy('draft')}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button onClick={() => saveCaseStudy('published')} disabled={loading}>
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
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Project name or key achievement..."
              className="text-2xl font-clash font-bold h-14"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Company or client name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Fintech, E-commerce, Healthcare"
            />
          </div>
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
            Preview: /case-studies/{slug || 'your-case-study-slug'}
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
            placeholder="Brief summary of the case study..."
            rows={3}
          />
        </div>

        {/* Challenge */}
        <div className="space-y-2">
          <Label>Challenge</Label>
          <TipTapEditor
            content={challenge}
            onChange={setChallenge}
            placeholder="What problem did the client face?"
          />
        </div>

        {/* Solution */}
        <div className="space-y-2">
          <Label>Solution</Label>
          <TipTapEditor
            content={solution}
            onChange={setSolution}
            placeholder="How did you solve it?"
          />
        </div>

        {/* Results */}
        <div className="space-y-2">
          <Label>Results</Label>
          <TipTapEditor
            content={results}
            onChange={setResults}
            placeholder="What were the outcomes?"
          />
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Key Metrics</Label>
            <Button type="button" variant="outline" size="sm" onClick={addMetric}>
              <Plus className="w-4 h-4 mr-2" />
              Add Metric
            </Button>
          </div>
          {metrics.map((metric, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Label (e.g., Revenue Growth)"
                value={metric.label}
                onChange={(e) => updateMetric(index, 'label', e.target.value)}
              />
              <Input
                placeholder="Value (e.g., 150%)"
                value={metric.value}
                onChange={(e) => updateMetric(index, 'value', e.target.value)}
              />
              {metrics.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMetric(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <h3 className="text-lg font-clash font-bold text-navy dark:text-blue mb-4">
            Testimonial (Optional)
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testimonial">Quote</Label>
              <Textarea
                id="testimonial"
                value={testimonial}
                onChange={(e) => setTestimonial(e.target.value)}
                placeholder="Client testimonial..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testimonialAuthor">Author</Label>
              <Input
                id="testimonialAuthor"
                value={testimonialAuthor}
                onChange={(e) => setTestimonialAuthor(e.target.value)}
                placeholder="Name and title (e.g., John Doe, CEO)"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="ai, automation, fintech (comma-separated)"
          />
        </div>

        {/* SEO Section */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
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
                placeholder={title || 'Same as case study title'}
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