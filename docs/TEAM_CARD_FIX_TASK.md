# TEAM_CARD_FIX_TASK.md

## ⚙️ Environment Setup (to avoid agent hangs in VS Code on macOS)
Before starting, please ensure:
1. **Always use `zsh`** in the integrated terminal.
2. Disable Git pager so commands don’t hang:
   ```bash
   git config --global pager.branch false
   git config --global pager.log false
   git config --global pager.diff false
   ```
3. If any command produces `(END)` and stalls, use:
   ```bash
   git --no-pager <command>
   ```
4. Work on the correct branch (create a feature branch if needed, e.g. `chore/team-card-fix`).

---

## 📝 Task: Fix and Improve Team Flip Cards

We have a **team directory** implemented using flip cards (`front = picture + name + role + location`, `back = bio + contact links`).  
There are a few issues and improvements needed:

### 1. **Flip Bug**
- Currently, cards sometimes open **directly on the back side** instead of the front.  
- Fix so that **default state is front**.  
- Ensure proper flip animation only happens on **hover or click**.

### 2. **Icons Instead of Buttons**
- Replace the large **LinkedIn** and **Email** buttons with **small round icons**:
  - LinkedIn icon → clickable link to profile.
  - Email icon → reveals email via obfuscation (use existing `emailUser` + `emailDomain` fields).
- Place icons neatly aligned **at the bottom of the back card**, side by side.

### 3. **Auto-Unflip Behavior**
- Add logic so that if focus leaves the card (e.g., user clicks outside, presses Escape, or taps elsewhere), the card **auto-unflips** back to the front.
- Keep hover-to-flip **OR** click-to-flip toggle as current behavior (whichever is already implemented).

### 4. **Bio Formatting**
- Use the new bios from `src/data/team.ts` (shortened, consistent).
- Ensure bios **wrap cleanly** and **scroll minimally** if long (avoid cutting text abruptly).

### 5. **Accessibility**
- Ensure all icons have `aria-label` (e.g., \"LinkedIn profile\", \"Reveal email\").
- Keyboard navigation: tabbing into icons should work, and pressing Escape should unflip.

---

## ✅ Acceptance Criteria
- Cards open on **front by default**.  
- Hover/click flips correctly, Escape or blur unflips.  
- LinkedIn + Email displayed as **icons, not buttons**.  
- Bio text is readable, consistent, and scrolls gracefully if needed.  
- Works across Regional Managers and HQ teams, using data from `src/data/team.ts`.  

---

## 🔧 Files to Update
- `src/components/team/TeamCard.tsx` (or equivalent card component)  
- `src/styles/team.css` or Tailwind classes for flip + layout  
- Ensure no breaking changes in `src/data/team.ts`

---

## 🛠 Follow-up
Once done, run:
```bash
npm run lint -- --fix
npm run build
```
to confirm there are no lint or build issues.
