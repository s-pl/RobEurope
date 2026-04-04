'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Newspaper, Heart, Eye, MessageCircle, Pin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Post {
  id: string
  title: string
  content: string
  author: { username: string; profile_photo_url?: string }
  media_urls?: string[]
  likes_count: number
  views_count: number
  is_pinned: boolean
  created_at: string
  _count?: { comments: number }
}

export default function PostsClient({ posts, locale }: { posts: Post[]; locale: string }) {
  const t = useTranslations('posts')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')

  const filtered = posts.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchTab = tab === 'all' || (tab === 'pinned' && p.is_pinned)
    return matchSearch && matchTab
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Newspaper className="h-5 w-5 text-blue-600" />
        <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {t('title')}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
          <TabsTrigger value="pinned">{t('tabs.pinned')}</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
              <Newspaper className="h-10 w-10 text-stone-300 dark:text-stone-700 mb-3" />
              <p className="text-stone-500 dark:text-stone-400">{t('empty')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((post) => (
                <article
                  key={post.id}
                  className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.author.profile_photo_url} />
                          <AvatarFallback>{post.author.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                            {post.author.username}
                          </p>
                          <p className="text-xs text-stone-400">
                            {new Date(post.created_at).toLocaleDateString(locale)}
                          </p>
                        </div>
                      </div>
                      {post.is_pinned && (
                        <Badge variant="secondary" className="gap-1">
                          <Pin className="h-3 w-3" /> {t('pinned')}
                        </Badge>
                      )}
                    </div>

                    <h2 className="font-display font-semibold text-xl text-stone-900 dark:text-stone-50 mb-3">
                      {post.title}
                    </h2>

                    <div className="prose prose-sm prose-stone dark:prose-invert max-w-none line-clamp-4">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Footer stats */}
                  <div className="border-t border-stone-200 dark:border-stone-800 px-5 py-3 flex items-center gap-4 text-xs text-stone-400 dark:text-stone-500">
                    <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {post.likes_count}</span>
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {post.views_count}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {post._count?.comments ?? 0}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
