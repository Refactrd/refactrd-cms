'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Send, Loader2, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { slugify } from '@/lib/utils'

export default function EditCareerPage() {
  const params = useParams()
  const id = params?.id as string

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [department, setDepartment] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState('')
  const [salary, setSalary] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [aboutCompany, setAboutCompany] = useState([''])
  const [roleDescription, setRoleDescription] = useState([''])
  const [responsibilities, setResponsibilities] = useState([''])
  const [requiredQualifications, setRequiredQualifications] = useState([''])
  const [preferredQualifications, setPreferredQualifications] = useState([''])
  const [benefits, setBenefits] = useState([''])
  const [remuneration, setRemuneration] = useState([''])
  const [successMetrics, setSuccessMetrics] = useState([''])
  const [interviewProcess, setInterviewProcess] = useState([{ step: '', title: '', description: '' }])
  const [closingStatement, setClosingStatement] = useState('')
  const [applicationLink, setApplicationLink] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (id) fetchCareer()
  }, [id])

  const fetchCareer = async () => {
    try {
      const { data, error } = await supabase
        .from('careers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setTitle(data.job_title || '')
      setSlug(data.slug || '')
      setDepartment(data.department || '')
      setLocation(data.location || '')
      setType(data.job_type || '')
      setSalary(data.salary_range || '')
      setShortDescription(data.short_description || '')
      setAboutCompany(data.about_company?.length ? data.about_company : [''])
      setRoleDescription(data.role_description?.length ? data.role_description : [''])
      setResponsibilities(data.responsibilities?.length ? data.responsibilities : [''])
      setRequiredQualifications(data.required_qualifications?.length ? data.required_qualifications : [''])
      setPreferredQualifications(data.preferred_qualifications?.length ? data.preferred_qualifications : [''])
      setBenefits(data.benefits?.length ? data.benefits : [''])
      setRemuneration(data.remuneration?.length ? data.remuneration : [''])
      setSuccessMetrics(data.success_metrics?.length ? data.success_metrics : [''])
      setInterviewProcess(
        data.interview_process?.length
          ? data.interview_process
          : [{ step: '', title: '', description: '' }]
      )
      setClosingStatement(data.closing_statement || '')
      setApplicationLink(data.application_link || '')
    } catch (error) {
      console.error('Error fetching career:', error)
      toast({
        title: 'Error',
        description: 'Failed to load job posting',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const addItem = (setter: Function, items: string[]) => setter([...items, ''])
  const removeItem = (setter: Function, items: string[], index: number) =>
    setter(items.filter((_, i) => i !== index))
  const updateItem = (setter: Function, items: string[], index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    setter(newItems)
  }

  const addInterviewStep = () =>
    setInterviewProcess([...interviewProcess, { step: '', title: '', description: '' }])
  const removeInterviewStep = (index: number) =>
    setInterviewProcess(interviewProcess.filter((_, i) => i !== index))
  const updateInterviewStep = (index: number, field: 'step' | 'title' | 'description', value: string) => {
    const newSteps = [...interviewProcess]
    newSteps[index][field] = value
    setInterviewProcess(newSteps)
  }

  const updateCareer = async (status: 'draft' | 'open' | 'closed' | 'archived') => {
    if (!title.trim()) {
      toast({ title: 'Error', description: 'Please enter a job title', variant: 'destructive' })
      return
    }
    if (!department.trim()) {
      toast({ title: 'Error', description: 'Please enter a department', variant: 'destructive' })
      return
    }
    if (!location.trim()) {
      toast({ title: 'Error', description: 'Please enter a location', variant: 'destructive' })
      return
    }
    if (!type.trim()) {
      toast({ title: 'Error', description: 'Please select a job type', variant: 'destructive' })
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('careers')
        .update({
          job_title: title,
          slug: slug || slugify(title),
          department,
          location,
          job_type: type,
          description: shortDescription,
          salary_range: salary,
          short_description: shortDescription,
          about_company: aboutCompany.filter(Boolean),
          role_description: roleDescription.filter(Boolean),
          responsibilities: responsibilities.filter(Boolean),
          required_qualifications: requiredQualifications.filter(Boolean),
          preferred_qualifications: preferredQualifications.filter(Boolean),
          benefits: benefits.filter(Boolean),
          remuneration: remuneration.filter(Boolean),
          success_metrics: successMetrics.filter(Boolean),
          interview_process: interviewProcess.filter(p => p.title && p.description),
          closing_statement: closingStatement,
          application_link: applicationLink,
          status,
        })
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Success',
        description: `Job posting ${status === 'open' ? 'published' : 'updated'}`,
        variant: 'success',
      })

      router.push('/admin/careers')
    } catch (error: any) {
      console.error('Error updating career:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update job posting',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
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
          <Link href="/admin/careers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-clash font-bold text-navy dark:text-blue">
            Edit Job Posting
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => updateCareer('draft')}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Draft
          </Button>
          <Button onClick={() => updateCareer('open')} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Publish
          </Button>
        </div>
      </div>

      {/* Form - identical structure to create page */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., AI Growth Associate"
              className="text-2xl font-clash font-bold h-14"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., Growth & Business Development"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Remote, Lagos, Hybrid"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Job Type</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-blue"
            >
              <option value="">Select job type</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Salary Range</Label>
            <Input
              id="salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="e.g., ₦80,000 – ₦100,000/month"
            />
          </div>
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated-from-title"
          />
          <p className="text-xs text-gray-500">
            Preview: /careers/{slug || 'your-job-slug'}
          </p>
        </div>

        {/* Short Description */}
        <div className="space-y-2">
          <Label htmlFor="shortDescription">Short Description</Label>
          <Textarea
            id="shortDescription"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Brief summary of the role..."
            rows={3}
          />
        </div>

        {/* About Company */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>About Company</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => addItem(setAboutCompany, aboutCompany)}>
              <Plus className="w-4 h-4 mr-2" />Add Paragraph
            </Button>
          </div>
          {aboutCompany.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Textarea
                placeholder="Paragraph about the company..."
                value={item}
                onChange={(e) => updateItem(setAboutCompany, aboutCompany, index, e.target.value)}
                rows={2}
              />
              {aboutCompany.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(setAboutCompany, aboutCompany, index)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Role Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Role Overview</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => addItem(setRoleDescription, roleDescription)}>
              <Plus className="w-4 h-4 mr-2" />Add Paragraph
            </Button>
          </div>
          {roleDescription.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Textarea
                placeholder="Description of the role..."
                value={item}
                onChange={(e) => updateItem(setRoleDescription, roleDescription, index, e.target.value)}
                rows={2}
              />
              {roleDescription.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(setRoleDescription, roleDescription, index)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Responsibilities */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Responsibilities</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => addItem(setResponsibilities, responsibilities)}>
              <Plus className="w-4 h-4 mr-2" />Add Item
            </Button>
          </div>
          {responsibilities.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Responsibility..."
                value={item}
                onChange={(e) => updateItem(setResponsibilities, responsibilities, index, e.target.value)}
              />
              {responsibilities.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(setResponsibilities, responsibilities, index)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Required Qualifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Required Qualifications</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => addItem(setRequiredQualifications, requiredQualifications)}>
              <Plus className="w-4 h-4 mr-2" />Add Item
            </Button>
          </div>
          {requiredQualifications.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Required qualification..."
                value={item}
                onChange={(e) => updateItem(setRequiredQualifications, requiredQualifications, index, e.target.value)}
              />
              {requiredQualifications.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(setRequiredQualifications, requiredQualifications, index)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Preferred Qualifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Preferred Qualifications (Optional)</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => addItem(setPreferredQualifications, preferredQualifications)}>
              <Plus className="w-4 h-4 mr-2" />Add Item
            </Button>
          </div>
          {preferredQualifications.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Preferred qualification..."
                value={item}
                onChange={(e) => updateItem(setPreferredQualifications, preferredQualifications, index, e.target.value)}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(setPreferredQualifications, preferredQualifications, index)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Benefits</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => addItem(setBenefits, benefits)}>
              <Plus className="w-4 h-4 mr-2" />Add Item
            </Button>
          </div>
          {benefits.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Benefit..."
                value={item}
                onChange={(e) => updateItem(setBenefits, benefits, index, e.target.value)}
              />
              {benefits.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(setBenefits, benefits, index)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Remuneration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Remuneration (Optional)</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => addItem(setRemuneration, remuneration)}>
              <Plus className="w-4 h-4 mr-2" />Add Item
            </Button>
          </div>
          {remuneration.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="e.g., Monthly Stipend: ₦80,000 – ₦100,000"
                value={item}
                onChange={(e) => updateItem(setRemuneration, remuneration, index, e.target.value)}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(setRemuneration, remuneration, index)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Success Metrics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Success Metrics (Optional)</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => addItem(setSuccessMetrics, successMetrics)}>
              <Plus className="w-4 h-4 mr-2" />Add Item
            </Button>
          </div>
          {successMetrics.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Success metric..."
                value={item}
                onChange={(e) => updateItem(setSuccessMetrics, successMetrics, index, e.target.value)}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(setSuccessMetrics, successMetrics, index)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Interview Process */}
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-800 pt-6">
          <div className="flex items-center justify-between">
            <Label>Interview Process</Label>
            <Button type="button" variant="outline" size="sm" onClick={addInterviewStep}>
              <Plus className="w-4 h-4 mr-2" />Add Step
            </Button>
          </div>
          {interviewProcess.map((step, index) => (
            <div key={index} className="space-y-2 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Step {index + 1}</span>
                {interviewProcess.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeInterviewStep(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <Input
                placeholder="Step number (e.g., 1)"
                value={step.step}
                onChange={(e) => updateInterviewStep(index, 'step', e.target.value)}
              />
              <Input
                placeholder="Step title (e.g., CTO Interview)"
                value={step.title}
                onChange={(e) => updateInterviewStep(index, 'title', e.target.value)}
              />
              <Textarea
                placeholder="Step description..."
                value={step.description}
                onChange={(e) => updateInterviewStep(index, 'description', e.target.value)}
                rows={3}
              />
            </div>
          ))}
        </div>

        {/* Closing Statement */}
        <div className="space-y-2">
          <Label htmlFor="closingStatement">Closing Statement</Label>
          <Textarea
            id="closingStatement"
            value={closingStatement}
            onChange={(e) => setClosingStatement(e.target.value)}
            placeholder="Final message about the role..."
            rows={3}
          />
        </div>

        {/* Application Link */}
        <div className="space-y-2">
          <Label htmlFor="applicationLink">Application Link</Label>
          <Input
            id="applicationLink"
            type="url"
            value={applicationLink}
            onChange={(e) => setApplicationLink(e.target.value)}
            placeholder="https://forms.gle/..."
          />
        </div>
      </div>
    </div>
  )
}