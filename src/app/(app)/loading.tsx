import { CardsSkeleton, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <div className="skeleton h-16 rounded-2xl" />
      <CardsSkeleton count={4} />
    </div>
  )
}
