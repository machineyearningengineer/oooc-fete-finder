# Earlier mobile navigation

The navigation before the liquid-split experiment is retained at commit `6046056408b8231b7c7ba1f78f5e823a7691bb90` and branch `feature/archive-mobile-nav-before-liquid-split`.

Compare its implementation with the current checkout:

```sh
git diff 6046056408b8231b7c7ba1f78f5e823a7691bb90..HEAD -- components/MobileBottomNav.tsx app/globals.css
```

Use the commit as a design reference. Restoring whole files would also replace later behavior, so port only the parts needed for a revision. The branch keeps the reference without shipping duplicate UI.
