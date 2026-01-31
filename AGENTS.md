# AGENTS.md

This file provides guidance to agents when working with the gg-dashboard frontend.

## Project Overview

Staff dashboard for curating AI-generated waste sorting classifications. Built with Next.js 16 and Apollo Client for GraphQL communication with the NestJS backend.

**Repo location:** `/Users/lucapurcilly/Git/EcoSort/gg-dashboard`

**Tech Stack:** TypeScript, Next.js 16, React 19, Apollo Client, Tailwind CSS 4, shadcn/ui, React Hook Form, Zod

## System Architecture

### Backend ↔ Frontend Relationship

```
┌─────────────────────┐         GraphQL          ┌─────────────────────┐
│   NestJS Backend    │◄────────────────────────►│  Next.js Frontend   │
│   (EcoSort/)        │     :3001/graphql        │  (gg-dashboard/)    │
├─────────────────────┤                          ├─────────────────────┤
│ • OpenAI Vision API │                          │ • Staff dashboard   │
│ • S3 image storage  │                          │ • Request curation  │
│ • Prisma + Postgres │                          │ • Apollo Client     │
│ • JWT auth          │                          │ • React Hook Form   │
└─────────────────────┘                          └─────────────────────┘
```

The backend handles:
- **Image processing**: Receives images from mobile app, converts HEIC→JPG, uploads to S3
- **AI classification**: Sends images to OpenAI Vision API to identify items and suggest fractions
- **Item matching**: Matches detected items against known MasterItems with organization rules
- **Data persistence**: Stores requests, items, fractions, and curation history in PostgreSQL

The frontend provides:
- **Curation interface**: Staff review AI suggestions and correct/confirm classifications
- **Knowledge building**: Link items to MasterItems, add aliases for future matching

### Request Curation Flow

```
1. MOBILE APP                    2. BACKEND                         3. FRONTEND (this repo)
   ─────────                        ───────                            ────────
   User takes photo      ───►    Process & upload to S3
                                 Send to OpenAI Vision
                                 Match against MasterItems
                                 Save Request + RequestedItems  ───►  Display in /requests list

                                                                      Staff opens request detail
                                                                      Reviews each item:
                                                                      • AI-suggested fraction
                                                                      • Known item match (if any)
                                                                      • Confidence score

                                                                      Staff curates:
                                                                      • Confirm or correct fraction
                                                                      • Link to existing MasterItem
                                                                      • Create new MasterItem
                                                                      • Add aliases for matching

                                 Save curation data:            ◄───  Submit CURATE_REQUEST mutation
                                 • userFractionId (corrected)
                                 • MasterItem link/creation
                                 • New aliases
                                 Mark request as curated
```

### Key Data Models

| Model | Purpose |
|-------|---------|
| **Request** | A single image submission with metadata (station, user, image URL) |
| **RequestedItem** | An item detected in the image (detectedName, confidence) |
| **RequestedItemFraction** | AI's suggested fraction for an item (source: AI_SUGGESTED or KNOWN) |
| **MasterItem** | Canonical item definition with aliases for future matching |
| **OrgFractionRule** | Organization-specific item→fraction mapping |
| **Fraction** | Waste category (e.g., "Restaffald", "Pap og papir") |

### Curation Actions (MasterItemAction enum)

When curating an item, staff can:
- **NONE**: Just correct the fraction, no MasterItem changes
- **CREATE_NEW**: Create a new MasterItem with the detected name + optional aliases
- **LINK_EXISTING**: Link to an existing MasterItem (optionally adding aliases)

This builds the knowledge base so future requests with similar items are automatically matched.

## Common Commands

```bash
npm run dev      # Start dev server on :3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with Providers
│   ├── page.tsx            # Auth redirect (→ /requests or /login)
│   ├── login/              # Login page
│   └── (dashboard)/        # Protected routes
│       ├── layout.tsx      # Dashboard header with nav/logout
│       └── requests/       # Request list and detail pages
├── components/
│   ├── ui/                 # shadcn/ui primitives (don't edit directly)
│   └── *.tsx               # Feature components
├── lib/
│   ├── apollo-client.ts    # Apollo setup with auth links
│   ├── auth.ts             # Token management (localStorage)
│   ├── utils.ts            # cn() Tailwind utility
│   └── graphql/
│       ├── queries.ts      # GraphQL queries
│       └── mutations.ts    # GraphQL mutations
└── types/
    └── graphql.ts          # TypeScript types for GraphQL schema
```

## Architecture

### Data Fetching
- **Apollo Client** for all GraphQL operations
- Queries: `GET_ME`, `GET_REQUESTS`, `GET_REQUEST`, `SUGGEST_ALIASES`
- Mutations: `LOGIN`, `CURATE_REQUEST`
- Auto-authentication via Bearer token in Authorization header
- Error link auto-logs out on 401/UNAUTHENTICATED

### Authentication
- JWT tokens stored in localStorage (`gg_access_token`, `gg_refresh_token`)
- `isAuthenticated()` helper in `lib/auth.ts`
- Protected routes redirect to `/login` if unauthenticated

### Styling
- Tailwind CSS 4 with CSS variables (OKLCH color space)
- shadcn/ui components (New York style)
- `cn()` utility for conditional class merging
- Dark mode via `.dark` class

## Code Conventions

### Components
```typescript
'use client';  // Required for interactive components

interface Props {
  data: DataType;
  onChange?: (value: string) => void;
}

export function MyComponent({ data, onChange }: Props) {
  const [state, setState] = useState();

  const handleClick = () => { /* ... */ };

  return <div>...</div>;
}
```

### Forms (React Hook Form + Zod)
```typescript
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: {},
});

const [mutate] = useMutation(MUTATION);

const onSubmit = async (values: FormValues) => {
  await mutate({ variables: { data: values } });
};
```

### GraphQL Queries
```typescript
const { data, loading, error, refetch } = useQuery(GET_DATA, {
  variables: { id },
});

const [mutate, { loading }] = useMutation(MUTATION, {
  onCompleted: () => toast.success('Done'),
  onError: (e) => toast.error(e.message),
});
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/apollo-client.ts` | Apollo Client setup with auth |
| `lib/graphql/queries.ts` | All GraphQL queries |
| `lib/graphql/mutations.ts` | All GraphQL mutations |
| `types/graphql.ts` | TypeScript types matching backend schema |
| `components/ui/` | shadcn/ui components (regenerate, don't edit) |

## Environment Variables

```bash
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql
```

## Adding New Features

1. Add GraphQL query/mutation to `lib/graphql/`
2. Add TypeScript types to `types/graphql.ts`
3. Create component in `components/`
4. Add page in `app/` if needed
5. Use `useQuery`/`useMutation` hooks with proper error handling

## Notes

- All pages with interactivity need `'use client'` directive
- Date formatting uses Danish locale (`da-DK`)
- Refetch queries after mutations to update UI
- Use `toast` from Sonner for notifications
- Always add or update tests (unit/e2e) when changing behavior or data flow
