# Library Management System — Capstone Q&A

> Comprehensive questions & answers covering **Next.js**, **React**, and **TypeScript** concepts used in this project.

---

## Table of Contents

1. [Next.js Architecture & Routing](#1-nextjs-architecture--routing)
2. [Server vs Client Components](#2-server-vs-client-components)
3. [API Routes (Route Handlers)](#3-api-routes-route-handlers)
4. [React Concepts](#4-react-concepts)
5. [TypeScript Concepts](#5-typescript-concepts)
6. [Data Layer (Services & Repositories)](#6-data-layer-services--repositories)
7. [OpenLibrary Integration](#7-openlibrary-integration)
8. [Authentication Flow](#8-authentication-flow)
9. [State Management & UI Patterns](#9-state-management--ui-patterns)
10. [Styling](#10-styling)
11. [Possible Live Additions They Might Ask](#11-possible-live-additions-they-might-ask)

---

## 1. Next.js Architecture & Routing

### Q: How does routing work in this project?

**A:** This project uses the **Next.js App Router** (introduced in Next.js 13+). Routes are defined by the folder structure inside `src/app/`. Each folder with a `page.tsx` becomes a route:

| Folder | URL |
|---|---|
| `src/app/page.tsx` | `/` (login) |
| `src/app/admin/page.tsx` | `/admin` |
| `src/app/admin/search/page.tsx` | `/admin/search` |
| `src/app/admin/users/page.tsx` | `/admin/users` |
| `src/app/user/page.tsx` | `/user` |
| `src/app/user/books/page.tsx` | `/user/books` |
| `src/app/user/my-books/page.tsx` | `/user/my-books` |

No manual route configuration needed — the file system **is** the router.

---

### Q: What is a `layout.tsx` and how is it used here?

**A:** A `layout.tsx` wraps all pages in its directory and sub-directories. It persists across navigations (doesn't re-mount). We have three:

- **`app/layout.tsx`** — Root layout with `<html>` and `<body>` tags, applies `globals.css`.
- **`app/admin/layout.tsx`** — Admin sidebar with nav links (Dashboard, Search & Add, Users) + Sign Out.
- **`app/user/layout.tsx`** — User sidebar with nav links (Home, Browse Books, My Books) + Sign Out.

Layouts are nested: admin pages get `RootLayout → AdminLayout → Page`.

---

### Q: What are dynamic route segments? Where are they used?

**A:** Folders named `[param]` create dynamic routes. We use them in API routes:

- `api/books/[id]/route.ts` → matches `/api/books/any-id-here`
- `api/issues/[id]/route.ts` → matches `/api/issues/any-id-here`
- `api/users/[id]/route.ts` → matches `/api/users/any-id-here`

The `id` parameter is accessed via the `params` object in the route handler.

---

### Q: Why do the `[id]` route handlers use `await params` instead of `params.id` directly?

**A:** In **Next.js 15+**, `params` in route handlers is a `Promise`, not a plain object. You must `await` it:

```typescript
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Must await!
  // ...
}
```

If you don't await, `id` will be a Promise object, and lookups like `findById(id)` will always fail with "not found".

---

### Q: What's the difference between the `app/` directory and the `pages/` directory?

**A:** The `app/` directory is the **App Router** (new). The `pages/` directory is the **Pages Router** (legacy). This project exclusively uses the App Router. Key differences:
- App Router supports React Server Components by default
- Layouts are nested and persistent
- Route handlers use `route.ts` instead of `pages/api/`
- Loading, error, and not-found states are handled by convention files

---

## 2. Server vs Client Components

### Q: What does `"use client"` mean and where is it used?

**A:** By default, components in the App Router are **Server Components** (rendered on the server). Adding `"use client"` at the top makes them **Client Components** (rendered in the browser).

We use `"use client"` on pages that need:
- **React hooks** (`useState`, `useEffect`, `useRouter`)
- **Browser APIs** (`localStorage`, `fetch` from the browser)
- **Event handlers** (`onClick`, `onChange`, `onSubmit`)

**All our page components** are client components because they need interactivity:
- `page.tsx` (login) — form state, localStorage
- `admin/page.tsx` — filter state, fetch, inline editing
- `user/books/page.tsx` — search, borrow modal
- `user/my-books/page.tsx` — tabs, return action

---

### Q: Can server components use `useState` or `useEffect`?

**A:** **No.** Server Components cannot use any React hooks, browser APIs, or event handlers. They run only on the server. If you need interactivity, you must mark the component with `"use client"`.

---

### Q: Are the API route files server or client?

**A:** API route handlers (`route.ts` files) **always run on the server**. They never need `"use client"`. They can access the file system (`fs`), environment variables, and server-only modules.

---

## 3. API Routes (Route Handlers)

### Q: How are API routes structured?

**A:** Each `route.ts` file exports named functions for HTTP methods:

```typescript
// GET → fetch data
export async function GET(req: Request) { ... }

// POST → create data
export async function POST(req: Request) { ... }

// PATCH → partial update
export async function PATCH(req: Request) { ... }

// DELETE → remove data
export async function DELETE(req: Request) { ... }
```

The function name **must** match the HTTP method exactly (uppercase).

---

### Q: Walk through the flow when a user borrows a book.

**A:**
1. **Frontend** (`user/books/page.tsx`): User clicks "Borrow", selects a branch, clicks "Confirm".
2. **Fetch**: `POST /api/issues` with body `{ userId, bookId, location }`.
3. **API route** (`api/issues/route.ts`): Parses body, calls `IssueService.issueBook(userId, bookId, location)`.
4. **IssueService.issueBook()**:
   - Validates user exists (via `UserRepository`)
   - Validates book exists (via `BookRepository`)
   - Checks available copies at location > 0
   - Checks user hasn't already borrowed this book
   - Decrements `book.locations[location].available` by 1
   - Updates book via `BookRepository.update()`
   - Creates an `Issue` record with status `"ISSUED"`, due in 14 days
   - Persists via `IssueRepository.create()`
5. **Response**: Returns the created Issue object (201 status).
6. **Frontend**: Updates local state to reflect decreased availability.

---

### Q: How do you read query parameters in a route handler?

**A:** Using the `URL` constructor:

```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");        // /api/books?q=harry
  const external = searchParams.get("external"); // /api/books?external=true
}
```

---

### Q: How do you read the request body in a POST/PATCH?

**A:** Using `req.json()` which returns a Promise:

```typescript
export async function POST(req: Request) {
  const body = await req.json();
  // body.userId, body.bookId, etc.
}
```

---

### Q: What does `NextResponse.json()` do?

**A:** It creates a JSON HTTP response. Usage:

```typescript
return NextResponse.json(data);                    // 200 OK
return NextResponse.json(data, { status: 201 });   // 201 Created
return NextResponse.json({ error: "msg" }, { status: 400 }); // Error
```

---

## 4. React Concepts

### Q: Explain the `useState` hook and where it's used.

**A:** `useState` declares a reactive state variable. When the state changes, the component re-renders:

```typescript
const [books, setBooks] = useState<Book[]>([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState("");
```

Used everywhere for: form inputs, filter values, modal visibility, fetched data, loading flags, error messages.

---

### Q: Explain the `useEffect` hook and where it's used.

**A:** `useEffect` runs side effects after render. With `[]` dependency array, it runs once on mount:

```typescript
useEffect(() => {
  fetch("/api/books")
    .then((r) => r.json())
    .then((data) => { setBooks(data); setLoading(false); });
}, []);
```

We use it to **fetch data on page load** in:
- Admin dashboard (books)
- User books page (books)
- My Books page (issues + books)
- User home (issue count)
- Admin users (users + books)

---

### Q: What is "lifting state up"?

**A:** Moving state to a parent so multiple children can share it. In admin dashboard, `AdminDashboard` holds the `books` array and passes `onUpdated` callback to each `BookCard`. When a card saves edits, it calls `onUpdated(updatedBook)` which updates the parent's state.

---

### Q: Explain conditional rendering in this project.

**A:** Several patterns are used:

```tsx
// && short-circuit — render only if truthy
{book.coverUrl && <img src={book.coverUrl} />}
{error && <div className={styles.errorMsg}>{error}</div>}

// Ternary — either/or
{loading ? <p>Loading…</p> : <div>{content}</div>}

// Ternary for class names
className={`${styles.tab} ${tab === "active" ? styles.tabActive : ""}`}

// Conditional in map return
{expanded ? <EditableRow /> : <ReadOnlyRow />}
```

---

### Q: How does the borrow modal work?

**A:** It uses state to track which book is selected:

```typescript
const [borrowBook, setBorrowBook] = useState<Book | null>(null);
```

- When `borrowBook` is `null` → modal hidden
- When user clicks "Borrow" → `setBorrowBook(book)` → modal shows
- Cancel/success → `setBorrowBook(null)` → modal hidden

The modal is rendered conditionally with `{borrowBook && (<div className={styles.overlay}>...`

---

### Q: What is the `key` prop and why is it important?

**A:** React uses `key` to efficiently identify items in lists. We use `book.id` or `issue.id`:

```tsx
{books.map((book) => <BookCard key={book.id} ... />)}
```

Without unique keys, React can't track which items changed, leading to bugs with state and poor performance.

---

## 5. TypeScript Concepts

### Q: What are the type definitions used in this project?

**A:** Defined in `src/types/index.ts`:

```typescript
export type Role = "ADMIN" | "STUDENT";          // Union type (literal)
export type Location = "Chennai" | "Bangalore" | "Delhi" | "Mumbai";
export type IssueStatus = "ISSUED" | "RETURNED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publishedYear?: number | null;    // Optional + nullable
  coverUrl?: string | null;
  summary?: string | null;
  workKey?: string;                  // Optional
  category?: string;
  locations: Record<Location, LocationStock>;  // Mapped type
  createdAt: string;
}

export interface Issue { ... }
```

---

### Q: What is a **union type** and where is it used?

**A:** A union type allows a value to be one of several types:

```typescript
type Role = "ADMIN" | "STUDENT";           // String literal union
type Location = "Chennai" | "Bangalore" | "Delhi" | "Mumbai";
publishedYear?: number | null;              // number or null
```

In the login page: `useState<"login" | "signup">("login")` — mode can only be one of those two strings.

---

### Q: What does `?` mean in `publishedYear?: number | null`?

**A:** The `?` makes the property **optional** — the object may or may not have it. `| null` means the value can also be explicitly `null`. So `publishedYear` can be:
- Missing (undefined)
- Present but `null`
- Present with a number

---

### Q: What is `Record<K, V>` and where is it used?

**A:**  `Record<K, V>` creates an object type where keys are of type `K` and values are of type `V`:

```typescript
locations: Record<Location, LocationStock>
```

This means `locations` must have **exactly** keys `"Chennai" | "Bangalore" | "Delhi" | "Mumbai"`, each with value `{ total: number; available: number }`.

---

### Q: What's a **type assertion** and where is it used?

**A:** A type assertion tells TypeScript "trust me, I know the type":

```typescript
let books: Book[] = rawBooks as Book[];
```

In the repositories, we import JSON files and assert them as typed arrays because TypeScript can't automatically verify JSON matches our interfaces.

---

### Q: What are generics? Where are they used?

**A:** Generics are type parameters — like function arguments but for types:

```typescript
useState<Book[]>([])           // State will hold Book array
useState<string | null>(null)  // State will hold string or null
useState<"login" | "signup">("login")  // State restricted to these literals
```

React's `useState` is generic: `useState<T>(initial: T)` — you specify what type of state it holds.

---

### Q: Difference between `interface` and `type`?

**A:** Both define object shapes. In this project:
- `interface` is used for data models (`User`, `Book`, `Issue`) — can be extended
- `type` is used for unions and aliases (`Role`, `Location`, `IssueStatus`) — more flexible

General guideline: use `interface` for objects, `type` for everything else.

---

### Q: What's the `as const` assertion used for?

**A:** In the user pages:

```typescript
const LOCATIONS = ["Chennai", "Bangalore", "Delhi", "Mumbai"] as const;
type Location = typeof LOCATIONS[number];
```

`as const` makes the array **readonly** with literal types (not just `string[]`). Then `typeof LOCATIONS[number]` extracts the union `"Chennai" | "Bangalore" | "Delhi" | "Mumbai"` from it. This avoids duplicating the list as both an array and a type.

---

## 6. Data Layer (Services & Repositories)

### Q: Explain the Repository pattern used here.

**A:** The repositories (`bookRepository.ts`, `userRepository.ts`, `issueRepository.ts`) are the **only layer that touches the data files**. They provide CRUD methods:

```
JSON file ← persist() / readSync → Repository → Service → API Route → Frontend
```

- **Repository**: Raw data access — `findAll()`, `findById()`, `create()`, `update()`, `delete()`, `persist()`
- **Service**: Business logic — validation, duplicate checks, stock management
- **API Route**: HTTP interface — parses requests, calls services, returns responses

---

### Q: How does data persistence work?

**A:** Data is stored in JSON files (`books.json`, `users.json`, `issues.json`). The repositories:
1. Load data once at startup via `import` (cached in memory as a module-level variable)
2. All reads/writes happen on the in-memory array
3. On any mutation, `persist()` writes the entire array back to the JSON file using `fs.writeFileSync()`

```typescript
private static persist() {
  fs.writeFileSync(filePath, JSON.stringify(books, null, 2));
}
```

---

### Q: Why use a service layer instead of calling the repository directly from API routes?

**A:** The service layer handles **business logic** that shouldn't live in routes:
- **Validation**: "available can't exceed total", "copies must be > 0"
- **Duplicate detection**: ISBN, workKey, or title match before creating a book
- **Cross-entity operations**: Borrowing a book touches both `BookRepository` (stock) and `IssueRepository` (record)
- **Reusability**: Multiple routes can use the same service method

---

### Q: What is the `static` keyword on the service/repository methods?

**A:** `static` means the method belongs to the **class itself**, not to instances. You call it as `BookService.getAll()` without ever writing `new BookService()`. We use this pattern because:
- Services are stateless — no instance data needed
- Cleaner API: `BookRepository.findById(id)` reads naturally
- No need to manage instances or dependency injection

---

## 7. OpenLibrary Integration

### Q: How does the OpenLibrary search work?

**A:** `OpenLibraryService.searchBooks(query)`:
1. Calls `https://openlibrary.org/search.json?q=...`
2. Parses the response, takes first 10 results
3. Maps each to `{ title, author, publishedYear, isbn, workKey, coverUrl }`
4. Cover URL is built from `cover_i`: `https://covers.openlibrary.org/b/id/{cover_i}-L.jpg`

---

### Q: How does importing a book work?

**A:** `BookService.importBook()`:
1. If ISBN is provided → fetches metadata via `getBookByISBN()` (uses OpenLibrary's books API)
2. If only workKey → fetches via `getWorkDetails()` (uses OpenLibrary's works API)
3. Checks for duplicates by ISBN, then workKey, then title
4. If duplicate found → increases stock at the selected location
5. If new → creates a new `Book` object with `crypto.randomUUID()` and saves it

---

### Q: What was the cover URL bug and how was it fixed?

**A:** Two issues:
1. **`getWorkDetails()`** used `data.cover_id` but the works API returns `data.covers` (an array). Fixed to `data.covers?.[0]`.
2. **`getBookByISBN()`** used `bookData.cover_i` but the ISBN API returns `bookData.cover` (an object with `large`/`medium`/`small` URLs). Fixed to `bookData.cover?.large ?? bookData.cover?.medium`.

The search itself worked because it used `doc.cover_i` which is correct for the search API.

---

## 8. Authentication Flow

### Q: How does login work?

**A:**
1. User enters email on the login page (`/`)
2. Frontend POSTs to `/api/auth/login` with `{ email }`
3. API calls `UserService.getUserByEmail(email)` → looks up in `users.json`
4. If found, returns the full user object; if not, returns 401
5. Frontend stores user in `localStorage` as `lms_user`
6. Redirects to `/admin` (if ADMIN) or `/user` (if STUDENT)

---

### Q: How does sign-up work?

**A:**
1. User clicks "Sign Up" toggle on the login page
2. Enters name + email, submits
3. Frontend POSTs to `/api/users` with `{ name, email }`
4. `UserService.createUser()` checks for duplicate email, creates user with role `"STUDENT"`
5. User is persisted to `users.json`
6. Frontend auto-logs them in (stores in localStorage) and redirects to `/user`

---

### Q: How do pages know who the current user is?

**A:** Each user page calls `getStoredUser()` from `libs/auth.ts` which reads `localStorage`:

```typescript
export function getStoredUser() {
  const raw = localStorage.getItem("lms_user");
  return raw ? JSON.parse(raw) : null;
}
```

If no user is found (or wrong role), the page redirects to `/` via `router.replace("/")`.

---

### Q: Is this authentication secure?

**A:** No — this is a **simple prototype**. In production you'd use:
- Password hashing (bcrypt)
- JWT or session cookies (not localStorage)
- Middleware for role-based route protection
- HTTPS enforcement

localStorage is used here for simplicity, but it's vulnerable to XSS.

---

## 9. State Management & UI Patterns

### Q: How does filtering work on the admin dashboard?

**A:** Three filter states: `search`, `filterLocation`, `filterCategory`. Filtered list is computed on every render:

```typescript
const filtered = books.filter((book) => {
  const matchSearch = !q || book.title.includes(q) || book.author.includes(q);
  const matchLocation = !filterLocation || book.locations[filterLocation].total > 0;
  const matchCategory = !filterCategory || book.category === filterCategory;
  return matchSearch && matchLocation && matchCategory;
});
```

No separate state for the filtered list — it's **derived** from the source + filters. This is a React best practice (avoid redundant state).

---

### Q: How does inline editing work for book quantities?

**A:** The `BookCard` component manages its own edit state:

1. `draft` state holds a deep copy of `book.locations` (via `JSON.parse(JSON.stringify(...))`)
2. User clicks "Edit Quantities" → `editing = true` → inputs appear
3. Number inputs modify `draft`, not the original data
4. "Save" sends `PATCH /api/books/{id}` with `{ locations: draft }`
5. On success, `onUpdated(data)` propagates the change to the parent
6. "Cancel" restores draft from the original book and exits edit mode

---

### Q: Why use `JSON.parse(JSON.stringify(...))` for the draft?

**A:** It creates a **deep clone**. Without it, modifying the draft would mutate the original book object (since objects in JavaScript are passed by reference). We need an independent copy so canceling discards changes cleanly.

---

### Q: How does the tabs pattern work in My Books?

**A:**

```typescript
const [tab, setTab] = useState<"active" | "returned">("active");

const filtered = issues.filter((i) =>
  tab === "active" ? i.status === "ISSUED" : i.status === "RETURNED"
);
```

Two buttons toggle the `tab` state. The displayed list is filtered from the same `issues` array — no separate fetch per tab.

---

## 10. Styling

### Q: What styling approaches are used?

**A:** Three approaches:

1. **CSS Modules** (`dashboard.module.css`, `user.module.css`, `search.module.css`) — scoped, no class name collisions. Used as `styles.className`.
2. **Tailwind CSS** — utility classes for layouts/sidebars (`className="flex min-h-screen"`).
3. **Inline styles** — quick one-off styles on the login page and admin users page.

---

### Q: How do CSS Modules work?

**A:** Import gives you an object of locally-scoped class names:

```tsx
import styles from "./dashboard.module.css";
<div className={styles.card}>  // Compiles to .card_abc123
```

Two modules can both have `.card` without conflict — the build tool makes them unique.

---

### Q: Why `align-items: start` on the grid?

**A:** CSS Grid defaults to `align-items: stretch`, which makes all items in a row the same height. When one card expands (dropdown), adjacent cards stretch to match — looking like their content leaked. `align-items: start` makes each card independent.

---

## 11. Possible Live Additions They Might Ask

### "Add a delete button to each book card on the admin dashboard"

Add to `BookCard` component:
```tsx
const handleDelete = async () => {
  if (!confirm("Delete this book?")) return;
  await fetch(`/api/books/${book.id}`, { method: "DELETE" });
  onUpdated({ ...book, id: "" }); // signal parent to remove
};
<button onClick={handleDelete}>Delete</button>
```
Update parent to filter out deleted books.

---

### "Add a category field to the import modal"

Already exists in `admin/search/page.tsx` — the category dropdown in the Add to Library modal.

---

### "Show overdue books count on the admin dashboard"

Add a `useEffect` to fetch all issues, count where `status === "ISSUED"` and `dueDate < now`.

---

### "Add a new location (e.g., Hyderabad)"

1. Add `"Hyderabad"` to the `Location` type in `types/index.ts`
2. Add `Hyderabad: { total: 0, available: 0 }` to the default locations in `bookService.ts` `importBook()`
3. Add the option to all `<select>` dropdowns
4. Existing books in `books.json` would need the new key added

---

### "Add pagination to the books list"

```typescript
const PAGE_SIZE = 12;
const [page, setPage] = useState(1);
const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
```

Render `paginated` instead of `filtered`, add prev/next buttons.

---

### "Sort books by title or author"

```typescript
const [sortBy, setSortBy] = useState<"title" | "author">("title");
const sorted = [...filtered].sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
```

---

### "Add form validation for the sign-up"

Already checks for empty fields. Could add:
```typescript
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  setError("Invalid email format");
  return;
}
if (name.trim().length < 2) {
  setError("Name must be at least 2 characters");
  return;
}
```

---

### Quick Reference — Key Files

| File | Purpose |
|---|---|
| `types/index.ts` | All TypeScript interfaces & types |
| `libs/auth.ts` | `getStoredUser()` helper |
| `libs/repositories/*.ts` | Data access (JSON read/write) |
| `libs/services/*.ts` | Business logic |
| `app/api/**/route.ts` | HTTP endpoints |
| `app/page.tsx` | Login / Sign Up |
| `app/admin/page.tsx` | Inventory dashboard (filters, edit) |
| `app/admin/search/page.tsx` | OpenLibrary search & import |
| `app/admin/users/page.tsx` | User management |
| `app/user/books/page.tsx` | Browse & borrow |
| `app/user/my-books/page.tsx` | View borrows & return |
