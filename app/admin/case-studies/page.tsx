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
import { useToast } from '@/lib/hooks/useToast'

interface CaseStudy {
  id: string
  title: string
  client_name: string
  industry: string
  status: 'draft' | 'published'
  view_count: number
  created_at: string
  updated_at: string
  author: {
    full_name: string
  } | null
}

interface CaseStudyResponse {
  id: string
  title: string
  client_name: string
  industry: string
  status: 'draft' | 'published'
  view_count: number
  created_at: string
  updated_at: string
  author: Array<{
    full_name: string
  }>
}

export default function CaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchCaseStudies()
  }, [statusFilter])

  const fetchCaseStudies = async () => {
    try {
      let query = supabase
        .from('case_studies')
        .select(`
          id,
          title,
          client_name,
          industry,
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

      const transformedData: CaseStudy[] = (data || []).map((item: CaseStudyResponse) => ({
        ...item,
        author: item.author?.[0] || null,
      }))

      setCaseStudies(transformedData)
    } catch (error) {
      console.error('Error fetching case studies:', error)
      toast({
        title: 'Error',
        description: 'Failed to load case studies',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this case study?')) return

    try {
      const { error } = await supabase.from('case_studies').delete().eq('id', id)
      if (error) throw error

      toast({
        title: 'Success',
        description: 'Case study deleted successfully',
        variant: 'success',
      })

      fetchCaseStudies()
    } catch (error) {
      console.error('Error deleting case study:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete case study',
        variant: 'destructive',
      })
    }
  }

  const filteredCaseStudies = caseStudies.filter((cs) =>
    cs.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cs.client_name.toLowerCase().includes(searchQuery.toLowerCase())
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
            Case Studies
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Showcase your success stories
          </p>
        </div>
        <Link href="/admin/case-studies/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Case Study
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search case studies..."
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
      {filteredCaseStudies.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery
              ? 'No case studies found matching your search.'
              : 'No case studies yet. Create your first one!'}
          </p>
          {!searchQuery && (
            <Link href="/admin/case-studies/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Case Study
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
                <TableHead>Client</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCaseStudies.map((cs) => (
                <TableRow key={cs.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/case-studies/${cs.id}`}
                      className="hover:text-blue transition-colors"
                    >
                      {cs.title}
                    </Link>
                  </TableCell>
                  <TableCell>{cs.client_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{cs.industry}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={cs.status === 'published' ? 'success' : 'secondary'}
                    >
                      {cs.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      {cs.view_count}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(cs.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/case-studies/${cs.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cs.id)}
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
          Showing {filteredCaseStudies.length} of {caseStudies.length} case studies
        </div>
        <div>
          {caseStudies.filter((cs) => cs.status === 'published').length} published •{' '}
          {caseStudies.filter((cs) => cs.status === 'draft').length} drafts
        </div>
      </div>
    </div>
  )
}