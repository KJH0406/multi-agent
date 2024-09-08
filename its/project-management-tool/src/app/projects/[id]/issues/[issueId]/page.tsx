import { IssueDetail } from "@/components/IssueDetail"

export default function IssueDetailPage({
  params,
}: {
  params: { id: string; issueId: string }
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <IssueDetail projectId={params.id} issueId={params.issueId} />
    </div>
  )
}
