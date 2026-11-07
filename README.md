# Next.js Integration Demo — Three npm Packages

This is a **Next.js 16 App Router + React 19 + TypeScript** integration test application for three npm packages:

- [form_recaptcha](https://www.npmjs.com/package/form_recaptcha) — canvas CAPTCHA package
- [pdfjs-embed-viewer](https://www.npmjs.com/package/pdfjs-embed-viewer) — embedded PDF.js viewer
- [pagination-dropdown-select](https://www.npmjs.com/package/pagination-dropdown-select) — accessible pagination and page-size dropdowns

## Requirements

- Node.js 24 recommended (the demo was designed for Node 24 and Next.js 16)
- npm

## Setup (macOS / Windows / Linux)

```bash
unzip npm-package-integration-demo.zip
cd npm-package-integration-demo
npm install
npm run dev
```

Open **http://localhost:3000**.

If your local port is already in use, Next.js will print an alternative URL.

## Demo 1 — PDF Viewer

1. Select **PDF viewer**.
2. View the included two-page `public/sample.pdf`.
3. Check whether pages render, zoom works, and page navigation / download controls work.
4. Use **Choose local PDF** to test your own document (a browser blob URL).
5. Enter a different URL or a deliberately invalid URL to test error handling; click **Reload PDF** to remount the viewer.

Implementation: client-side dynamic import of the documented default `PDFEmbedViewer`, passing the documented `url` property. This prevents browser-only PDF code from being eagerly evaluated during Next.js server rendering.

The installed package version is whichever version npm resolves at install time (`latest`). Use `npm ls pdfjs-embed-viewer` to inspect it. For reproducible integration testing, commit the generated `package-lock.json` or pin an exact tested version.

## Demo 2 — Canvas CAPTCHA

The demo imports `form_recaptcha` using its **documented default export** and supplies the required controlled-component props:

```tsx
const [codeValue, setCodeValue] = useState('');
<Captcha codeValue={codeValue} setCodeValue={setCodeValue} />
```

1. Open **Canvas CAPTCHA**. The visual challenge should render.
2. Enter the characters from the canvas and click **Compare answer**. Try both a matching and nonmatching answer.
3. Click the package's **New Captcha** button to regenerate the code.
4. Click **Reset challenge** to remount the component.
5. Use browser DevTools to inspect runtime errors and keyboard accessibility.

**Security/accessibility:** The comparison is performed locally only as a demonstration. The CAPTCHA code is accessible to page JavaScript, so this must **not** be treated as real bot protection. Real forms need trusted server-side verification and an equivalent accessible alternative to the visual challenge.

### Fix for the earlier demo crash

The first demo incorrectly rendered the package via a generic prop inspector (with a placeholder `length` prop and invented callbacks). The actual package requires `codeValue: string` and `setCodeValue: (value: string) => void`. This corrected demo provides both.

## Demo 3 — Pagination Dropdown Select

Select **Pagination & dropdown** to use the **actual published** `pagination-dropdown-select` package (version `1.0.10`) in a Next.js Client Component. The demo uses 87 sample records and includes a searchable table.

1. Change **Results per page** (5, 10, 20, or 50) and verify the table updates and returns to page 1.
2. Use **First**, **Previous**, **Next**, **Last**, or the **Current page** dropdown.
3. Search for `orders`, `pending`, or `record 025`: the results and count update, and pagination resets to page 1.
4. Search for something nonexistent to check the empty state, then click **Reset example**.
5. Test the controls with the keyboard and a screen reader, including the navigation label and visible focus states.

The integration is in `components/PaginationDemo.tsx` and imports `Pagination` as the package's default export. The package itself is not copied or modified. It receives controlled `currentPage`, `setCurrentPage`, `pageSize`, `setPageSize`, `pageSizeArray`, `totalResultsNumber`, and `ariaLabel` props. Filtering and slicing the client-side sample array are performed by the demo, not the library.

For server-side pagination, fetch records whenever the page or page size changes and pass the server's **total** result count to `totalResultsNumber`.

## Production build test

```bash
npm run lint
npm run build
npm start
```

Visit the local URL printed by Next.js. `npm start` runs the Next.js production server; unlike your static QR site this demo does **not** use `output: 'export'`.

## Troubleshooting

| Issue | Check |
| --- | --- |
| `npm install` fails | Confirm Node 24; inspect peer-dependency errors. Do not blindly use `--force`. |
| CAPTCHA displays nothing | Check the browser console and `npm ls form_recaptcha`; verify the published package matches the documented controlled API. |
| PDF is blank | Check browser console / Network for PDF.js worker errors. Try the bundled sample first. |
| Remote PDF fails | Check browser CORS / authentication settings; use a same-origin file or local upload. |
| Next.js SSR error | Keep browser-specific library imports inside client-side effects/components. Pagination uses a standard Client Component import. |
| Port 3000 in use | Run `npm run dev -- -p 3001`. |

## Manual verification checklist

- [ ] `npm install` succeeds
- [ ] `npm run dev` starts
- [ ] Sample PDF renders correctly
- [ ] Multi-page navigation and zoom work
- [ ] Local PDF upload works
- [ ] Canvas CAPTCHA renders with the controlled `codeValue`/`setCodeValue` props
- [ ] Pagination: page dropdown, first/previous/next/last, and page-size controls work
- [ ] Pagination: search, empty state, reset, and record counts work
- [ ] CAPTCHA renders and regenerates a challenge
- [ ] Demo-only answer comparison and New Captcha refresh work
- [ ] Keyboard, screen reader, and mobile layout checked
- [ ] `npm run build` completes

## Package inspection commands

```bash
npm ls next react form_recaptcha pdfjs-embed-viewer pagination-dropdown-select
cat node_modules/form_recaptcha/package.json
cat node_modules/pdfjs-embed-viewer/package.json
cat node_modules/pagination-dropdown-select/package.json
```

If you maintain both package repositories, you can use this demo to test newly published versions simply by reinstalling and refreshing the lockfile.

## Files

```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  PackageLab.tsx
  PaginationDemo.tsx
public/
  sample.pdf
README.md
package.json
next.config.ts
tsconfig.json
next-env.d.ts
```

No credentials or backend are required.

## Status

The project source and sample PDF are provided; **npm package installation, Next.js compilation, and browser behavior could not be executed in this environment because the npm registry is unreachable**. The package dependency and lockfile entries are recorded for version 1.0.10, but the lockfile entry for this new package has no registry integrity hash. Run `npm install` on a network-connected computer to refresh the lockfile metadata before committing it. Please run the commands above to verify against the actual npm releases.


## Unit tests and accessibility

Install all dependencies, then run:

```bash
npm install
npm test
npm run test:watch
npm run test:a11y
npm run test:coverage
npm run lint
npm run build
```

The unit tests mock the external npm components to isolate the demo's integration behavior. They do **not** prove the published packages themselves work correctly. Run the app in Chrome, test all three real packages manually, and check the browser Console.

The `jest-axe` tests scan the demo wrapper in two states, with mocked package content. This is **not** WCAG conformance certification and does not validate the internals of the actual PDF viewer, CAPTCHA, or pagination component. Use axe DevTools on the real running app and perform keyboard, VoiceOver, focus, zoom, and responsive testing.

### Accessibility enhancements

- Named, keyboard-focusable scrollable PDF-viewer and event-log regions.
- Section headings connected to their respective regions.
- Status and error announcements; visible focus indicators.
- Disabled actions when comparison cannot be made.
- Reduced-motion CSS preference respected.
- An explicit warning that a visual CAPTCHA alone is not an accessible production verification method.

**Security:** The CAPTCHA comparison happens exclusively in the browser and cannot be used as a secure bot-prevention mechanism. A server-side verification solution and an accessible non-visual alternative are required for production.


## PDF scrolling and fixed controls

The PDF viewer demo now keeps the package navigation controls outside the scrollable canvas area.
The demo uses CSS to constrain `.viewer` and make the package's `#pdf-container` element the only vertical scrollport.
This relies on the viewer package rendering `#pdf-container` and navigation buttons as siblings;
if a future release changes that DOM structure, update the selectors in `app/globals.css`.

**Check manually:** Open the PDF Viewer tab, use a tall PDF and scroll inside the PDF.
The Prev / Next / First / Last buttons should remain visible below the canvas.
Also test a narrow viewport, keyboard navigation, and the page selector.


## PDF navigation layout fix

The PDF viewer uses `#pdf-container` for the scrollable PDF page while the
package's `<nav aria-label="PDF page navigation">` remains visible underneath.
The styles match the actual npm component markup, where these are sibling
children of an outer `<section>` (not direct children of the demo wrapper).
Run `npm run dev`, open the PDF tab, and verify that scrolling the canvas keeps
Prev / Next / First / Last on screen. The package source was not changed.
