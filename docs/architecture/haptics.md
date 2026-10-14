# Haptics

Use [useAppHaptics()](../../hooks/useAppHaptics.ts) for mobile feedback. It wraps `web-haptics` and respects the `enableHaptics` setting, which defaults to true. App Settings → Mobile feedback contains the toggle and test control.

The setting persists locally and can sync to a live user account. The hook does not gate on `navigator.vibrate`: the library also has a touch fallback.

## Choose a pattern

| Pattern | Use |
| --- | --- |
| `selection` | Select a filter, open a regular event, change a sort or setting |
| `light` | Close a panel, dismiss a prompt, or unsave an event |
| `nudge` | Open a drawer, expand a map, or advance a guided tour |
| `success` | Save, share, copy, add to calendar, or complete a form |
| `warning` | Clear filters, reset settings, or sign out |
| `error` | Failed copy, submission, or validation |

Choose the weakest pattern that communicates the action. The unused `buzz` pattern is reserved for a critical failure.

## Where feedback belongs

Settings, navigation, event cards and details, filters, map controls, and tours call the shared hook. Keep feedback attached to a deliberate action. Typing, scrolling, hovering, loading, repeated automatic updates, and every slider movement should stay quiet.

When adding an action, check both its success and reversal. For example, saving uses `success`; undoing that save uses `light`.
