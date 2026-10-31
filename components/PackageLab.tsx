'use client';

import { createElement, useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';

type Notice = {
  when: string;
  event: string;
  value: string;
};

type PdfViewerProps = {
  url: string;
};

type CaptchaProps = {
  codeValue: string;
  setCodeValue: (value: string) => void;
};

function describe(value: unknown): string {
  try {
    return typeof value === 'string'
      ? value
      : (JSON.stringify(value) ?? String(value));
  } catch {
    return String(value);
  }
}

function isComponent(value: unknown): boolean {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' &&
      value !== null &&
      ('$$typeof' in value || 'render' in value))
  );
}

export default function PackageLab() {
  const [tab, setTab] = useState<'pdf' | 'captcha'>('pdf');

  const [viewer, setViewer] = useState<ComponentType<PdfViewerProps> | null>(null);
  const [viewerError, setViewerError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('/sample.pdf');
  const [pdfKey, setPdfKey] = useState(0);
  const [customFile, setCustomFile] = useState('');

  const [captchaComponent, setCaptchaComponent] = useState<ComponentType<CaptchaProps> | null>(null);
  const [captchaError, setCaptchaError] = useState('');
  const [codeValue, setCodeValue] = useState('');
  const [answer, setAnswer] = useState('');
  const [captchaResult, setCaptchaResult] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [events, setEvents] = useState<Notice[]>([]);

  const blobRef = useRef<string | null>(null);
  const viewerHostRef = useRef<HTMLDivElement | null>(null);

  const log = (event: string, value: unknown) => {
    setEvents((previous) => [
      {
        when: new Date().toLocaleTimeString(),
        event,
        value: describe(value),
      },
      ...previous,
    ].slice(0, 30));
  };

  useEffect(() => {
    let disposed = false;

    import('pdfjs-embed-viewer')
      .then((module) => {
        if (disposed) return;

        const candidate = module.default;
        if (isComponent(candidate)) {
          setViewer(() => candidate as ComponentType<PdfViewerProps>);
        } else {
          setViewerError(
            'Package did not expose the documented default PDFEmbedViewer component.',
          );
        }
      })
      .catch((error) => {
        if (!disposed) setViewerError(String(error));
      });

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    import('form_recaptcha')
      .then((module) => {
        if (disposed) return;

        if (isComponent(module.default)) {
          setCaptchaComponent(() => module.default as ComponentType<CaptchaProps>);
        } else {
          setCaptchaError(
            'form_recaptcha did not provide its documented default React component.',
          );
        }
      })
      .catch((error) => {
        if (!disposed) setCaptchaError(String(error));
      });

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  const verifyAnswer = () => {
    const matches = Boolean(codeValue) && answer.trim() === codeValue;
    const message = matches
      ? 'Match: the entered characters match the displayed challenge. (Demo only — not secure server verification.)'
      : 'Not a match. Check the characters and try again.';

    setCaptchaResult(message);
    log('local comparison', matches ? 'match' : 'no match');
  };

  const resetChallenge = () => {
    setCaptchaKey((previous) => previous + 1);
    setAnswer('');
    setCaptchaResult('');
    setCodeValue('');
    log('challenge', 'remounted');
  };


  useEffect(() => {
    if (tab !== 'pdf' || !viewer) return;

    const host = viewerHostRef.current;
    if (!host) return;

    const label = 'Rendered PDF pages';
    let observer: MutationObserver | null = null;

    const makePdfScrollableByKeyboard = () => {
      const container = host.querySelector<HTMLElement>('#pdf-container');
      if (!container) return false;

      // Apply each attribute only when necessary; avoid mutation feedback loops.
      if (container.tabIndex !== 0) container.tabIndex = 0;
      if (container.getAttribute('role') !== 'region') {
        container.setAttribute('role', 'region');
      }
      if (container.getAttribute('aria-label') !== label) {
        container.setAttribute('aria-label', label);
      }

      // Once the PDF scrollport is found, no further observation is needed.
      observer?.disconnect();
      return true;
    };

    if (makePdfScrollableByKeyboard()) return;

    // Observe only newly inserted nodes, not attribute changes.
    observer = new MutationObserver(makePdfScrollableByKeyboard);
    observer.observe(host, { childList: true, subtree: true });

    return () => observer?.disconnect();
  }, [tab, viewer, pdfKey, pdfUrl]);

  const selectLocalPdf = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (blobRef.current) URL.revokeObjectURL(blobRef.current);

    const url = URL.createObjectURL(file);
    blobRef.current = url;
    setCustomFile(file.name);
    setPdfUrl(url);
    setPdfKey((previous) => previous + 1);
  };

  return (
    <main className="shell">
      <header className="hero">
        <p className="kicker">REACT 19 · NEXT.JS APP ROUTER</p>
        <h1>npm Package Integration Lab</h1>
        <p>Test two published packages in a real browser-based Next.js application.</p>
        <div className="chips">
          <span>form_recaptcha</span>
          <span>pdfjs-embed-viewer</span>
        </div>
      </header>

      <nav className="tabs" aria-label="Package demos">
        <button
          type="button"
          aria-pressed={tab === 'pdf'}
          onClick={() => setTab('pdf')}
        >
          PDF viewer
        </button>
        <button
          type="button"
          aria-pressed={tab === 'captcha'}
          onClick={() => setTab('captcha')}
        >
          Canvas CAPTCHA
        </button>
      </nav>

      {tab === 'pdf' && (
        <section className="card" aria-labelledby="pdf-heading">
          <div className="sectionHeader">
            <h2 id="pdf-heading">PDF.js Embed Viewer</h2>
            <a
              href="https://www.npmjs.com/package/pdfjs-embed-viewer"
              target="_blank"
              rel="noreferrer"
            >
              npm package
            </a>
          </div>

          <p className="hint">
            Uses the documented <code>PDFEmbedViewer</code> default export with{' '}
            <code>url</code>. Try the bundled two-page PDF or your own file.
          </p>

          <div className="row">
            <label className="grow">
              PDF URL
              <input
                value={pdfUrl}
                onChange={(event) => setPdfUrl(event.target.value)}
                aria-label="PDF URL"
              />
            </label>
            <button type="button" onClick={() => setPdfKey((previous) => previous + 1)} disabled={!pdfUrl.trim()}>
              Reload PDF
            </button>
            <button
              type="button"
              className="subtle"
              onClick={() => {
                setPdfUrl('/sample.pdf');
                setPdfKey((previous) => previous + 1);
              }}
            >
              Sample PDF
            </button>
          </div>

          <div className="row">
            <label className="upload">
              Choose local PDF
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={selectLocalPdf}
              />
            </label>
            {customFile && <span className="hint">Selected: {customFile}</span>}
            <a href="/sample.pdf" target="_blank" rel="noreferrer">
              Open sample PDF directly
            </a>
          </div>

          <div
            ref={viewerHostRef}
            className="viewer"
            role="region"
            aria-label="Embedded PDF viewer"
            tabIndex={0}
          >
            {viewerError ? (
              <p role="alert">{viewerError}</p>
            ) : viewer ? (
              createElement(viewer, { key: pdfKey, url: pdfUrl })
            ) : (
              <p role="status">Loading PDF package…</p>
            )}
          </div>

          <p className="hint">
            The PDF canvas scrolls independently while its navigation controls remain visible.
            Test page navigation, zoom, download, keyboard controls, large PDFs and
            invalid URLs. If a remote URL fails, check that it allows CORS.
          </p>
        </section>
      )}

      {tab === 'captcha' && (
        <section className="card" aria-labelledby="captcha-heading">
          <div className="sectionHeader">
            <h2 id="captcha-heading">Canvas CAPTCHA</h2>
            <a
              href="https://www.npmjs.com/package/form_recaptcha"
              target="_blank"
              rel="noreferrer"
            >
              npm package
            </a>
          </div>

          <p className="hint">
            This uses the package&apos;s documented default export and controlled props:{' '}
            <code>codeValue</code> and <code>setCodeValue</code>.
          </p>

          {captchaError ? (
            <p role="alert">{captchaError}</p>
          ) : captchaComponent ? (
            <>
              <p className="accessibilityNotice" role="note">
                Accessibility note: the visual CAPTCHA is not a complete accessible
                verification solution. In a production form, provide an equivalent
                non-visual verification method.
              </p>
              <div className="captchaHost" aria-label="Visual CAPTCHA challenge">
                {createElement(captchaComponent, {
                  key: captchaKey,
                  codeValue,
                  setCodeValue,
                })}
              </div>

              <div className="row">
                <label className="grow">
                  Enter the characters shown in the canvas
                  <input
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      setCaptchaResult('');
                    }}
                    autoComplete="off"
                  />
                </label>
                <button type="button" onClick={verifyAnswer} disabled={!answer.trim() || !codeValue}>
                  Compare answer
                </button>
                <button type="button" className="subtle" onClick={resetChallenge}>
                  Reset challenge
                </button>
              </div>

              {captchaResult && <p role="status" aria-live="polite">{captchaResult}</p>}

              <p className="hint">
                Use the package&apos;s “New Captcha” control to refresh the visual challenge.
                This local comparison is only a UI demonstration, not secure verification.
                An equivalent accessible verification alternative and server-side
                protection are required in production.
              </p>

              <div className="row between">
                <h3>Diagnostic event log</h3>
                <button type="button" className="subtle" onClick={() => setEvents([])}>
                  Clear log
                </button>
              </div>

              <div
                className="log"
                role="region"
                aria-label="Diagnostic event log"
                tabIndex={0}
              >
                {events.length ? (
                  events.map((entry, index) => (
                    <div key={index}>
                      <time>{entry.when}</time> <strong>{entry.event}</strong>:{' '}
                      {entry.value}
                    </div>
                  ))
                ) : (
                  <p>No comparisons yet.</p>
                )}
              </div>
            </>
          ) : (
            <p role="status">Loading CAPTCHA package…</p>
          )}
        </section>
      )}

      <footer>
        Local integration demo only · Review README.md before use
      </footer>
    </main>
  );
}
