'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PenLine, CheckCircle, ArrowLeft } from 'lucide-react'
import { CATEGORIES } from '@/types'

export default function SubmitPage() {
  const [form, setForm] = useState({
    authorName: '',
    authorEmail: '',
    title: '',
    summary: '',
    articleUrl: '',
    category: 'Community',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Submission received!</h1>
        <p className="text-gray-500 mb-8">
          Thank you for sharing your story. Our team will review it and reach out if it&apos;s selected for the Independent Voices spotlight.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Good News
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <PenLine className="w-5 h-5 text-brand-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Get Featured</h1>
      </div>
      <p className="text-gray-500 mb-8 ml-[52px]">
        Submit your positive news article or story to be featured in the Independent Voices section. Our editorial team reviews every submission.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="authorName"
              value={form.authorName}
              onChange={handleChange}
              required
              placeholder="Jane Smith"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="authorEmail"
              value={form.authorEmail}
              onChange={handleChange}
              required
              placeholder="jane@example.com"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Article Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="A compelling headline for your story"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Article URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            name="articleUrl"
            value={form.articleUrl}
            onChange={handleChange}
            required
            placeholder="https://your-publication.com/article"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Brief Summary <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="summary"
            value={form.summary}
            onChange={handleChange}
            rows={4}
            placeholder="Tell us in a few sentences what makes this story uplifting or impactful..."
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
        >
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          By submitting, you confirm this is original work or that you have rights to share it. We only feature positive, uplifting stories.
        </p>
      </form>
    </div>
  )
}
