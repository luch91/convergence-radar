type Signal = { token: string; chainId: number; buyerCount: number; windowStart: string; windowEnd: string; verificationStatus: string };
type ApiResult = { data: Signal[] };

const apiBaseUrl = process.env.API_BASE_URL ?? "https://convergence-radar.onrender.com";

async function getSignals(): Promise<{ signals: Signal[]; state: "ready" | "payment" | "unavailable" }> {
  try {
    const response = await fetch(`${apiBaseUrl}/v1/crossings`, { cache: "no-store" });
    if (response.status === 402 || response.status === 503) return { signals: [], state: "payment" };
    if (!response.ok) return { signals: [], state: "unavailable" };
    return { signals: (await response.json() as ApiResult).data, state: "ready" };
  } catch { return { signals: [], state: "unavailable" }; }
}

function shortAddress(address: string) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }

export default async function HomePage() {
  const { signals, state } = await getSignals();
  return <main className="shell">
    <nav className="nav"><a className="brand" href="#top"><span>CR</span> Convergence Radar</a><div className="nav-links"><a href="#signals">Signals</a><a href="#method">Method</a><a className="status" href={`${apiBaseUrl}/health`}>API online</a></div></nav>
    <section id="top" className="hero"><p className="eyebrow">X LAYER INTELLIGENCE</p><h1>Signals with the complete record.</h1><p className="lede">Track tokens where four or more independent tracked wallets buy within 48 hours. Results include adverse outcomes when data is available.</p><div className="hero-actions"><a className="primary" href="#signals">View active signals</a><a className="secondary" href="#method">Read the method</a></div></section>
    <section className="metrics" aria-label="Product rules"><div><strong>4+</strong><span>unique buyers</span></div><div><strong>48h</strong><span>analysis window</span></div><div><strong>0.5</strong><span>USDT0 per query</span></div><div><strong>196</strong><span>X Layer chain ID</span></div></section>
    <section id="signals" className="section"><div className="section-head"><div><p className="eyebrow">LIVE FEED</p><h2>Active convergences</h2></div><span className={`pill ${state}`}>{state === "ready" ? `${signals.length} available` : state === "payment" ? "payment required" : "API unavailable"}</span></div>
      {state === "ready" && signals.length > 0 ? <div className="grid">{signals.map((signal) => <article className="card" key={signal.token}><div className="card-top"><span className="token">{shortAddress(signal.token)}</span><span className="verify">{signal.verificationStatus}</span></div><strong>{signal.buyerCount} independent buyers</strong><p>Window closed {new Date(signal.windowEnd).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.</p><a href={`${apiBaseUrl}/v1/token?address=${signal.token}`}>Open paid detail</a></article>)}</div> : <div className="empty"><h3>{state === "payment" ? "Unlock the signal feed" : "The signal feed is unavailable"}</h3><p>{state === "payment" ? "This route is protected by an x402 payment challenge. A compatible client pays 0.5 USDT0 on X Layer and then receives the data." : "Check the API health endpoint, then try again."}</p></div>}
    </section>
    <section id="method" className="method"><p className="eyebrow">METHOD</p><h2>Convergence is a rule, not a prediction.</h2><div className="method-grid"><div><b>1</b><h3>Observe</h3><p>Normalize tracked wallet buy activity and retain its source reference.</p></div><div><b>2</b><h3>Count</h3><p>Require at least four distinct buyers in the defined 48-hour window.</p></div><div><b>3</b><h3>Disclose</h3><p>Show the verification state and do not present incomplete history as performance.</p></div></div></section>
    <footer>Convergence Radar · Experimental market-information service · Not investment advice</footer>
  </main>;
}
