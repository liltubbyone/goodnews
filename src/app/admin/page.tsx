import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  Users, Radio, UserPlus, FileText, Bookmark,
  Clock, CheckCircle, XCircle, AlertCircle, TrendingUp,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Admin Dashboard' }

const ADMIN_EMAIL = 'dre.hathaway@gmail.com'

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function statusBadge(status: string) {
  if (status === 'approved') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
      <CheckCircle className="w-3 h-3" /> Approved
    </span>
  )
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> Rejected
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-3 h-3" /> Pending
    </span>
  )
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.email !== ADMIN_EMAIL) redirect('/')

  const now = new Date()
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const todayMidnight = new Date(now)
  todayMidnight.setHours(0, 0, 0, 0)

  const [
    onlineCount,
    totalUsers,
    newSignupsToday,
    pendingSubmissions,
    totalSubmissions,
    recentSubmissions,
    topSaved,
    totalArticles,
  ] = await Promise.all([
    prisma.activeSession.count({ where: { lastSeen: { gte: fiveMinAgo } } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayMidnight } } }),
    prisma.articleSubmission.count({ where: { status: 'pending' } }),
    prisma.articleSubmission.count(),
    prisma.articleSubmission.findMany({
      orderBy: { submittedAt: 'desc' },
      take: 15,
    }),
    prisma.savedArticle.groupBy({
      by: ['articleId'],
      _count: { articleId: true },
      orderBy: { _count: { articleId: 'desc' } },
      take: 5,
    }),
    prisma.fetchedArticle.count(),
  ])

  // Resolve article titles for top saved
  const topSavedIds = topSaved.map(s => s.articleId.replace(/^live-/, ''))
  const topSavedArticles = await prisma.fetchedArticle.findMany({
    where: { id: { in: topSavedIds } },
    select: { id: true, title: true, category: true, positivityScore: true },
  })
  const articleMap = new Map(topSavedArticles.map(a => [a.id, a]))
  const topSavedWithTitles = topSaved.map(s => ({
    articleId: s.articleId,
    count: s._count.articleId,
    article: articleMap.get(s.articleId.replace(/^live-/, '')) ?? null,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {' · '}Last refreshed at {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          icon={Radio}
          label="Online Right Now"
          value={onlineCount}
          sub="Active in last 5 minutes"
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={Users}
          label="Registered Users"
          value={totalUsers.toLocaleString()}
          sub={`+${newSignupsToday} today`}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={UserPlus}
          label="New Signups Today"
          value={newSignupsToday}
          color="bg-indigo-100 text-indigo-600"
        />
        <StatCard
          icon={FileText}
          label="Pending Submissions"
          value={pendingSubmissions}
          sub={`${totalSubmissions} total submitted`}
          color={pendingSubmissions > 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}
        />
        <StatCard
          icon={Bookmark}
          label="Total Saves"
          value={(await prisma.savedArticle.count()).toLocaleString()}
          color="bg-brand-100 text-brand-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Articles in DB"
          value={totalArticles.toLocaleString()}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <h2 className="font-bold text-gray-900">Article Submissions</h2>
            </div>
            {pendingSubmissions > 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2.5 py-0.5 rounded-full">
                {pendingSubmissions} pending
              </span>
            )}
          </div>
          {recentSubmissions.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">No submissions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3 text-left">Author</th>
                    <th className="px-6 py-3 text-left">Title</th>
                    <th className="px-6 py-3 text-left">Category</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentSubmissions.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[120px]">{s.authorName}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[120px]">{s.authorEmail}</p>
                      </td>
                      <td className="px-6 py-3">
                        <a
                          href={s.articleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline font-medium line-clamp-2 max-w-[200px] block"
                        >
                          {s.title}
                        </a>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          {s.category}
                        </span>
                      </td>
                      <td className="px-6 py-3">{statusBadge(s.status)}</td>
                      <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {s.submittedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Most saved articles */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-gray-400" />
            <h2 className="font-bold text-gray-900">Most Saved Articles</h2>
          </div>
          {topSavedWithTitles.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">No saves yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topSavedWithTitles.map((item, i) => (
                <div key={item.articleId} className="px-6 py-4 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    {item.article ? (
                      <>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{item.article.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{item.article.category} · {item.article.positivityScore}% positive</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Article removed from DB</p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full flex-shrink-0">
                    {item.count} save{item.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
