# QuantumLeap Finance: Prototype-to-Production ToDo List

**Objective:** This document provides a tactical, file-by-file plan to transition the existing React prototype from a client-side application powered by mock data into the scalable, production-grade platform defined in the architectural blueprint.

---

### Phase 1: API Integration & State Management (Priority: Critical)

*Goal: Decouple the frontend from mock data generators and connect it to a real backend API. This is the most critical phase to make the application data-driven.*

-   [x] **~~Deprecate the Mock Service~~**
    -   **Action:** ~~Once all data fetching has been migrated to the new `apiClient`, the mock service can be safely removed.~~
    -   **Status:** **Done.** `services/geminiService.ts` has been deleted and replaced with `services/finnhubService.ts`.

-   [x] **~~Abstract API Calls~~**
    -   **Action:** ~~Create a new service, e.g., `services/apiClient.ts`, that uses a configured `axios` or `fetch` instance.~~
    -   **Status:** **Done.** A new `services/finnhubService.ts` has been created to handle all live data fetching.

-   [ ] **Introduce a Server State Management Library**
    -   **Action:** Integrate **TanStack Query (React Query)** into the project. This will manage data fetching, caching, background refetching, and mutations, greatly simplifying server state and removing manual `useEffect` logic.
    -   **Files Affected:** `App.tsx` (to add the `QueryClientProvider`), all components currently fetching data.

-   [ ] **Refactor Data Fetching Logic to use TanStack Query**
    -   **Action:** Replace all `useEffect`-based data fetching with `useQuery` hooks from TanStack Query.
    -   **Files Affected:**
        -   `components/Dashboard.tsx`: Replace the `useEffect` block with a `useQuery`.
        -   `components/FilingsTable.tsx`: Replace the `useEffect` block in `FilingsTableContent` with a `useQuery`.
        -   `components/NewsFeed.tsx`: Replace the `useEffect` block with a `useQuery`.

-   [ ] **Implement Real Authentication Flow**
    -   **Action:** Refactor the mock authentication to connect to a real backend.
    -   **Files Affected:**
        -   `hooks/useAuth.tsx`: Modify the `login` function to call a `/login` endpoint and store a JWT. The `user` state should be derived from the token or a `/me` endpoint. The `togglePlan` function should be removed.
        -   `components/Header.tsx`: Replace the "Toggle Plan" button with "Login" / "Logout" buttons and a link to a user profile/subscription page. The user's plan should be displayed from the real user object.

---

### Phase 2: Feature Enhancement & UX Improvement (Priority: High)

*Goal: Enhance core features from their basic prototype state and implement crucial performance optimizations for handling large-scale data.*

-   [ ] **Integrate WebSocket for Real-Time Price Updates**
    -   **Action:** Use Finnhub's WebSocket API to get live price ticks and update the `StockHeader` component in real-time without needing to refresh the page.
    -   **Files Affected:** `components/StockHeader.tsx`, `services/finnhubService.ts`.

-   [ ] **Implement List Virtualization**
    -   **Action:** Re-implement the list rendering logic using a virtualization library like **TanStack Virtual**.
    -   **Reason:** The current `.map()` implementation will cause severe performance degradation and potential browser crashes when rendering thousands of real filings or news articles.
    -   **Files Affected:** `components/FilingsTable.tsx`, `components/NewsFeed.tsx`.

-   [ ] **Add Server-Side Data Controls**
    -   **Action:** Implement UI controls for pagination, sorting, and filtering for filings and news. The state from these controls should be passed to the API.
    -   **Files Affected:** `components/FilingsTable.tsx`, `components/NewsFeed.tsx`.

-   [ ] **Enhance Search Bar with Autocomplete**
    -   **Action:** Implement a type-ahead/autocomplete feature that queries Finnhub's `/search` endpoint as the user types.
    -   **Files Affected:** `components/SearchBar.tsx`.

---

### Phase 3: Architectural Improvements & Production Readiness (Priority: Medium)

*Goal: Solidify the application's architecture for scalability, maintainability, and SEO, and conduct final checks before a production launch.*

-   [ ] **Consider a Meta-Framework (Next.js)**
    -   **Action:** Evaluate migrating the application from a pure Client-Side Rendered (CSR) app to **Next.js**.
    -   **Benefits:** This would provide Server-Side Rendering (SSR) for dramatically faster initial page loads (critical for user perception of speed) and superior SEO, which is essential for a public-facing platform.
    -   **Files Affected:** This would be a significant architectural change affecting the entire project structure.

-   [ ] **Full Accessibility (a11y) Audit**
    -   **Action:** Conduct a thorough audit to ensure the application is fully accessible. This includes checking color contrast, adding ARIA attributes where necessary, and ensuring full keyboard navigability.
    -   **Files Affected:** All components.

-   [ ] **Centralize Type Definitions**
    -   **Action:** As part of a monorepo migration, move the contents of `types.ts` to a shared library (`/libs/common-types`) so that both frontend and backend services can use the same, single source of truth for data structures.
    -   **Files Affected:** `types.ts`.
