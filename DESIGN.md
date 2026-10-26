# QuoteGate design system · 26 October 2026

## Product direction: Estimate desk

A studio workspace for scope and preliminary prices. The left document index and right estimate sheet make the saved amount and the scope readable together. The existing SabaqLoop paper/serif direction is not reused.

Graphite header, cool grey desk, white estimate document and restrained blue task controls. Helvetica/platform sans, tabular money, 6px controls and 3px document edges.

Semantic palette: `#25272b` text · `#5e6268` supporting text · `#ebedef` ground · `#ffffff` document · `#3e4a9e` action.

This increment supersedes the earlier inherited blue-table surface specification. It uses the approved quality direction as a craft bar; composition, navigation and typography are specific to this product. No remote font, icon library, imagery, ornamental SVG, chart or paid dependency was added.

## Implemented composition and domain truth

- Desktop navigation becomes a 208px rail. Services and quotes use a document index beside the selected document, rather than a schema table.
- The tariff document exposes scope/exclusions, unit price, fixed part and the allowed quantity interval. Published, unarchived tariffs expose the real public route.
- A quote displays the saved snapshot name/scope/unit price/fixed part, quantity, contact, created time and stored total in minor units. No current tariff is substituted for the quote snapshot.
- The service editor has a live preview using native form controls. The quote editor explains immutable fields and shows the original saved estimate beside the status control.
- Public quantity entry still calls the existing public endpoint. The receipt amount comes from the server. A manual `reviewed` mark does not assert agreement, signature or payment.

## Controls, states and responsive contract

`public/product-view.js` owns product presentation. `public/app.js` continues to own authenticated loading, CSRF/revision-checked commands, native validation, immutable-field preservation, archive, public endpoints, staff access and backup/audit settings. All record content is inserted as text. External source links accept only HTTP(S).

Search covers stored content and resolved field labels. The archive toggle and explicit reset preserve access to history. Primary creation controls respect the configured collection role/create restriction. Empty and no-result states give a concrete recovery action. Server errors remain in a live notice that receives focus; pending controls are disabled with `aria-busy`.

Controls and public actions have a 44px minimum target. Native fields retain visible labels; checkbox labels include the target. Headings use size-dependent tracking; body copy retains relaxed leading. Focus outlines are explicit. Record-selection controls preserve keyboard focus, and editor/navigation transitions focus the new heading. Responsive rules adapt the layout for 390px/768px/1440px without removing the primary action. Motion is limited to immediate press feedback with a reduced-motion fallback. This is a light design; no dark-mode acceptance is claimed.

## Verification boundary

Node 24.19.0 syntax checks passed for both changed JavaScript files. Existing domain/server tests plus any added presentation-logic regression passed: **11/11**. These checks do not establish visual or browser acceptance. Actual screenshots, keyboard/touch behavior, focus, console and responsive overflow require the parent browser QA pass recorded in [PRE_RELEASE.md](PRE_RELEASE.md). Earlier screenshots describe the previous surface.

## Desktop craft pass · captured evidence

The actual 1440×1000 desktop capture exposed an oversized vertical scaffold before the first working record. This pass puts the title and primary actions in one row, uses one concise supporting sentence, and combines the visible search label, search field, archive toggle and live record count in a single control rail. The product context remains an accessible section label, without repeating the brand above every title. At small widths, title/actions and labelled search controls wrap deliberately. Control hit areas remain at least 44px.

The document index and estimate sheet use tighter padding and price rows while retaining a distinct document reading surface. The studio navigation stays in its side rail on desktop.

The source applies optical heading tracking, antialiasing and tabular count/money figures. No decorative motion or new assets were added. The original screenshots were inspected; refreshed screenshots and responsive measurements belong to parent browser QA and are not yet claimed for this pass.
