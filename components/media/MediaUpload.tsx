'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface MediaUploadProps {
  onUploadComplete?: (url: string, fileName: string) => void
  accept?: string
  maxSizeMB?: number
}

export function MediaUpload({
  onUploadComplete,
  accept = 'image/*',
  maxSizeMB = 10,
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const supabase = createClient()
  const { user } = useAuth()

  const uploadFile = async (file: File) => {
    if (!user) return

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      alert(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    setUploading(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('cms-media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('cms-media').getPublicUrl(filePath)

      // Save metadata to database
      const insertData = {
        filename: file.name,
        original_filename: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
      }

      console.log('Inserting media data:', insertData)

      const { data: mediaData, error: dbError } = await supabase
        .from('media')
        .insert(insertData)
        .select()

      if (dbError) {
        console.error('Database insert error:', dbError)
        throw dbError
      }

      console.log('Media inserted successfully:', mediaData)

      setPreview(publicUrl)
      onUploadComplete?.(publicUrl, file.name)
    } catch (error: any) {
      console.error('Error uploading file:', error)
      alert(error.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0])
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue bg-blue/5'
            : 'border-gray-300 dark:border-gray-700'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Uploading...
            </p>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="relative w-full h-48">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain rounded-lg"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreview(null)}
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Drag and drop an image here, or click to select
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              Max file size: {maxSizeMB}MB
            </p>
            <input
              type="file"
              accept={accept}
              onChange={handleChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button type="button" variant="outline" size="sm" asChild>
                <span>Select File</span>
              </Button>
            </label>
          </>
        )}
      </div>
    </div>
  )
}