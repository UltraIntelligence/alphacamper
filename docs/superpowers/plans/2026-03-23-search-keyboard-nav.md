# Search Keyboard Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add arrow-key navigation and Enter-to-select to both search comboboxes in the Alphacamper site.

**Architecture:** Extract a pure `getNextHighlightedIndex` helper for testability, then add `highlightedIndex` state + keyboard handler to each component independently. `ParkSearch` keeps its existing dropdown structure; `StepSearch` converts `<button>` result items to `<div role="option">` to satisfy ARIA combobox rules.

**Tech Stack:** React 19, Next.js 16, TypeScript, Vitest 4.1 (unit tests only — no DOM test setup exists)

**Spec:** `docs/superpowers/specs/2026-03-23-search-keyboard-nav-design.md`

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `alphacamper-site/lib/search-nav.ts` | Pure helper: compute next highlighted index from keypress |
| Create | `alphacamper-site/__tests__/search-nav.test.ts` | Unit tests for the helper |
| Modify | `alphacamper-site/components/landing/ParkSearch.tsx` | Add keyboard nav + ARIA to landing hero search |
| Modify | `alphacamper-site/components/watch/StepSearch.tsx` | Add keyboard nav + ARIA to wizard step 1 |
| Modify | `alphacamper-site/app/globals.css` | Add `[data-highlighted="true"]` styles for both item types |

---

## Task 1: Extract and test `getNextHighlightedIndex`

**Files:**
- Create: `alphacamper-site/lib/search-nav.ts`
- Create: `alphacamper-site/__tests__/search-nav.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `alphacamper-site/__tests__/search-nav.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getNextHighlightedIndex } from '@/lib/search-nav'

