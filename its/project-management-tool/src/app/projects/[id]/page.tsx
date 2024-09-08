import { ProjectDetail } from "@/components/ProjectDetail"

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <ProjectDetail projectId={params.id} />
    </div>
  )
}
