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
import { Plus, Search, Edit, Trash2, MapPin, Briefcase } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/lib/hooks/useToast'

interface Career {
  id: string
  job_title: string
  department: string
  location: string
  job_type: string
  status: 'draft' | 'open' | 'closed' | 'archived'
  created_at: string
  updated_at: string
}

export default function CareersPage() {
  const [careers, setCareers] = useState<Career[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'open' | 'closed' | 'archived'>('all')
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchCareers()
  }, [statusFilter])

  const fetchCareers = async () => {
    try {
      let query = supabase
        .from('careers')
        .select('*')
        .order('updated_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setCareers(data || [])
    } catch (error) {
      console.error('Error fetching careers:', error)
      toast({
        title: 'Error',
        description: 'Failed to load job postings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return

    try {
      const { error } = await supabase.from('careers').delete().eq('id', id)
      if (error) throw error

      toast({
        title: 'Success',
        description: 'Job posting deleted successfully',
        variant: 'success',
      })

      fetchCareers()
    } catch (error) {
      console.error('Error deleting career:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete job posting',
        variant: 'destructive',
      })
    }
  }

  const filteredCareers = careers.filter((career) =>
    career.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    career.department.toLowerCase().includes(searchQuery.toLowerCase())
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
            Careers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage job postings
          </p>
        </div>
        <Link href="/admin/careers/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Job Posting
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search jobs..."
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
            variant={statusFilter === 'open' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('open')}
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
      {filteredCareers.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery
              ? 'No job postings found matching your search.'
              : 'No job postings yet. Create your first one!'}
          </p>
          {!searchQuery && (
            <Link href="/admin/careers/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Job Posting
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
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCareers.map((career) => (
                <TableRow key={career.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/careers/${career.id}`}
                      className="hover:text-blue transition-colors"
                    >
                      {career.job_title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      {career.department}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {career.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{career.job_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={career.status === 'open' ? 'success' : 'secondary'}
                    >
                      {career.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(career.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/careers/${career.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(career.id)}
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
          Showing {filteredCareers.length} of {careers.length} job postings
        </div>
        <div>
          {careers.filter((c) => c.status === 'open').length} published •{' '}
          {careers.filter((c) => c.status === 'draft').length} drafts
        </div>
      </div>
    </div>
  )
}