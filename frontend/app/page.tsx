import { redirect } from 'next/navigation'

// Redirect root to default locale
export default function RootPage() {
  redirect('/es')
}
