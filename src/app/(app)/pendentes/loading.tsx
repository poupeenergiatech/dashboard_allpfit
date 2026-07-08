import { ListSkeleton, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <ListSkeleton rows={4} />
    </div>
  )
}
