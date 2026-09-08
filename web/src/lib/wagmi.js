import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { monadTestnet, monadMainnet } from "./chains";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo-legally-mime";

export const config = getDefaultConfig({
  appName: "Legally Mime",
  projectId,
  chains: [monadTestnet, monadMainnet],
  ssr: false,
});
