# QuantumLeap Finance: Prototype-to-Production ToDo List

**Objective:** This document provides a tactical, file-by-file plan to transition the existing React prototype from a client-side application powered by mock data into the scalable, production-grade platform defined in the architectural blueprint.

---

### Phase 1: API Integration & Architecture Refactor (Priority: Critical)

*Goal: Decouple the frontend from mock data, connect it to a real backend API, and establish a scalable component architecture. This is the most critical phase to make the application data-driven and maintainable.*

-   [x] **~~Deprecate the Mock Service~~**
    -   **Status:** **Done.** `services/geminiService.ts` has been deleted and replaced with `services/finnhubService.ts`.

-   [x] **~~Abstract API Calls~~**
    -   **Status:** **Done.** A new `services/finnhubService.ts` has been created to handle all live data fetching.

-   [x] **~~Refactor to Component-Level Data Fetching~~**
    -   **Status:** **Done.** `Dashboard.tsx` is now a pure layout component. All data-fetching components fetch their own data.

-   [x] **~~Introduce a Server State Management Library~~**
    -   **Status:** **Done.** Integrated **TanStack Query (React Query)** across all data-fetching components (`StockHeader`, `FilingsTable`, `NewsFeed`, `Fundamentals`). Manual `useEffect`/`useState` logic for server state has been removed.

-   [ ] **Implement Real Authentication Flow (CRITICAL)**
    -   **Action:** Refactor the mock authentication to connect to a real backend.
    -   **Files Affected:**
        -   `hooks/useAuth.tsx`: Modify the `login` function to call a `/login` endpoint and store a JWT. The `user` state should be derived from the token or a `/me` endpoint. The `togglePlan` function should be removed.
        -   `components/Header.tsx`: Replace the "Toggle Plan" button with "Login" / "Logout" buttons and a link to a user profile/subscription page. The user's plan should be displayed from the real user object.

---

### Phase 2: Feature Enhancement & UX Improvement (Priority: High)

*Goal: Enhance core features from their basic prototype state and implement crucial performance optimizations for handling large-scale data.*

-   [x] **~~Display Fundamental Data~~**
    -   **Status:** **Done.** The `Fundamentals.tsx` component fetches and displays annual financial data, gated for 'Pro' users.

-   [x] **~~Enhance Search Bar with Autocomplete~~**
     -   **Status:** **Done.** The `SearchBar.tsx` component now includes a real-time, debounced autocomplete search feature.
     
-   [x] **~~Implement List Virtualization~~**
    -   **Status:** **Done.** `FilingsTable.tsx` and `NewsFeed.tsx` now use **TanStack Virtual** to efficiently render long lists, ensuring a smooth scrolling experience.

-   [x] **~~Integrate WebSocket for Real-Time Price Updates~~**
    -   **Status:** **Done.** A `WebSocketManager` has been implemented in `services/finnhubService.ts` and integrated into `components/StockHeader.tsx` to provide live, ticking price updates.

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