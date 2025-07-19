'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const CATEGORY_OPTIONS = [
  'Veve Symbols',
  'Fruits',
  'Cultural Icons',
  'Animals',
  'Tools & Crafts',
  'People & Figures',
]

export default function ProductForm() {
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [main, setMain] = useState<File | null>(null)
  const [thumbnails, setThumbnails] = useState<File[]>([])
  const [formats, setFormats] = useState<File[]>([])

  const [mainPreview, setMainPreview] = useState<string | null>(null)
  const [thumbPreviews, setThumbPreviews] = useState<string[]>([])
  const [formatPreviews, setFormatPreviews] = useState<string[]>([])

  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (main) setMainPreview(URL.createObjectURL(main))
    else setMainPreview(null)
  }, [main])

  useEffect(() => {
    setThumbPreviews(thumbnails.map(file => URL.createObjectURL(file)))
  }, [thumbnails])

  useEffect(() => {
    setFormatPreviews(formats.map(file => URL.createObjectURL(file)))
  }, [formats])

  const handleFiles = (
    files: FileList | null,
    setter: React.Dispatch<React.SetStateAction<File[]>>
  ) => setter(files ? Array.from(files) : [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!main) return alert('Please select a main image')

    setUploading(true)

    const data = new FormData()
    data.append('category', category)
    data.append('title', title)
    data.append('description', description)
    data.append('price', price)
    data.append('main', main)
    thumbnails.forEach(f => data.append('thumbnails', f))
    formats.forEach(f => data.append('formats', f))

    const res = await fetch('/api/products/upload', {
      method: 'POST',
      body: data,
    })

    setUploading(false)

    if (res.ok) {
      alert('Product uploaded!')
      setCategory('')
      setTitle('')
      setDescription('')
      setPrice('')
      setMain(null)
      setThumbnails([])
      setFormats([])
    } else {
      alert('Upload failed')
      console.error(await res.text())
    }
  }

  return (
    <motion.form
      onSubmit={submit}
      encType="multipart/form-data"
      className="max-w-3xl mx-auto p-8 bg-white rounded-3xl shadow-2xl space-y-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Category & Title */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-gray-700">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
            required
            disabled={uploading}
          >
            <option value="" disabled>Select category</option>
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
            placeholder="Enter title"
            required
            disabled={uploading}
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="mb-2 font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full h-24 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition resize-none"
            placeholder="Product description..."
            required
            disabled={uploading}
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 font-medium text-gray-700">Price ($)</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
            placeholder="0.00"
            required
            disabled={uploading}
          />
        </div>
      </div>

      {/* Main Image Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="flex flex-col">
          <label className="mb-2 font-medium text-gray-700">Main Image</label>
          <label className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 transition">
            {main ? 'Change Main Image' : 'Select Main Image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => setMain(e.target.files?.[0] || null)}
              required
              disabled={uploading}
            />
          </label>
        </div>
        {mainPreview && (
          <div className="h-40 w-40 rounded-xl overflow-hidden shadow-lg">
            <img src={mainPreview} alt="Main Preview" className="object-cover h-full w-full" />
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div>
        <label className="mb-2 block font-medium text-gray-700">Thumbnails</label>
        <label className="inline-flex items-center px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 transition">
          {thumbnails.length ? 'Change Thumbnails' : 'Select Thumbnails'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files, setThumbnails)}
            disabled={uploading}
          />
        </label>
        {thumbPreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-4">
            {thumbPreviews.map((src, idx) => (
              <div key={idx} className="h-24 w-24 rounded-lg overflow-hidden shadow-md hover:scale-105 transform transition">
                <img src={src} alt={`Thumb ${idx + 1}`} className="object-cover h-full w-full" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Format Uploads */}
      <div>
        <label className="mb-2 block font-medium text-gray-700">Other Formats (PDF, SVG…)</label>
        <label className="inline-flex items-center px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 transition">
          {formats.length ? 'Change Formats' : 'Select Other Formats'}
          <input
            type="file"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files, setFormats)}
            disabled={uploading}
          />
        </label>
        {formatPreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-4">
            {formatPreviews.map((src, idx) => (
              <div key={idx} className="h-20 w-20 rounded-lg overflow-hidden shadow-md flex items-center justify-center bg-gray-50">
                <img src={src} alt={`Format ${idx + 1}`} className="object-contain h-full w-full" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-lg font-semibold rounded-2xl shadow-xl hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Create Product'}
      </motion.button>
    </motion.form>
  )
}
