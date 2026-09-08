import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { nftAbi, getNftAddress } from "../lib/nft";

export function useOwnedNfts(owner) {
  const address = getNftAddress();
  const enabled = Boolean(address && owner);

  const { data: balance, refetch: refetchBal } = useReadContract({
    address: address || undefined,
    abi: nftAbi,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    query: { enabled },
  });

  const indices = useMemo(() => {
    const n = Number(balance || 0n);
    return Array.from({ length: Math.min(n, 48) }, (_, i) => BigInt(i));
  }, [balance]);

  const { data: tokenIdsRaw, refetch: refetchIds } = useReadContracts({
    contracts: indices.map((index) => ({
      address,
      abi: nftAbi,
      functionName: "tokenOfOwnerByIndex",
      args: [owner, index],
    })),
    query: { enabled: enabled && indices.length > 0 },
  });

  const tokenIds = useMemo(() => {
    if (!tokenIdsRaw) return [];
    return tokenIdsRaw
      .filter((r) => r.status === "success")
      .map((r) => r.result);
  }, [tokenIdsRaw]);

  const { data: metaRaw, refetch: refetchMeta } = useReadContracts({
    contracts: tokenIds.flatMap((tokenId) => [
      {
        address,
        abi: nftAbi,
        functionName: "tokenSeries",
        args: [tokenId],
      },
      {
        address,
        abi: nftAbi,
        functionName: "tokenURI",
        args: [tokenId],
      },
    ]),
    query: { enabled: enabled && tokenIds.length > 0 },
  });

  const tokens = useMemo(() => {
    return tokenIds.map((tokenId, i) => {
      const seriesR = metaRaw?.[i * 2];
      const uriR = metaRaw?.[i * 2 + 1];
      return {
        tokenId: Number(tokenId),
        seriesId: seriesR?.status === "success" ? Number(seriesR.result) : null,
        tokenURI: uriR?.status === "success" ? uriR.result : "",
      };
    });
  }, [tokenIds, metaRaw]);

  return {
    balance: Number(balance || 0n),
    tokens,
    refetch: async () => {
      await refetchBal();
      await refetchIds();
      await refetchMeta();
    },
  };
}
