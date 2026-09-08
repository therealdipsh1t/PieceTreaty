import { useEffect, useState } from "react";
import { formatEther } from "viem";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useSwitchChain,
} from "wagmi";
import { nftAbi, getNftAddress, getDeployedChainId } from "../lib/nft";

export default function SeriesCard({ series, onMinted }) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const contract = getNftAddress();
  const targetChain = getDeployedChainId();
  const [qty, setQty] = useState(1);

  const { data: walletMinted } = useReadContract({
    address: contract || undefined,
    abi: nftAbi,
    functionName: "mintedPerWallet",
    args: address ? [BigInt(series.id), address] : undefined,
    query: { enabled: Boolean(contract && address) },
  });

  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const price = series.mintPrice;
  const total = price * BigInt(qty);
  const remaining = Number(series.maxSupply - series.minted);
  const maxPerWallet = Number(series.maxPerWallet);
  const already = Number(walletMinted || 0n);
  const walletLeft = maxPerWallet > 0 ? Math.max(0, maxPerWallet - already) : remaining;
  const maxQty = Math.max(1, Math.min(10, remaining, walletLeft || 1));
  const soldOut = remaining <= 0;
  const wrongChain = isConnected && chainId !== targetChain;

  const progress = series.maxSupply > 0n
    ? Number((series.minted * 10000n) / series.maxSupply) / 100
    : 0;

  useEffect(() => {
    if (isSuccess && onMinted) onMinted();
    // only when a mint confirms
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  async function handleMint() {
    reset();
    if (wrongChain) {
      switchChain?.({ chainId: targetChain });
      return;
    }
    writeContract({
      address: contract,
      abi: nftAbi,
      functionName: "mint",
      args: [BigInt(series.id), BigInt(qty)],
      value: total,
      chainId: targetChain,
    });
  }

  return (
    <article className={`series-card ${series.active ? "" : "is-inactive"}`}>
      <div className="series-top">
        <div>
          <div className="series-id">Series {series.id}</div>
          <h3 className="series-name">{series.name}</h3>
        </div>
        <span className={`pill ${series.active ? "pill-live" : "pill-off"}`}>
          {soldOut ? "Sold out" : series.active ? "Live" : "Paused"}
        </span>
      </div>

      <div className="series-stats">
        <div>
          <div className="stat-label">Price</div>
          <div className="stat-value">{formatEther(price)} MON</div>
        </div>
        <div>
          <div className="stat-label">Minted</div>
          <div className="stat-value">
            {series.minted.toString()} / {series.maxSupply.toString()}
          </div>
        </div>
        <div>
          <div className="stat-label">Per wallet</div>
          <div className="stat-value">
            {maxPerWallet > 0 ? `${already}/${maxPerWallet}` : "∞"}
          </div>
        </div>
      </div>

      <div className="progress-track" aria-hidden>
        <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
      <div className="progress-label">{progress.toFixed(1)}% minted</div>

      <div className="mint-row">
        <div className="qty">
          <button
            type="button"
            className="btn ghost"
            disabled={qty <= 1 || isPending || confirming}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="qty-num">{qty}</span>
          <button
            type="button"
            className="btn ghost"
            disabled={qty >= maxQty || isPending || confirming}
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="btn primary mint-btn"
          disabled={
            !isConnected ||
            !contract ||
            !series.active ||
            soldOut ||
            isPending ||
            confirming ||
            walletLeft === 0
          }
          onClick={handleMint}
        >
          {!isConnected
            ? "Connect wallet"
            : wrongChain
              ? "Switch network"
              : !contract
                ? "Not deployed"
                : soldOut
                  ? "Sold out"
                  : isPending || confirming
                    ? "Confirming…"
                    : `Mint · ${formatEther(total)} MON`}
        </button>
      </div>

      {error && (
        <p className="error-msg">
          {error.shortMessage || error.message || "Transaction failed"}
        </p>
      )}
      {isSuccess && txHash && (
        <p className="ok-msg">Mint confirmed · {txHash.slice(0, 10)}…</p>
      )}
    </article>
  );
}
