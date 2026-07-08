import { CardsSkeleton, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
      <CardsSkeleton count={4} />
    </div>
  )
}
