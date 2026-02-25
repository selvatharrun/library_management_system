# Library Management System — Presentation Questions & Critique

> Every question they could realistically ask, plus a brutally honest evaluation of weird/questionable decisions.

---

## Table of Contents

1. [Architecture & Design Questions](#1-architecture--design-questions)
2. [Next.js & React Questions](#2-nextjs--react-questions)
3. [TypeScript Questions](#3-typescript-questions)
4. [API & Backend Questions](#4-api--backend-questions)
5. [Authentication & Security Questions](#5-authentication--security-questions)
6. [Data Layer Questions](#6-data-layer-questions)
7. [Frontend & UI Questions](#7-frontend--ui-questions)
8. [External API (OpenLibrary) Questions](#8-external-api-openlibrary-questions)
9. [Code Quality & Best Practices Questions](#9-code-quality--best-practices-questions)
10. [Live Coding / "What If" Scenarios](#10-live-coding--what-if-scenarios)
11. [Things Done Weirdly — Full Audit](#11-things-done-weirdly--full-audit)

---

## 1. Architecture & Design Questions

### Q: Explain the overall architecture of your project.
**What they want to hear:** It's a full-stack Next.js 16 app using the App Router. The frontend is React (all client components). The backend is Next.js API route handlers that call a Service → Repository layer. Data is stored in JSON files on disk.

### Q: Why did you choose Next.js instead of a separate frontend + backend?
**What they want to hear:** Monorepo convenience — API routes and pages live in the same codebase. No need for CORS. Shared types between frontend and backend.

### Q: What design patterns are you using?
- **Repository Pattern** — `BookRepository`, `IssueRepository`, `UserRepository` abstract data access.
- **Service Layer** — `BookService`, `IssueService`, `UserService` contain business logic.
- **Component Composition** — `SidebarLayout`, `FilterBar`, `BookCard` are reusable.
- **File-system routing** — Next.js App Router convention.

### Q: Why is there a separate Service and Repository layer?
**Answer:** Separation of concerns. The repository handles raw data operations (CRUD, find, persist to file). The service handles validation and business rules (e.g., "can this user borrow this book?"). If we swapped JSON files for a real database, only the repository layer would change.

### Q: Can you draw the data flow for borrowing a book?
**Answer:** User clicks Borrow → `POST /api/issues` with `{userId, bookId, location}` → `IssueService.issueBook()` validates user exists, book exists, stock > 0, no duplicate borrow → decrements `book.locations[location].available` → creates Issue record → persists to JSON file → returns 201.

### Q: Why not use a database?
**Tricky.** Honest answer: This is a capstone demo, JSON-file storage was faster to implement. In production, you'd use PostgreSQL/MongoDB. Be ready to explain what would change (repositories would use an ORM/driver instead of `fs.writeFileSync`).

### Q: How would you scale this?
- Replace JSON files with a real database
- Add connection pooling
- Use Redis for caching
- Deploy to Vercel's serverless or a containerized solution
- Add pagination to all list endpoints
---

## 2. Next.js & React Questions

### Q: What version of Next.js are you using and what's significant about it?
**Answer:** Next.js 16 with React 19. Key: `params` in route handlers is now a `Promise` and must be `await`-ed. App Router is the default.

### Q: Explain the App Router vs Pages Router.
**Answer:** App Router uses `app/` directory with `page.tsx`, `layout.tsx`, `route.ts` conventions. Pages Router uses `pages/` with `_app.tsx`, `_document.tsx`. This project uses App Router exclusively.

### Q: What is a layout and how do they nest?
**Answer:** A `layout.tsx` wraps all pages in its folder and subfolders. They persist across navigations. This project has: `RootLayout` → `AdminLayout` (with sidebar) → Admin pages, and `RootLayout` → `UserLayout` (with sidebar) → User pages.

### Q: Why are ALL your pages "use client"?
**Be careful.** This is a weakness. Every single page uses `"use client"` because they all use hooks (`useState`, `useEffect`, `useRouter`). None of the pages leverage Server Components, which is a core Next.js App Router benefit. A better design would fetch data in server components and pass to client children.

### Q: What's the difference between Server and Client Components?
- **Server Components:** Run on server, can access fs/db, no hooks/events, stream HTML
- **Client Components:** Run in browser, can use useState/useEffect/onClick, need `"use client"` directive
 
### Q: Why doesn't `FilterBar` have `"use client"`?
**Answer:** `FilterBar` itself doesn't use any hooks — it's a pure presentational component that receives everything as props. But it's imported into client components, so it runs on the client anyway. (A component imported by a client component becomes a client component.)

### Q: What are dynamic route segments?
**Answer:** Folders named `[param]` like `api/books/[id]`. The `id` is extracted from the URL via `await params` in the route handler.

### Q: Why do you `await params` instead of just using `params.id`?
**Answer:** In Next.js 15+, `params` is a `Promise`. You must `await` it. If you don't, `id` will be a Promise object and all lookups will fail.

### Q: What React hooks do you use?
- `useState` — component state (books list, search query, loading flags, modals)
- `useEffect` — side effects on mount (fetch data, route protection checks)
- `useRouter` — programmatic navigation (redirect after login, route protection)

### Q: Explain `useEffect` with an empty dependency array.
**Answer:** Runs once after the component mounts. Used to fetch initial data. An empty `[]` means no re-runs. Without the array, it would run after every render.

### Q: What is conditional rendering and where do you use it?
**Answer:** Rendering different JSX based on state. Examples: `{loading && <p>Loading…</p>}`, `{error && <div>{error}</div>}`, ternary for tab content in My Books page.

---

## 3. TypeScript Questions

### Q: What TypeScript features are you using?
- **Interfaces & Types** — `Book`, `User`, `Issue`, `IssueStatus`, `Role`, `Location`
- **Union types** — `"ADMIN" | "USER"`, `"ISSUED" | "RETURNED"`
- **Generics** — `Record<Location, LocationStock>`, `Promise<{ id: string }>`
- **Type assertions** — `rawBooks as Book[]`
- **`satisfies` operator** — used in `auth.ts`
- **Optional chaining** — `book.category?.toLowerCase()`
- **Nullish coalescing** — `doc.author_name?.[0] ?? "Unknown"`

### Q: What's the difference between `type` and `interface`?
**Answer:** Mostly interchangeable. `interface` supports declaration merging and `extends`. `type` supports unions, intersections, and mapped types. This project uses both somewhat arbitrarily.

### Q: Why do you have types defined in multiple places?
**⚠️ Weird thing.** The global `src/types/index.ts` defines `User`, `Book`, `Issue`. But `src/app/admin/users/types/index.ts` redefines `User`, `Issue`, and `Book` locally with a simpler shape. Several page components also redefine `Book` and `Location` inline. This is a DRY violation — you should import from one source of truth.

### Q: What does `satisfies` do in your auth.ts?
**Answer:** `JSON.parse(raw) satisfies User` checks at compile time that the shape matches `User`. **But** it does NOT validate at runtime — `JSON.parse` can return anything. If the localStorage data is malformed, it will pass through. A proper solution would use a schema validation library like Zod.

### Q: What is `Record<Location, LocationStock>`?
**Answer:** A mapped type — an object where every key is a `Location` (`"Chennai" | "Bangalore" | "Delhi" | "Mumbai"`) and every value is a `LocationStock` (`{ total: number; available: number }`).

### Q: Why use `as Book[]` type assertion on JSON imports?
**Answer:** TypeScript infers imported JSON as a literal type. `as Book[]` tells the compiler to trust that the JSON matches the `Book[]` shape. Less safe than `satisfies` but works for static data.

### Q: What does `err: any` mean and why is it bad?
**Answer:** It disables type checking on the error. Best practice is `err: unknown` and then use type narrowing (`if (err instanceof Error)`). `any` defeats the purpose of TypeScript.

---

## 4. API & Backend Questions

### Q: How are your API routes structured?
**Answer:** Each `route.ts` exports named functions: `GET`, `POST`, `PATCH`, `DELETE`. The function name must match the HTTP method exactly (uppercase).

### Q: Walk through what happens when a user borrows a book.
1. Frontend: `POST /api/issues` with `{ userId, bookId, location }`
2. Route handler calls `IssueService.issueBook(userId, bookId, location)`
3. Service validates: user exists, book exists, stock > 0, no existing active borrow
4. Decrements `book.locations[location].available`
5. Creates Issue with `crypto.randomUUID()`, status `"ISSUED"`, due in 14 days
6. Persists book and issue to JSON files
7. Returns 201 with the created issue

### Q: What HTTP methods do you support and why those specific ones?
- `GET` — read data (idempotent, safe)
- `POST` — create data (login, signup, add book, borrow)
- `PATCH` — partial update (edit inventory, return book)
- `DELETE` — remove data (delete book)
- Not using `PUT` because all updates are partial (PATCH)

### Q: What status codes do you return?
- `200` — success (default)
- `201` — created (new book, new issue, new user)
- `400` — bad request (validation error)
- `401` — unauthorized (login failure)
- `404` — not found (book/user not found)

### Q: How do you read query parameters?
```typescript
const { searchParams } = new URL(req.url);
const query = searchParams.get("q");
```

### Q: How do you read the request body?
```typescript
const body = await req.json();
```

### Q: What happens if req.json() receives invalid JSON?
**Answer:** It throws an error. Currently, the routes don't explicitly catch this — they rely on the outer try/catch, which will return a 400/500. But the error message won't be user-friendly.

### Q: Why is the login a POST instead of a GET?
**Answer:** Even though it's just an email lookup, POST is conventional for authentication endpoints. GET would put the email in the URL/logs, and GET should be idempotent.

### Q: Your GET on /api/books does two different things — is that good design?
**⚠️ Questionable.** The same endpoint either lists all books, searches locally, or searches OpenLibrary externally depending on query params. In REST best practice, these could be separate endpoints (e.g., `/api/books/search`, `/api/books/external-search`).

---

## 5. Authentication & Security Questions

### Q: How does your authentication work?
**Answer:** User enters email → `POST /api/auth/login` looks up the email in `users.json` → returns the full User object → frontend stores it in `localStorage` under `lms_user` → subsequent pages read from localStorage.

### Q: There's no password?
**⚠️ Major weakness.** Anyone who knows an email can log in. There's no password, JWT, session token, or any real authentication. This is just email-based user lookup.

### Q: How is route protection implemented?
**Answer:** Each protected page has a `useEffect` that calls `getStoredUser()` from `localStorage`. If no user or wrong role, it calls `router.replace("/")`.

### Q: What's wrong with your route protection approach?
- **Client-side only** — the server doesn't protect anything. You can hit all API routes directly (e.g., `curl POST /api/books`) with no auth check.
- **No middleware** — Next.js has a `middleware.ts` file that can intercept requests before they reach the page. That would be the proper place.
- **Race condition** — the page briefly renders before the `useEffect` redirect fires. Users can see a flash of content.
- **API routes are completely unprotected** — any API call works without authentication.

### Q: Could someone abuse your API directly?
**Yes.** Anyone can:
- `DELETE /api/books/{id}` — delete any book
- `POST /api/issues` — borrow as any user
- `POST /api/users` — create unlimited accounts
- `GET /api/users` — see all user data
No API-level auth exists at all.

### Q: Why use `localStorage` instead of cookies/sessions?
**Answer:** Simplicity for the demo. In production, you'd use HTTP-only cookies with signed JWTs or a session store. `localStorage` is vulnerable to XSS attacks.

### Q: What does `getStoredUser()` do and is the `satisfies` check sufficient?
**Answer:** It reads from `localStorage`, parses JSON, and uses `satisfies User`. But `satisfies` is compile-time only — at runtime, any object will pass. If someone manually edits localStorage, they could inject anything, including `role: "ADMIN"`.

---

## 6. Data Layer Questions

### Q: Why use JSON files instead of a database?
**Answer:** Quick prototyping for a capstone project. No database setup needed.

### Q: How does data persistence work?
**Answer:** On startup, JSON files are imported into module-level variables (in-memory). Reads come from memory. Writes mutate the in-memory array and call `fs.writeFileSync()` to persist.

### Q: What happens if two requests write at the same time?
**⚠️ Race condition.** `writeFileSync` is synchronous but the in-memory mutations aren't atomic. Two concurrent `issueBook` calls could both read `available: 1`, both pass validation, and both decrement — resulting in `available: -1`. There's no locking or transactions.

### Q: What happens when you redeploy / restart the server?
**Answer:** Data reloads from the JSON files. If you modified the in-memory data and the server crashes before `persist()`, that data is lost. On Vercel (serverless), the filesystem is ephemeral — all data resets every deployment.

### Q: Why are book IDs generated with `crypto.randomUUID()` but user IDs with `Date.now()`?
**⚠️ Inconsistency.** Books use `crypto.randomUUID()` (good, truly unique). Users use `` `u${Date.now()}` `` (bad — two requests in the same millisecond produce the same ID). Should be consistent.

### Q: What does the persist() method do?
```typescript
private static persist() {
  fs.writeFileSync(filePath, JSON.stringify(books, null, 2));
}
```
Serializes the entire array to JSON and overwrites the file synchronously.

### Q: Why `writeFileSync` instead of async `writeFile`?
**⚠️ Questionable.** `writeFileSync` blocks the Node.js event loop. With small JSON files it's fine, but with large data it would block all other requests. Async `fs.promises.writeFile` would be better.

### Q: Your repositories use module-level `let` variables — what are the implications?
**Answer:** In dev mode (Next.js hot reload), modules may re-import and reset the in-memory data. In production (serverless), each function invocation may or may not share memory. This is fragile.

---

## 7. Frontend & UI Questions

### Q: What styling approaches are you using?
**⚠️ Three different approaches mixed:**
1. **CSS Modules** — `dashboard.module.css`, `user.module.css`, `FilterBar.module.css`, `search.module.css`
2. **Tailwind CSS** — used in `SidebarLayout.tsx` (`className="flex min-h-screen"`)
3. **Inline styles** — heavily used in `page.tsx` (login), `admin/users/page.tsx`, `search/page.tsx`

This inconsistency would be questioned. Pick one approach and stick with it.

### Q: Why use CSS Modules?
**Answer:** Scoped class names prevent style collisions. Each `.module.css` generates unique class names at build time.

### Q: Why are there inline styles on the login page but CSS Modules on the admin dashboard?
**⚠️ Inconsistency.** The login page uses 100% inline styles. Admin dashboard uses CSS Modules. Admin users page uses 100% inline styles. No consistent pattern.

### Q: Why use `<a>` tags instead of Next.js `<Link>` in the sidebar?
**⚠️ Weird.** `SidebarLayout` uses plain `<a href={link.href}>` instead of `next/link`'s `<Link>`. This causes full page reloads on every navigation instead of client-side transitions. This defeats the SPA (Single Page Application) benefit of Next.js.

### Q: Why use `alert()` for user feedback?
**⚠️ Bad UX.** `alert("Book added successfully")` and `alert("Book borrowed!")` use native browser dialogs. A proper app would use toast notifications or inline UI feedback.

### Q: Is there any pagination?
**No.** Every page fetches ALL books or ALL issues. With hundreds of books, this would be slow and hurt performance. Should implement pagination or virtual scrolling.

### Q: How do you handle loading states?
**Answer:** A `loading` boolean state, showing `<p>Loading…</p>`. No skeleton screens, no spinners. Minimal but functional.

### Q: What is the `FilterBar` component and why is it reusable?
**Answer:** A generic filter bar with search input, category dropdown, location dropdown, clear button, and result count. Used identically in admin dashboard and user books page. Props-driven, so both pages can customize labels and options.

### Q: The Search page uses `<img>` but other pages use `<Image>` from Next.js — why?
**⚠️ Inconsistency.** `admin/search/page.tsx` uses `<img>` (native HTML). `user/books/page.tsx` and `BookCard.tsx` use `<Image>` from `next/image`. Next.js Image provides automatic optimization, lazy loading, and responsive sizing.

### Q: There's no error boundary — what happens on an unhandled error?
**Answer:** The app crashes. Next.js supports `error.tsx` convention files for error boundaries, but none are implemented. A runtime error in any component would show the default Next.js error page.

---

## 8. External API (OpenLibrary) Questions

### Q: How does OpenLibrary integration work?
**Answer:** Admin searches → `GET /api/books?q=query&external=true` → `OpenLibraryService.searchBooks()` → fetches from `openlibrary.org/search.json` → returns top 10 results. Admin clicks "Add" → `POST /api/books` → fetches detailed metadata by ISBN or workKey → creates/updates book in local storage.

### Q: What's the fallback chain for importing a book?
1. Try ISBN lookup (`/api/books?bibkeys=ISBN:xxx`) — gets full metadata
2. Fallback to workKey lookup (`/{workKey}.json`) — gets title, description, cover
3. If both fail → error "Book metadata not found"

### Q: How do you handle duplicate books?
**Answer:** Three-level dedup:
1. Match by ISBN
2. Match by workKey
3. Match by exact title (case-insensitive)
If found, increment stock at the selected location instead of creating a new book.

### Q: What does the `User-Agent` header do?
**Answer:** OpenLibrary's API policy asks for identification. The code sends `"LMS/1.0 (selvatharrun005@gmail.com)"`. This is a hardcoded email — should be an environment variable.

### Q: What if OpenLibrary is down?
**Answer:** The fetch will fail, the catch block returns an error response. But there's no timeout, retry logic, or circuit breaker. The request could hang indefinitely.

### Q: Why does `normalizeDescription` handle both string and object?
**Answer:** OpenLibrary's API inconsistently returns `description` as either a plain string or `{ type: "/type/text", value: "..." }`. The normalizer handles both cases.

---

## 9. Code Quality & Best Practices Questions

### Q: Do you have any tests?
**No.** No unit tests, no integration tests, no E2E tests. No testing framework is even installed. This is a significant gap.

### Q: Are there any environment variables?
**No.** The OpenLibrary email is hardcoded. There's no `.env` file. In production, API keys, base URLs, etc. should be in environment variables.

### Q: What about error handling?
**Answer:** Routes use try/catch blocks returning JSON errors. Services throw errors that bubble up. But:
- No global error handler
- No logging (only `console.log` / `console.error`)
- No request validation middleware
- `err: any` used everywhere instead of `err: unknown`

### Q: Is the README useful?
**No.** It's the default `create-next-app` boilerplate. Hasn't been customized to describe the actual project, features, setup instructions, or API documentation.

### Q: Are there any accessibility concerns?
- No `aria` attributes
- No keyboard navigation support on custom components
- No focus management on modals
- Color contrast might not meet WCAG standards
- No screen reader considerations

### Q: Comments in the code say "lol" — is that professional?
**⚠️ Several comments contain "lol":**
- `auth.ts`: `"//SSR window checks lol"`, `"//check localStorage in inspect lol"`
- `userRepository.ts`: `"//type assetion lol could also use satsifies if u want."`
- `openLibraryService.ts`: `"//regex literal we want only the 4 digits lol"`

Remove or replace these before presenting. They undermine professionalism.

---

## 10. Live Coding / "What If" Scenarios

### Q: Add a "Renew/Extend" feature for borrowed books.
**How:** Add a `PATCH /api/issues/[id]/renew` or modify the existing PATCH to accept an `action` field. In `IssueService`, add a `renewBook(issueId)` method that extends `dueDate` by 14 more days (only if currently ISSUED and not overdue).

### Q: Add a fine/penalty for overdue books.
**How:** Calculate `daysPastDue = (today - dueDate) / 86400000`. Multiply by a per-day rate. Show it in the UI and enforce it on return.

### Q: Add pagination to the book list.
**How:** Accept `page` and `limit` query params. In the service, use `.slice((page-1)*limit, page*limit)`. Return `{ data: [...], total, page, totalPages }`.

### Q: What if I want to add a "reserve" feature?
**How:** New `Reservation` type, new repository, new service, new API route. Check if all copies are checked out → allow reservation → notify when available.

### Q: Add a search/filter to the users page.
**Already done.** The users page has search by name/email and filter by role.

### Q: Add a book deletion confirmation.
**How:** Show a confirmation modal or `confirm()` dialog before calling `DELETE /api/books/[id]`.

### Q: Convert localStorage auth to JWT.
**How:**
1. Install `jsonwebtoken`
2. In login route, generate a JWT with user data, return as HTTP-only cookie
3. In API routes, verify the JWT from the cookie
4. Use Next.js middleware to protect routes server-side

### Q: How would you add a real database?
**How:** Install Prisma or Drizzle ORM. Define schema. Replace repository methods to use ORM queries instead of array operations + `fs.writeFileSync`. Everything else (services, routes, frontend) stays the same thanks to the repository abstraction.

---

## 11. Things Done Weirdly — Full Audit

This section lists every questionable or unusual decision, evaluated from **architecture, security, code quality, performance, and UX** perspectives.

### 🔴 Critical Issues

| # | Issue | File(s) | Why It's Weird |
|---|-------|---------|----------------|
| 1 | **No real authentication** | `api/auth/login/route.ts`, `auth.ts` | Login is just an email lookup. No password, no JWT, no session. Anyone who knows an email can log in as that user including ADMIN. |
| 2 | **API routes have zero auth protection** | All `route.ts` files | Anyone can `curl DELETE /api/books/xyz` or `POST /api/users` from outside the app. No middleware, no token check. |
| 3 | **localStorage stores full User object** | `page.tsx`, `auth.ts` | Including `role`. A user can open DevTools → change `role` to `"ADMIN"` → access admin panel. |
| 4 | **JSON file storage with `writeFileSync`** | All repositories | Blocks the event loop, no concurrency handling, data lost on serverless redeployment. Race conditions possible. |
| 5 | **`satisfies` doesn't validate at runtime** | `auth.ts` | `JSON.parse(raw) satisfies User` is compile-time only. Malformed data passes through silently. |

### 🟡 Architectural Issues

| # | Issue | File(s) | Why It's Weird |
|---|-------|---------|----------------|
| 6 | **Every page is `"use client"`** | All `page.tsx` files | Defeats the purpose of Next.js App Router Server Components. Data fetching should happen server-side. |
| 7 | **`<a>` tags instead of `<Link>`** | `SidebarLayout.tsx` | Causes full page reloads on every sidebar navigation. Should use `next/link`. |
| 8 | **Duplicate type definitions** | `src/types/index.ts`, `admin/users/types/index.ts`, inline in pages | `Book`, `User`, `Issue`, `Location` redefined in 4+ places. Single source of truth violated. |
| 9 | **Three styling approaches mixed** | Various files | CSS Modules + Tailwind + inline styles used inconsistently across pages. |
| 10 | **No Next.js middleware** | (missing file) | Route protection done via `useEffect` — causes flash of unauthorized content before redirect. |
| 11 | **Overloaded GET endpoint** | `api/books/route.ts` | One endpoint returns all books, OR local search, OR external OpenLibrary search based on query params. |

### 🟡 Code Quality Issues

| # | Issue | File(s) | Why It's Weird |
|---|-------|---------|----------------|
| 12 | **`err: any` everywhere** | All route handlers | Should use `err: unknown` with proper type narrowing. `any` disables TypeScript safety. |
| 13 | **Inconsistent ID generation** | `bookService.ts`, `userService.ts` | Books use `crypto.randomUUID()` (good). Users use `` `u${Date.now()}` `` (bad — collision-prone). |
| 14 | **Repeated `as keyof typeof` casts** | `issueService.ts` | `location as keyof typeof book.locations` cast repeated 6 times. Should cast once or fix the type. |
| 15 | **`<img>` instead of `<Image>`** | `admin/search/page.tsx` | Every other page uses `next/image` but search page uses raw `<img>`. |
| 16 | **Unused dark mode CSS** | `globals.css` | Defines dark mode variables but every component overrides with light-colored inline styles. |
| 17 | **No input validation on POST bodies** | All POST routes | `req.json()` body is trusted blindly. Missing fields would cause cryptic errors. |
| 18 | **No error boundaries** | (missing `error.tsx`) | Runtime errors crash the whole page instead of showing a friendly fallback. |
| 19 | **No `loading.tsx` files** | (missing) | Could use Next.js convention for Suspense-based loading states. |
| 20 | **"lol" comments** | `auth.ts`, `userRepository.ts`, `openLibraryService.ts` | Unprofessional for a capstone presentation. |
| 21 | **Default boilerplate README** | `README.md` | Still the `create-next-app` default. Not customized at all. |
| 22 | **Hardcoded personal email** | `openLibraryService.ts` | `selvatharrun005@gmail.com` in the User-Agent header. Should be in `.env`. |
| 23 | **No testing** | (no test files) | No unit, integration, or E2E tests exist. No test framework installed. |

### 🟡 UX Issues

| # | Issue | File(s) | Why It's Weird |
|---|-------|---------|----------------|
| 24 | **`alert()` for feedback** | `admin/search/page.tsx`, `user/books/page.tsx` | Native browser alerts instead of toast notifications or inline messages. |
| 25 | **No pagination** | Admin dashboard, user books | All books fetched at once. Doesn't scale. |
| 26 | **No confirmation on delete** | N/A (delete not exposed in UI?) | Book deletion exists in API but no confirmation UX. |
| 27 | **No loading spinners** | All pages | Just plain text "Loading…" — no skeletons or spinners. |
| 28 | **Missing `<Link>` causes full reloads** | `SidebarLayout.tsx`, `user/page.tsx` | Navigation cards on user home also use `<a>` instead of `<Link>`. |

### 🔵 Minor Nitpicks

| # | Issue | File(s) | Why It's Weird |
|---|-------|---------|----------------|
| 29 | **Inconsistent formatting** | `auth.ts` | Unusual brace placement, extra blank lines inside try/catch. |
| 30 | **`useEffect` missing `router` in deps** | Multiple pages | `router` is used inside `useEffect` but not listed in the dependency array. ESLint would warn. |
| 31 | **Signup always creates `role: "USER"`** | `userService.ts` | No way to create an admin through the UI. Admin accounts must be hand-edited in JSON. |
| 32 | **`console.log(url)` left in** | `openLibraryService.ts` | Debug log statement left in production code. |
| 33 | **TypeScript strict mode on but `any` used** | `tsconfig.json`, various | `"strict": true` in config but `any` used in catch blocks and OpenLibrary mapping. |

---

## Quick Answers Cheat Sheet

| Question | One-line Answer |
|----------|----------------|
| What framework? | Next.js 16 with React 19 and TypeScript |
| App Router or Pages Router? | App Router exclusively |
| Database? | JSON files (no real DB) |
| Auth method? | Email-only lookup stored in localStorage |
| State management? | React `useState` + `useEffect` (no Redux/Zustand) |
| Styling? | CSS Modules primarily, some Tailwind, some inline |
| External API? | OpenLibrary for book metadata and covers |
| Testing? | None |
| Deployment target? | Local development (not deployed) |
| How many API routes? | 7 route handlers across 4 resource paths |
| Design patterns? | Repository pattern, Service layer, Component composition |
