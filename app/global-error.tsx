"use client";
/** Standalone root recovery remains readable if layout styles/fonts fail. Never render the exception. */
export default function GlobalError({ reset }: { reset: () => void }) {
  return <html lang="en"><body style={{margin:0,background:"#faf8f3",color:"#172f3b",fontFamily:"system-ui,sans-serif"}}>
    <style>{`.l2e-fatal{max-width:42rem;margin:auto;padding:3rem 1rem;line-height:1.6}.l2e-fatal h1{line-height:1.2}.l2e-fatal button,.l2e-fatal a{min-height:44px;display:inline-flex;align-items:center;padding:.75rem 1rem;border:1px solid #075c73;border-radius:12px;font:inherit;margin:.5rem .5rem .5rem 0}.l2e-fatal button{background:#075c73;color:#fff}.l2e-fatal a{color:#075c73;background:#fff}.l2e-fatal :focus-visible{outline:3px solid #076abc;outline-offset:3px}`}</style>
    <main className="l2e-fatal"><h1>Learn2Earn could not open</h1><p>Try loading again when your connection and the service are available. No new save, reward or payment is confirmed by this message.</p><button type="button" onClick={reset}>Try loading again</button><a href="/lifeline">Human-help resources</a></main>
  </body></html>;
}
