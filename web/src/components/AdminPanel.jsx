import { useEffect, useState } from "react";
import { parseEther } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { nftAbi, getNftAddress, getDeployedChainId } from "../lib/nft";

export default function AdminPanel({ onChanged }) {
  const { address, isConnected } = useAccount();
  const contract = getNftAddress();
  const chainId = getDeployedChainId();

  const { data: owner } = useReadContract({
    address: contract || undefined,
    abi: nftAbi,
    functionName: "owner",
    query: { enabled: Boolean(contract) },
  });

  const isOwner =
    isConnected && owner && address && owner.toLowerCase() === address.toLowerCase();

  const [form, setForm] = useState({
    name: "",
    baseURI: "https://",
    maxSupply: "100",
    mintPrice: "0.1",
    maxPerWallet: "5",
    active: true,
  });

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!isOwner) return null;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  useEffect(() => {
    if (isSuccess && onChanged) onChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  function create() {
    reset();
    writeContract({
      address: contract,
      abi: nftAbi,
      functionName: "createSeries",
      args: [
        form.name,
        form.baseURI,
        BigInt(form.maxSupply || "0"),
        parseEther(form.mintPrice || "0"),
        BigInt(form.maxPerWallet || "0"),
        form.active,
      ],
      chainId,
    });
  }

  return (
    <section className="panel admin">
      <div className="panel-head">
        <h2>Owner · new series</h2>
        <span className="pill pill-live">Admin</span>
      </div>
      <p className="muted">
        Only the contract owner can open new series. Each series has its own supply, price, and
        metadata base URI.
      </p>

      <div className="admin-grid">
        <label>
          Name
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Series 2 — Legal Briefs" />
        </label>
        <label>
          Base URI
          <input value={form.baseURI} onChange={(e) => set("baseURI", e.target.value)} placeholder="ipfs://CID/" />
        </label>
        <label>
          Max supply
          <input value={form.maxSupply} onChange={(e) => set("maxSupply", e.target.value)} type="number" min="1" />
        </label>
        <label>
          Mint price (MON)
          <input value={form.mintPrice} onChange={(e) => set("mintPrice", e.target.value)} />
        </label>
        <label>
          Max per wallet (0 = ∞)
          <input value={form.maxPerWallet} onChange={(e) => set("maxPerWallet", e.target.value)} type="number" min="0" />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          Active on create
        </label>
      </div>

      <button
        type="button"
        className="btn primary"
        disabled={!form.name || isPending || confirming}
        onClick={create}
      >
        {isPending || confirming ? "Creating…" : "Create series"}
      </button>

      {error && <p className="error-msg">{error.shortMessage || error.message}</p>}
      {isSuccess && <p className="ok-msg">Series created.</p>}
    </section>
  );
}
