import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const saved = await prisma.savedArticle.findMany({
    where: { userId },
    orderBy: { savedAt: 'desc' },
  })

  return NextResponse.json(saved.map(s => s.articleId))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { articleId } = await req.json()
  if (!articleId) return NextResponse.json({ error: 'articleId required' }, { status: 400 })

  const saved = await prisma.savedArticle.upsert({
    where: { userId_articleId: { userId, articleId } },
    update: {},
    create: { userId, articleId },
  })

  return NextResponse.json(saved, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { articleId } = await req.json()
  if (!articleId) return NextResponse.json({ error: 'articleId required' }, { status: 400 })

  await prisma.savedArticle.deleteMany({ where: { userId, articleId } })
  return NextResponse.json({ success: true })
}
