import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-mark" aria-hidden>
          <span>LM</span>
        </div>
        <div>
          <div className="brand-title">Legally Mime</div>
          <div className="brand-sub">Multi-series NFT · Monad</div>
        </div>
      </div>
      <ConnectButton showBalance={{ smallScreen: false, largeScreen: true }} chainStatus="icon" />
    </header>
  );
}
