# Freescout-Hotkeys
Plucked at peak intelligence from the vibe code vines, hand-squeezed into your browser, and left to ferment until the hotkeys were just right. May contain traces of artificial intelligence, over-engineered selectors, and comments explaining things that are already obvious from the code.
Add via your favorite JS snippets browser extension.
# FreeScout Hotkeys
A browser extension content script that adds HelpScout-style keyboard shortcuts to FreeScout.
## Hotkeys
> Single-letter hotkeys are disabled while typing in the reply/note editor.
### Compose
| Key | Action |
|-----|--------|
| `R` | Open Reply editor |
| `N` | Open Note editor |
| `Ctrl` + `Enter` | Send reply or note |
| `/` | Open saved replies menu (only when in reply) |
| `/` `/` | Insert a `/` in a reply |

### Saved Replies
While the saved replies menu is open, items with a single letter in brackets in the title can be triggered directly by keyboard. The hotkey is detected from the reply title.

| Example title | Key |
|---------------|-----|
| `[R]efund processed` | `R` |
| `We need Wordpress [l]ogin` | `L` |

> The brackets can appear anywhere in the title around a single letter. Items without a bracketed letter in the title have no hotkey but can be reached with arrows + enter.

### Status
| Keys | Action |
|------|--------|
| `S` → `C` | Close conversation |
| `S` → `P` | Mark as Pending |
| `S` → `A` | Reopen (set Active) |
| `!` | Mark as Spam |
| `S` → `U` | Mark as Not Spam |
### Navigation
| Key | Action |
|-----|--------|
| `J` | Next conversation |
| `K` | Previous conversation |
