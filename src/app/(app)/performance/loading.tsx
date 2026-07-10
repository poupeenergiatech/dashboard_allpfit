import { PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="skeleton h-72 rounded-2xl" />
      <TableSkeleton rows={6} />
    </div>
  )
}
