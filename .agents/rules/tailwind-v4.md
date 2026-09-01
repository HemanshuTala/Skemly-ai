# Tailwind v4 — No Numeric Primary Color Scale

## Context
This project (Skemly) uses **Tailwind CSS v4** with a custom `@theme` block in `apps/frontend/src/index.css`.

## Rule
The `@theme` defines ONLY flat tokens:
- `primary` → `#ffffff` (pure white)
- `primary-foreground` → `#18181b` (near-black)

There is **NO numeric color scale** like `primary-50`, `primary-100`, ..., `primary-900`.

## ❌ Never use these classes (Tailwind v3 patterns — they are INVISIBLE/transparent here)
```
bg-primary-500    bg-primary-600    bg-primary-700
text-primary-400  text-primary-600
ring-primary-500  border-primary-500
hover:bg-primary-700
group-hover:text-primary-600
```

## ✅ Always use instead
| v3 (broken)             | v4 correct                      |
|-------------------------|---------------------------------|
| `bg-primary-600`        | `bg-primary` or `bg-white`      |
| `text-primary-600`      | `text-primary` or `text-white`  |
| `hover:bg-primary-700`  | `hover:bg-primary/90`           |
| `ring-primary-500`      | `ring-primary`                  |
| `border-primary-500`    | `border-primary` or `border-white` |
| `text-primary-foreground` | `text-primary-foreground` ✅ (this one IS defined) |

## Theme Design Tokens (key ones)
```css
--color-primary:            #ffffff;   /* pure white */
--color-primary-foreground: #18181b;   /* near-black */
--color-canvas:             #09090b;   /* page bg */
--color-background:         #18181b;   /* app shell */
--color-surface:            #27272a;   /* cards */
--color-raised:             #3f3f46;   /* elevated */
```

## Card style pattern for this project
```tsx
// Premium dark card with glassmorphism border
className="rounded-xl border border-white/[0.06] bg-[#0e0e11] hover:border-white/20 hover:shadow-2xl hover:shadow-black/60 transition-all duration-300"
```
