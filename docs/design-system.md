# Form field style

Use the contact form's corner-only field treatment as the reference for future form fields. The implementation lives in [`src/pages/Contact.css`](../src/pages/Contact.css); reuse its values and behavior when introducing the style elsewhere. This document does not mean existing pages have been migrated.

![Grey resting corners on a filled name field and purple corners on the focused email field](design-assets/contact-fields-grey-purple.png)

The example uses synthetic text and shows the name field filled but unfocused, with focus on email.

- **One boundary:** Draw four short corner brackets around each field. Do not add a complete field outline or a second border behind them. Keep the subtle field fill (`rgba(255, 255, 255, 0.025)`).
- **Resting, empty or filled:** Use `#6b7280` grey corners at `16px` length and `1px` width. Entered content remains white; a filled select changes from its placeholder grey to white. Filling a field alone does not turn the corners purple.
- **Focused:** Use `#a78bfa` purple corners at `18px` length and `2px` width, with the existing `rgba(167, 139, 250, 0.07)` field fill. Return to grey corners when focus leaves, even if the field contains a value.
- **Label:** Place one readable, uppercase label just above the field edge (`12px/16px`, `#b6b9c3` at rest, `#c4b5fd` on focus). Use the field's actual name, such as “Full Name,” and connect it to the control with `htmlFor`/`id`. Keep the required asterisk distinct. Do not add a separate “FIELD” chip.
- **Interaction and sizing:** Use `:focus-within` so mouse and keyboard focus receive the same visible state. Keep controls at least `54px` tall, with a text area sized for longer input. At widths up to `420px`, inset the label to avoid the brackets. Preserve the existing forced-colors outline and reduced-motion behavior.

Apply these rules to new form controls when appropriate, and check the empty, filled, focused, keyboard, and narrow-screen states before reusing the pattern across the site.
