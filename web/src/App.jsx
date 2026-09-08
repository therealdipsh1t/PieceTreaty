import { useState } from "react";
import { useAccount } from "wagmi";
import Header from "./components/Header";
import SeriesCard from "./components/SeriesCard";
import Gallery from "./components/Gallery";
import AdminPanel from "./components/AdminPanel";
import { useSeriesList } from "./hooks/useSeries";
import { getNftAddress, getDeployedChainId } from "./lib/nft";

export default function App() {
  const { isConnected } = useAccount();
  const { series, seriesCount, isLoading, refetch, address } = useSeriesList();
  const [refreshKey, setRefreshKey] = useState(0);
  const deployed = Boolean(getNftAddress());
  const chainId = getDeployedChainId();

  async function refreshAll() {
    await refetch();
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden />
      <div className="bg-glow" aria-hidden />
      <Header />

      <main className="main">
        <section className="hero">
          <p className="eyebrow">On Monad · multi-series ERC-721</p>
          <h1>
            Legally Mime
            <span className="hero-accent"> NFT Desk</span>
          </h1>
          <p className="lede">
            One collection, many series. Mint live drops, open new series later, and keep your
            gallery in one place — all on Monad.
          </p>
          <div className="hero-meta">
            <span className="chip">Chain ID {chainId}</span>
            <span className="chip">{seriesCount} series</span>
            <span className={`chip ${deployed ? "chip-ok" : "chip-warn"}`}>
              {deployed ? `Contract ${short(address)}` : "Contract not configured"}
            </span>
          </div>
        </section>

        {!deployed && (
          <div className="banner warn">
            <strong>No contract address yet.</strong> Deploy with{" "}
            <code>npm run deploy:testnet --prefix contracts</code>, then set{" "}
            <code>VITE_NFT_ADDRESS</code> in <code>web/.env</code> (or re-run deploy to auto-sync
            the ABI file).
          </div>
        )}

        <section className="panel">
          <div className="panel-head">
            <h2>Series</h2>
            <button type="button" className="btn ghost sm" onClick={refreshAll} disabled={isLoading}>
              Refresh
            </button>
          </div>

          {isLoading && <p className="muted">Loading series…</p>}
          {!isLoading && deployed && series.length === 0 && (
            <p className="muted">
              No series yet. {isConnected ? "Owner can create one below." : "Connect as owner to create the first series."}
            </p>
          )}

          <div className="series-grid">
            {series.map((s) => (
              <SeriesCard key={s.id} series={s} onMinted={refreshAll} />
            ))}
          </div>
        </section>

        <AdminPanel onChanged={refreshAll} />
        <Gallery refreshKey={refreshKey} />
      </main>

      <footer className="footer">
        <span>Legally Mime · Monad</span>
        <span className="muted">Paid mint in MON · series-ready</span>
      </footer>
    </div>
  );
}

function short(addr) {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
