import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { authorName, authorEmail, title, summary, articleUrl, category } = body

    if (!authorName || !authorEmail || !title || !articleUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(authorEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const submission = await prisma.articleSubmission.create({
      data: {
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim().toLowerCase(),
        title: title.trim(),
        summary: (summary ?? '').trim(),
        articleUrl: articleUrl.trim(),
        category: category ?? 'Community',
        status: 'pending',
      },
    })

    return NextResponse.json({ success: true, id: submission.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
