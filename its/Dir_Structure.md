```
project-management-tool/
├── src/
│ ├── app/
│ │ ├── api/
│ │ │ ├── issues/
│ │ │ │ └── route.ts
│ │ │ ├── projects/
│ │ │ │ ├── [id]/
│ │ │ │ │ ├── issues/
│ │ │ │ │ │ └── [issueId]/
│ │ │ │ │ │ └── route.ts
│ │ │ │ │ └── route.ts
│ │ │ │ └── route.ts
│ │ │ └── users/
│ │ │ └── route.ts
│ │ ├── projects/
│ │ │ ├── [id]/
│ │ │ │ ├── issues/
│ │ │ │ │ └── [issueId]/
│ │ │ │ │ └── page.tsx
│ │ │ │ └── page.tsx
│ │ │ └── page.tsx
│ │ ├── signup/
│ │ │ └── page.tsx
│ │ ├── layout.tsx
│ │ └── page.tsx
│ ├── components/
│ │ ├── CreateIssueForm.tsx
│ │ ├── CreateProjectForm.tsx
│ │ ├── IssueDetail.tsx
│ │ ├── IssueList.tsx
│ │ ├── Navbar.tsx
│ │ ├── ProjectDetail.tsx
│ │ └── ProjectList.tsx
│ └── contexts/
│ └── AuthContext.tsx
├── prisma/
│ └── schema.prisma
├── .env
├── package.json
└── tsconfig.json
```