describe('getNextHighlightedIndex', () => {
  describe('ArrowDown', () => {
    it('moves from -1 to 0', () => {
      expect(getNextHighlightedIndex('ArrowDown', -1, 3)).toBe(0)
    })
    it('advances forward', () => {
      expect(getNextHighlightedIndex('ArrowDown', 1, 3)).toBe(2)
    })
    it('wraps from last to first', () => {
      expect(getNextHighlightedIndex('ArrowDown', 2, 3)).toBe(0)
    })
  })

  describe('ArrowUp', () => {
    it('moves from -1 to last', () => {
      expect(getNextHighlightedIndex('ArrowUp', -1, 3)).toBe(2)
    })
    it('moves from 0 to last (wrap)', () => {
      expect(getNextHighlightedIndex('ArrowUp', 0, 3)).toBe(2)
    })
    it('decrements normally', () => {
      expect(getNextHighlightedIndex('ArrowUp', 2, 3)).toBe(1)
    })
  })

  describe('other keys', () => {
    it('returns current index unchanged', () => {
      expect(getNextHighlightedIndex('Enter', 1, 3)).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('returns -1 when total is 0', () => {
      expect(getNextHighlightedIndex('ArrowDown', -1, 0)).toBe(-1)
      expect(getNextHighlightedIndex('ArrowUp', -1, 0)).toBe(-1)
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd alphacamper-site && npm test -- search-nav
```

Expected: FAIL — `Cannot find module '@/lib/search-nav'`

- [ ] **Step 3: Implement the helper**

Create `alphacamper-site/lib/search-nav.ts`:

```typescript
/**
 * Computes the next highlighted index in a search result list based on a keypress.
 * Returns -1 (no selection) when the list is empty.
 */
export function getNextHighlightedIndex(
  key: string,
  current: number,
  total: number,
): number {
  if (total === 0) return -1
  if (key === 'ArrowDown') return (current + 1) % total
  if (key === 'ArrowUp') return current <= 0 ? total - 1 : current - 1
  return current
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd alphacamper-site && npm test -- search-nav
```

Expected: All 8 tests pass.

- [ ] **Step 5: Commit**

```bash
cd alphacamper-site && git add lib/search-nav.ts __tests__/search-nav.test.ts && git commit -m "feat: add getNextHighlightedIndex helper for search keyboard nav"
```

---

## Task 2: Add highlighted styles to CSS

**Files:**
- Modify: `alphacamper-site/app/globals.css`

- [ ] **Step 1: Add `.park-search-item[data-highlighted="true"]`**

In `globals.css`, find `.park-search-item:hover { background: #f5f5f5; }` (line ~356) and add immediately after:

```css
.park-search-item[data-highlighted="true"] { background: #f5f5f5; }
```

- [ ] **Step 2: Add `.selectable-item[data-highlighted="true"]`**

Find `.selectable-item:hover { border-color: var(--color-accent); }` (line ~1569) and add immediately after:

```css
.selectable-item[data-highlighted="true"] { border-color: var(--color-accent); }
```

- [ ] **Step 3: Commit**

```bash
cd alphacamper-site && git add app/globals.css
git commit -m "feat: add data-highlighted styles for search keyboard nav"
```

---

## Task 3: Keyboard navigation in `ParkSearch.tsx`

**Files:**
- Modify: `alphacamper-site/components/landing/ParkSearch.tsx`

Current state: has `isOpen` state, `role="listbox"` on dropdown div, `role="option"` on items. Enter key calls `handleSubmit()`. No keyboard nav.

- [ ] **Step 1: Add import and state**

Add `getNextHighlightedIndex` import and `highlightedIndex` state. At the top of the file, add to the existing import:

```typescript
import { getNextHighlightedIndex } from '@/lib/search-nav'
```

Inside the component, add after the existing state declarations:

```typescript
const [highlightedIndex, setHighlightedIndex] = useState(-1)
const itemsRef = useRef<(HTMLElement | null)[]>([])
```

- [ ] **Step 2: Reset index when results or open state changes**

There are **three** sites in `handleChange` that need `setHighlightedIndex(-1)`:

**Site 1 — early return (query too short):**
```typescript
// existing
setResults([])
setIsOpen(false)
// add:
setHighlightedIndex(-1)
return
```

**Site 2 — inside the debounce callback (new search results arrive):**
```typescript
// existing
setResults(matches)
setIsOpen(matches.length > 0)
// add:
setHighlightedIndex(-1)
```

**Site 3 — `handleSelect`:** after `setIsOpen(false)` add `setHighlightedIndex(-1)`.

- [ ] **Step 3: Add scroll-into-view effect**

Add after the existing `useEffect` blocks:

```typescript
useEffect(() => {
  if (highlightedIndex >= 0) {
    itemsRef.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
  }
}, [highlightedIndex])
```

- [ ] **Step 4: Replace onKeyDown handler**

Find the input's `onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}` and replace entirely:

```typescript
onKeyDown={(e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    setHighlightedIndex(getNextHighlightedIndex(e.key, highlightedIndex, results.length))
  } else if (e.key === 'Enter') {
    if (highlightedIndex >= 0 && results[highlightedIndex] != null) {
      handleSelect(results[highlightedIndex])
    } else {
      handleSubmit()
    }
  } else if (e.key === 'Escape') {
    setIsOpen(false)
    setHighlightedIndex(-1)
  }
}}
```

- [ ] **Step 5: Add ARIA to input**

Add these props to the `<input>` element:

```typescript
role="combobox"
aria-expanded={isOpen}
aria-autocomplete="list"
aria-controls="park-search-listbox"
aria-activedescendant={highlightedIndex >= 0 ? `park-search-result-${highlightedIndex}` : undefined}
```

- [ ] **Step 6: Update listbox container and result items**

Add `id="park-search-listbox"` to the `<div className="park-search-dropdown">`.

Update each result item `<div>` in the `.map()`:

```tsx
<div
  key={`${park.id}:${park.platform}`}
  ref={(el) => { itemsRef.current[index] = el }}
  id={`park-search-result-${index}`}
  className="park-search-item"
  data-highlighted={index === highlightedIndex ? 'true' : undefined}
  onClick={() => handleSelect(park)}
  role="option"
  aria-selected={index === highlightedIndex}
>
```

Note: add `index` to the `.map()` callback: `results.map((park, index) => ...)`.

- [ ] **Step 7: Verify manually**

Start the dev server (`cd alphacamper-site && npm run dev`), open the landing page, type in the search box, and confirm:
- Arrow down/up moves highlight through results
- Enter selects the highlighted result and navigates
- Escape dismisses the dropdown
- Without highlight, Enter still triggers search/navigate

- [ ] **Step 8: Commit**

```bash
cd alphacamper-site && git add components/landing/ParkSearch.tsx
git commit -m "feat: add keyboard navigation to ParkSearch combobox"
```

---

## Task 4: Keyboard navigation in `StepSearch.tsx`

**Files:**
- Modify: `alphacamper-site/components/watch/StepSearch.tsx`

Current state: result items are `<button className="selectable-item">`. No ARIA beyond the input. No keyboard nav.

- [ ] **Step 1: Add import and state**

Add import:
```typescript
import { getNextHighlightedIndex } from '@/lib/search-nav'
```

Add inside component after existing state:
```typescript
const [highlightedIndex, setHighlightedIndex] = useState(-1)
const itemsRef = useRef<(HTMLElement | null)[]>([])
```

- [ ] **Step 2: Reset index on results/selection changes**

In the debounce callback where `setResults(...)` is called, also call `setHighlightedIndex(-1)`.

In `handleSelect`, add `setHighlightedIndex(-1)`.

In `handleClear`, add `setHighlightedIndex(-1)`.

Where `setResults([])` is called (query too short or error), also call `setHighlightedIndex(-1)`.

- [ ] **Step 3: Add scroll-into-view effect**

```typescript
useEffect(() => {
  if (highlightedIndex >= 0) {
    itemsRef.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
  }
}, [highlightedIndex])
```

- [ ] **Step 4: Add onKeyDown to input**

The current input has no `onKeyDown`. Add:

```typescript
onKeyDown={(e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    setHighlightedIndex(getNextHighlightedIndex(e.key, highlightedIndex, results.length))
  } else if (e.key === 'Enter') {
    if (highlightedIndex >= 0 && results[highlightedIndex] != null) {
      handleSelect(results[highlightedIndex])
    }
  } else if (e.key === 'Escape') {
    setResults([])
    setHighlightedIndex(-1)
  }
}}
```

- [ ] **Step 5: Add ARIA to input**

Add to the `<input>` element:

```typescript
role="combobox"
aria-expanded={!isSelected && results.length > 0}
aria-autocomplete="list"
aria-controls="step-search-listbox"
aria-activedescendant={highlightedIndex >= 0 ? `step-search-result-${highlightedIndex}` : undefined}
```

- [ ] **Step 6: Convert result items from buttons to ARIA option divs**

The current JSX renders results as `<button className="selectable-item">`. Replace the results section with:

```tsx
{!isSelected && query.trim().length > 0 && (
  <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {isSearching && results.length === 0 ? (
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Searching...</p>
    ) : results.length === 0 ? (
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
        No campgrounds found matching &ldquo;{query}&rdquo;.
      </p>
    ) : (
      <div role="listbox" id="step-search-listbox">
        {results.slice(0, 10).map((cg, index) => (
          <div
            key={`${cg.platform}:${cg.id}`}
            ref={(el) => { itemsRef.current[index] = el as HTMLElement | null }}
            id={`step-search-result-${index}`}
            role="option"
            aria-selected={index === highlightedIndex}
            tabIndex={-1}
            className="selectable-item"
            data-highlighted={index === highlightedIndex ? 'true' : undefined}
            onClick={() => handleSelect(cg)}
          >
            <strong>{cg.name}</strong>
            <span className="selectable-item-label">
              {getPlatformLabel(cg.platform)}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

Note: the `div role="option"` is inside `div role="listbox"`, satisfying the ARIA ownership requirement. `tabIndex={-1}` keeps items reachable by the AT via `aria-activedescendant` without entering the tab order.

- [ ] **Step 7: Verify manually**

Open `/watch/new`, type in the campground search, and confirm:
- Arrow down/up highlights items
- Enter selects the highlighted item and advances the wizard
- Escape clears the results list
- Without a highlight, Enter does nothing (no stray submit)

- [ ] **Step 8: Run full test suite**

```bash
cd alphacamper-site && npm test
```

Expected: all tests pass (the search-nav tests from Task 1 plus all existing tests).

- [ ] **Step 9: Commit**

```bash
cd alphacamper-site && git add components/watch/StepSearch.tsx
git commit -m "feat: add keyboard navigation to StepSearch combobox"
```
