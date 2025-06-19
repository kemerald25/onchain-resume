
import React, { useState, useCallback, useEffect } from 'react';
import { createWeb3Modal, useWeb3Modal } from '@web3modal/wagmi/react';
import { WagmiProvider, createConfig, http, useAccount } from 'wagmi';
import { base, mainnet, monadTestnet, zora } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';

import LandingPage from './pages/LandingPage';
import ProfileEditorPage from './pages/ProfileEditorPage';
import { WalletIcon } from './components/Icons'; // For potential use in a shared header if needed

// --- Page Enum ---
export enum AppPage {
  Landing,
  ProfileEditor,
}

// --- Web3Modal Setup ---
const projectId = (window as any).ENV.WALLETCONNECT_PROJECT_ID;

if (!projectId || projectId === 'YOUR_WALLETCONNECT_PROJECT_ID') {
  console.warn(
    "WalletConnect Project ID is using a placeholder or is not set." +
    "Please obtain a valid ID from cloud.walletconnect.com and set it in index.html for full functionality." +
    "The application might not work correctly with wallets without your own valid Project ID."
  );
}

const metadata = {
  name: 'Web3 AI Profile Generator',
  description: 'Create and share your Web3 profile with AI summaries and on-chain activity.',
  url: window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/37784886'] // Replace with your app's icon
};

const chains = [mainnet, zora, base, monadTestnet] as const;

const wagmiConfig = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [zora.id]: http('https://rpc.zora.energy'),
    [base.id]: http('https://mainnet.base.org'),
    [monadTestnet.id]: http('https://testnet-rpc.monad.xyz'),
  },
  connectors: [
    walletConnect({ projectId, metadata, showQrModal: false }),
    injected(),
    coinbaseWallet({ appName: metadata.name, darkMode: true, preference: 'all' })
  ],
  ssr: false,
});

// Call createWeb3Modal once at the top level
// Allow initialization even with a test/fallback ID.
// WalletConnect services will handle actual ID validation.
if (projectId && projectId !== 'YOUR_WALLETCONNECT_PROJECT_ID') {
    createWeb3Modal({
      wagmiConfig,
      projectId,
      enableAnalytics: false,
      themeMode: 'dark',
      enableEIP6963: true,
      // @ts-ignore 
      siweConfig: undefined, 
    });
} else {
    // This console.error will now only trigger if projectId is the exact placeholder or null/undefined
    console.error("Web3Modal initialization SKIPPED due to missing or placeholder Project ID. Critical wallet features will NOT work.");
}

const queryClient = new QueryClient();

// --- Main App Component with Routing ---
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<AppPage>(AppPage.Landing);
  const { open } = useWeb3Modal(); // This will throw error if createWeb3Modal was not called.
  const { address, isConnected } = useAccount();

  const navigateToEditor = () => setCurrentPage(AppPage.ProfileEditor);
  const navigateToLanding = () => setCurrentPage(AppPage.Landing);

  // Check if Web3Modal can be opened (i.e., if it was initialized)
  const canOpenModal = projectId && projectId !== 'YOUR_WALLETCONNECT_PROJECT_ID';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 antialiased">
       {/* Optional: Shared Header can go here if needed across pages */}
       {/* Example:
        <header className="p-4 flex justify-between items-center border-b border-slate-700">
            <h1 onClick={navigateToLanding} className="text-xl font-bold cursor-pointer text-sky-400">Web3 Profile</h1>
            <button
                onClick={() => canOpenModal ? open() : alert("WalletConnect features are limited. Configure a valid Project ID.")}
                disabled={!canOpenModal}
                className="flex items-center px-3 py-1.5 border border-sky-500 text-sky-300 rounded-lg hover:bg-sky-500/20 transition-colors disabled:opacity-50"
            >
                <WalletIcon className="w-5 h-5 mr-2" />
                {isConnected && address ? `Connected: ${address.substring(0,6)}...${address.substring(address.length - 4)}` : "Connect Wallet"}
            </button>
        </header>
      */}

      {currentPage === AppPage.Landing && (
        <LandingPage 
          onNavigateToEditor={navigateToEditor} 
        />
      )}
      {currentPage === AppPage.ProfileEditor && (
        <ProfileEditorPage 
          onNavigateToLanding={navigateToLanding}
        />
      )}
    </div>
  );
};


// --- Web3AppWrapper ---
const Web3AppWrapper: React.FC = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WagmiProvider>
);

export default Web3AppWrapper;