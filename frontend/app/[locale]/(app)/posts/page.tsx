import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { apiRequest } from '@/lib/api'
import PostsClient from '@/components/posts/PostsClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'posts' })
  return { title: t('title') }
}

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

async function getPosts(): Promise<Post[]> {
  try {
    const res = await apiRequest<{ data: Post[] }>('/posts?limit=50')
    return res?.data ?? []
  } catch {
    return []
  }
}

export default async function PostsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const posts = await getPosts()
  return <PostsClient posts={posts} locale={locale} />
}
