import Link from "next/link"

type Issue = {
  id: string
  title: string
  content: string
  status: string
  assignee: {
    id: string
  }
}

export function IssueList({
  projectId,
  issues,
}: {
  projectId: string
  issues: Issue[]
}) {
  return (
    <div className="mt-4">
      {issues.length === 0 ? (
        <p>No issues found.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {issues.map((issue) => (
            <li key={issue.id} className="py-4">
              <Link
                href={`/projects/${projectId}/issues/${issue.id}`}
                className="block hover:bg-gray-50"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{issue.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {issue.content}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Status: {issue.status}</p>
                    <p>Assignee: {issue.assignee.id}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
