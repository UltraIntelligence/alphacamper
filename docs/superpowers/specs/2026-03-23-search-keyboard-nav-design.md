# Search Keyboard Navigation Design

**Date:** 2026-03-23
**Scope:** `ParkSearch.tsx` (landing hero) and `StepSearch.tsx` (watch wizard step 1)

## Overview

Add keyboard navigation to both search comboboxes so users can use arrow keys to highlight results and Enter to select them, without touching the mouse.

## Components Affected

| File | Role |
|------|------|
| `alphacamper-site/components/landing/ParkSearch.tsx` | Landing hero search with dropdown |
| `alphacamper-site/components/watch/StepSearch.tsx` | Watch wizard step 1 inline results |

## State

Add `highlightedIndex: number` (default `-1`) to each component. `-1` means no item is highlighted.

Reset `highlightedIndex` to `-1` whenever:
- `results` changes (new search completes)
- `query` changes (user types)
- In `ParkSearch`: `isOpen` becomes false
- In `StepSearch`: `isSelected` becomes true (item selected, results disappear)

## Key Handling

Replace the existing `onKeyDown` handler on each search `<input>` entirely (not layered on top):

| Key | Action |
|-----|--------|
| `ArrowDown` | Increment index; wrap from last → 0; `preventDefault` to stop page scroll |
| `ArrowUp` | Decrement index; wrap from 0 → last; `preventDefault` to stop page scroll |
| `Enter` | If `index >= 0 && results[index] != null`, call `handleSelect(results[index])` and stop; otherwise call existing submit behavior (`handleSubmit` in `ParkSearch`, no-op in `StepSearch`) |
| `Escape` | Reset index to -1; close dropdown / clear results |

**Important:** In `ParkSearch`, the new `onKeyDown` handler must fully replace `onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}`. When Enter fires with a valid highlighted index, `handleSubmit` must not be called at all.

## Markup Changes

### `ParkSearch.tsx`

No structural changes needed. Additions:
- Listbox container `div.park-search-dropdown` gets a stable `id`, e.g. `park-search-listbox`
- Each result item `div.park-search-item` gets `id={`search-result-${index}`}` and `aria-selected={index === highlightedIndex}`

### `StepSearch.tsx`

The existing `<button>` result items cannot receive `role="option"` (interactive elements cannot be repurposed as ARIA options). Instead:
- Wrap results in a `<div role="listbox" id="step-search-listbox">`
- Change each result from `<button>` to `<div role="option" tabIndex={-1}>` with `onClick` and `onKeyDown` preserved via the parent input's keyboard handler
- Each div gets `id={`step-result-${index}`}` and `aria-selected={index === highlightedIndex}`

## ARIA

Both inputs get:
- `role="combobox"`
- `aria-expanded` — `isOpen` for `ParkSearch`; `!isSelected && results.length > 0` for `StepSearch`
- `aria-autocomplete="list"`
- `aria-controls` — `"park-search-listbox"` / `"step-search-listbox"` (matches listbox container id)
- `aria-activedescendant` — `search-result-${highlightedIndex}` when index ≥ 0, omit (or `undefined`) when -1

## Visual Feedback

Add `data-highlighted="true"` attribute to the currently highlighted result item. Style via CSS selector using existing hover styles as a baseline:
- `ParkSearch`: `.park-search-item[data-highlighted="true"]`
- `StepSearch`: uses existing `.selectable-item` hover style

## Scroll Behaviour

Use a `useRef<(HTMLElement | null)[]>([])` items-ref array in each component. Assign refs via the item's `ref` callback. When `highlightedIndex` changes via keyboard (tracked in a `useEffect` dep on `highlightedIndex`), call `itemsRef.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })`.

## Out of Scope

- Touch / mobile swipe navigation
- Type-ahead filtering beyond what already exists
- Shared hook abstraction (both components stay self-contained)
