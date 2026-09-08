import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { nftAbi, getNftAddress } from "../lib/nft";

export function useSeriesList() {
  const address = getNftAddress();
  const enabled = Boolean(address);

  const { data: count, refetch: refetchCount, isLoading: loadingCount } = useReadContract({
    address: address || undefined,
    abi: nftAbi,
    functionName: "seriesCount",
    query: { enabled },
  });

  const seriesIds = useMemo(() => {
    const n = Number(count || 0n);
    return Array.from({ length: n }, (_, i) => BigInt(i + 1));
  }, [count]);

  const { data: seriesRaw, refetch: refetchSeries, isLoading: loadingSeries } = useReadContracts({
    contracts: seriesIds.map((id) => ({
      address,
      abi: nftAbi,
      functionName: "getSeries",
      args: [id],
    })),
    query: { enabled: enabled && seriesIds.length > 0 },
  });

  const series = useMemo(() => {
    if (!seriesRaw) return [];
    return seriesIds
      .map((id, i) => {
        const r = seriesRaw[i];
        if (!r || r.status !== "success" || !r.result) return null;
        const [name, baseURI, maxSupply, minted, mintPrice, maxPerWallet, active, exists] = r.result;
        return {
          id: Number(id),
          name,
          baseURI,
          maxSupply: maxSupply,
          minted: minted,
          mintPrice: mintPrice,
          maxPerWallet: maxPerWallet,
          active,
          exists,
        };
      })
      .filter(Boolean);
  }, [seriesIds, seriesRaw]);

  return {
    address,
    series,
    seriesCount: Number(count || 0n),
    isLoading: loadingCount || loadingSeries,
    refetch: async () => {
      await refetchCount();
      await refetchSeries();
    },
  };
}
