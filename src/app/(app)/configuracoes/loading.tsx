import { PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="skeleton h-44 max-w-xl rounded-2xl" />
    </div>
  )
}
