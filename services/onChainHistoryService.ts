import { OnChainHistoryData } from "../types";
import {
  Alchemy,
  Network,
  AssetTransfersCategory,
  Utils,
  SortingOrder,
  AssetTransfersWithMetadataResponse,
  AssetTransfersResponse,
  AssetTransfersWithMetadataResult,
  AssetTransfersResult,
} from "alchemy-sdk";
import { isAddress } from "viem";

// IMPORTANT: To use this service, you MUST set the ALCHEMY_API_KEY environment variable.
// In a local development environment, you can use a .env file (e.g., with Vite or Create React App)
// or set it directly in your shell. For this codegen environment, it's assumed to be available.
// For client-side applications, be aware that exposing API keys directly is a security risk.
// In production, consider using a backend proxy to protect your Alchemy API key.
const ALCHEMY_API_KEY =
  process.env.ALCHEMY_API_KEY || "wOfztwyjs9yCVkn-o9877DpNDo85pmoo";

const getAlchemyNetwork = (chainId?: number): Network | undefined => {
  switch (chainId) {
    case 1:
      return Network.ETH_MAINNET;
    case 5:
      return Network.ETH_GOERLI; // Common testnet
    case 11155111:
      return Network.ETH_SEPOLIA; // Common testnet
    case 137:
      return Network.MATIC_MAINNET; // Polygon
    case 80001:
      return Network.MATIC_MUMBAI; // Polygon Mumbai testnet
    case 10:
      return Network.OPT_MAINNET; // Optimism
    case 420:
      return Network.OPT_GOERLI; // Optimism Goerli
    case 42161:
      return Network.ARB_MAINNET; // Arbitrum One
    case 421613:
      return Network.ARB_GOERLI; // Arbitrum Goerli
    case 7777777:
      return Network.ZORA_MAINNET; // Zora Mainnet
    case 84532:
      return Network.BASE_SEPOLIA;
    case 8453:
      return Network.BASE_MAINNET;
    // Add more as needed, ensure these align with chains in App.tsx and Alchemy's supported networks
    default:
      console.warn(
        `Unsupported chainId for Alchemy: ${chainId}. Falling back to Ethereum Mainnet.`
      );
      return Network.ETH_MAINNET; // Default or could return undefined to show an error
  }
};

const getChainName = (chainId?: number): string => {
  switch (chainId) {
    case 1:
      return "Ethereum Mainnet";
    case 5:
      return "Goerli Testnet";
    case 11155111:
      return "Sepolia Testnet";
    case 137:
      return "Polygon Mainnet";
    case 80001:
      return "Polygon Mumbai";
    case 10:
      return "Optimism";
    case 420:
      return "Optimism Goerli";
    case 42161:
      return "Arbitrum One";
    case 421613:
      return "Arbitrum Goerli";
    case 7777777:
      return "Zora Mainnet";
    default:
      return "Unknown Chain";
  }
};

export const fetchOnChainHistory = async (
  address: string,
  chainId?: number
): Promise<OnChainHistoryData> => {
  if (!ALCHEMY_API_KEY) {
    console.error(
      "ALCHEMY_API_KEY is not configured. On-chain history will not be fetched."
    );
    return {
      error: "Alchemy API key not configured by the application developer.",
    };
  }

  const alchemyNetwork = getAlchemyNetwork(chainId);
  if (!alchemyNetwork) {
    return {
      error: `Unsupported network for on-chain history (Chain ID: ${chainId}).`,
    };
  }

  const activeChainName = getChainName(chainId);

  const settings = {
    apiKey: ALCHEMY_API_KEY,
    network: alchemyNetwork,
  };
  const alchemy = new Alchemy(settings);

  try {
    let firstTxDate: string | undefined = undefined;

    const assetTransferCategories = [
      AssetTransfersCategory.EXTERNAL,
      AssetTransfersCategory.INTERNAL,
      AssetTransfersCategory.ERC20,
      AssetTransfersCategory.ERC721,
      AssetTransfersCategory.ERC1155,
      AssetTransfersCategory.SPECIALNFT,
    ];

    const [sentHistoryResponse, receivedHistoryResponse]: [
      AssetTransfersWithMetadataResponse,
      AssetTransfersWithMetadataResponse
    ] = await Promise.all([
      alchemy.core.getAssetTransfers({
        fromAddress: address,
        category: assetTransferCategories,
        order: SortingOrder.ASCENDING,
        maxCount: 1,
        withMetadata: true,
      }),
      alchemy.core.getAssetTransfers({
        toAddress: address,
        category: assetTransferCategories,
        order: SortingOrder.ASCENDING,
        maxCount: 1,
        withMetadata: true,
      }),
    ]);

    const firstSentTx: AssetTransfersWithMetadataResult | undefined =
      sentHistoryResponse.transfers[0];
    const firstReceivedTx: AssetTransfersWithMetadataResult | undefined =
      receivedHistoryResponse.transfers[0];

    let firstTxTimestamp: number | undefined;

    const sentTxBlockTimestamp = firstSentTx?.metadata?.blockTimestamp;
    const receivedTxBlockTimestamp = firstReceivedTx?.metadata?.blockTimestamp;

    if (sentTxBlockTimestamp && receivedTxBlockTimestamp) {
      firstTxTimestamp = Math.min(
        new Date(sentTxBlockTimestamp).getTime(),
        new Date(receivedTxBlockTimestamp).getTime()
      );
    } else if (sentTxBlockTimestamp) {
      firstTxTimestamp = new Date(sentTxBlockTimestamp).getTime();
    } else if (receivedTxBlockTimestamp) {
      firstTxTimestamp = new Date(receivedTxBlockTimestamp).getTime();
    }

    if (firstTxTimestamp) {
      firstTxDate = new Date(firstTxTimestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // Get total transactions sent (nonce)
    const nonce = await alchemy.core.getTransactionCount(address, "latest");
    const totalTransactionsSent = nonce;

    // Get recent contract interactions (contracts the user sent assets to)
    const recentSentTxsResponse: AssetTransfersResponse =
      await alchemy.core.getAssetTransfers({
        fromAddress: address,
        category: assetTransferCategories,
        order: SortingOrder.DESCENDING,
        maxCount: 30,
        withMetadata: false,
        excludeZeroValue: true,
      });

    const interactedContractAddresses = new Set<string>();
    if (recentSentTxsResponse.transfers) {
      for (const tx of recentSentTxsResponse.transfers as AssetTransfersResult[]) {
        if (tx.to && isAddress(tx.to)) {
          if (!interactedContractAddresses.has(tx.to)) {
            const isContract = await alchemy.core.isContractAddress(tx.to);
            if (isContract) {
              interactedContractAddresses.add(tx.to);
              if (interactedContractAddresses.size >= 5) break;
            }
          }
        }
      }
    }

    return {
      firstTxDate,
      totalTransactionsSent, // This matches OnChainHistoryData in types.ts
      contractInteractions: Array.from(interactedContractAddresses),
      activeChains: activeChainName, // This matches OnChainHistoryData in types.ts
    };
  } catch (e: any) {
    console.error("Error fetching on-chain history from Alchemy:", e);
    const message =
      e?.error?.message ||
      e?.message ||
      "An unknown error occurred with Alchemy API.";
    return { error: `Failed to fetch on-chain activity: ${message}` };
  }
};
