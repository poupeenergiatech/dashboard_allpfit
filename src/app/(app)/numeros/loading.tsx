import { PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} />
    </div>
  )
}
