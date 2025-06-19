export interface ResumeData {
  name: string;
  bio: string;
  skills: string; // Comma-separated or simple text
  projects: string;
  github: string;
  twitter: string;
  linkedin: string;
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Add other types of chunks if necessary, e.g., retrieval
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // Potentially other search-related metadata
}

export enum LoadingState {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR
}

export enum WalletLoadingState {
    IDLE,
    CONNECTING,
    CONNECTED,
    ERROR
    // Old asset-related states removed. If general wallet data fetching states are needed, they can be added here.
}

// New types for On-Chain History
export interface OnChainHistoryData {
  firstTxDate?: string;
  totalTransactionsSent?: number;
  contractInteractions?: string[]; // e.g., ["Uniswap V3", "OpenSea Seaport", "Aave Protocol"]
  activeChains?: string[activeChainName]; // e.g., ["Ethereum Mainnet", "Polygon PoS"]
  error?: string; // For API-specific errors, if any, to be displayed
}

export enum OnChainHistoryLoadingState {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR
}


// GraphQLError might be used by other GraphQL services if any are added in the future.
// If it was exclusively for Zora, it could be removed too. For now, keeping it.
export interface GraphQLError {
  message: string;
  // Depending on the API, there might be other fields like 'locations', 'path', 'extensions'
}