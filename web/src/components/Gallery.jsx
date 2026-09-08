import { useAccount } from "wagmi";
import { useOwnedNfts } from "../hooks/useOwnedNfts";
import { getDeployedChainId } from "../lib/nft";
import { monadTestnet, monadMainnet } from "../lib/chains";

function explorerTokenUrl(tokenId) {
  const chainId = getDeployedChainId();
  const chain = chainId === 143 ? monadMainnet : monadTestnet;
  // Generic explorer address page — token pages vary by explorer
  return `${chain.blockExplorers.default.url}`;
}

export default function Gallery({ refreshKey }) {
  const { address, isConnected } = useAccount();
  const { balance, tokens } = useOwnedNfts(address);

  // refreshKey forces parent remount / re-query via wagmi cache invalidation from parent refetch
  void refreshKey;

  if (!isConnected) {
    return (
      <section className="panel">
        <h2>Your collection</h2>
        <p className="muted">Connect a wallet to see Legally Mime NFTs you own.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Your collection</h2>
        <span className="muted">{balance} owned</span>
      </div>

      {tokens.length === 0 ? (
        <p className="muted">No mints yet in this wallet. Grab a series above.</p>
      ) : (
        <div className="gallery-grid">
          {tokens.map((t) => (
            <div key={t.tokenId} className="nft-tile">
              <div className="nft-art">
                <span className="nft-hash">#{t.tokenId}</span>
                <div className="mime-face" aria-hidden>
                  <div className="mime-eyes">
                    <i />
                    <i />
                  </div>
                  <div className="mime-mouth" />
                </div>
              </div>
              <div className="nft-meta">
                <div className="nft-title">Legally Mime #{t.tokenId}</div>
                <div className="muted">Series {t.seriesId ?? "—"}</div>
                {t.tokenURI && (
                  <a className="link" href={t.tokenURI} target="_blank" rel="noreferrer">
                    Metadata
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="muted tiny" style={{ marginTop: "1rem" }}>
        Explorer:{" "}
        <a className="link" href={explorerTokenUrl()} target="_blank" rel="noreferrer">
          open block explorer
        </a>
      </p>
    </section>
  );
}
