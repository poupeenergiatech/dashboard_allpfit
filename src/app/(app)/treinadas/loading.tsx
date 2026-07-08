import { GridSkeleton, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <GridSkeleton count={6} />
    </div>
  )
}
