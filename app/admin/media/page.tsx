'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MediaUpload } from '@/components/media/MediaUpload'
import { Search, Trash2, Download, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'
import { useToast } from '@/lib/hooks/useToast'

interface Media {
  id: string
  original_filename: string
  file_url: string
  file_path: string
  file_size: number
  mime_type: string
  created_at: string
}

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMedia(data || [])
    } catch (error) {
      console.error('Error fetching media:', error)
      toast({
        title: 'Error',
        description: 'Failed to load media files',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = () => {
    setShowUpload(false)
    fetchMedia()
    toast({
      title: 'Success',
      description: 'File uploaded successfully',
      variant: 'success',
    })
  }

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('cms-media')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('media')
        .delete()
        .eq('id', id)

      if (dbError) throw dbError

      fetchMedia()
      toast({
        title: 'Success',
        description: 'File deleted successfully',
        variant: 'success',
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    else return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const filteredMedia = media.filter((item) =>
    item.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
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
            Media Library
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your images and files
          </p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          {showUpload ? 'Cancel' : 'Upload File'}
        </Button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <MediaUpload onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery
              ? 'No files found matching your search.'
              : 'No files uploaded yet. Upload your first one!'}
          </p>
          {!searchQuery && !showUpload && (
            <Button onClick={() => setShowUpload(true)}>Upload File</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="group relative border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:border-blue transition-colors"
            >
              {/* Image */}
              <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-900">
                {item.mime_type.startsWith('image/') ? (
                  <Image
                    src={item.file_url}
                    alt={item.original_filename}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Eye className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-medium truncate" title={item.original_filename}>
                  {item.original_filename}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {formatFileSize(item.file_size)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(item.created_at)}
                  </span>
                </div>
              </div>

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </a>
                <a href={item.file_url} download>
                  <Button variant="secondary" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </a>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item.id, item.file_path)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredMedia.length} of {media.length} files
      </div>
    </div>
  )
}