
import React from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import { SparklesIcon, WalletIcon, CubeIcon, ArrowRightIcon, UserPlusIcon, ArrowDownTrayIcon } from '../components/Icons';

interface LandingPageProps {
  onNavigateToEditor: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 hover:border-sky-500 transition-all duration-300 transform hover:scale-105">
    <div className="flex items-center justify-center w-12 h-12 bg-sky-500/20 text-sky-400 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-slate-100 mb-2">{title}</h3>
    <p className="text-slate-400 text-sm">{description}</p>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToEditor }) => {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  
  const projectId = (window as any).ENV.WALLETCONNECT_PROJECT_ID;
  // This logic for canOpenModal was simplified in App.tsx. It should allow modal opening with test IDs.
  // Correcting it here to be consistent: it should only be false if projectId is the initial placeholder.
  const canOpenModal = projectId && projectId !== 'YOUR_WALLETCONNECT_PROJECT_ID';


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 pt-16 sm:pt-24">
      <header className="text-center mb-12 sm:mb-16 max-w-3xl">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-500 mb-6">
          Craft Your Web3 Identity
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed">
          Showcase your on-chain achievements, skills, and projects with an AI-enhanced professional profile. Connect your wallet, generate insights, and stand out in the decentralized world.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={onNavigateToEditor}
            className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-lg font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 shadow-lg"
            aria-label="Create or Edit Your Profile"
          >
            <UserPlusIcon className="w-6 h-6 mr-2.5" />
            {isConnected ? 'Go to Your Profile' : 'Create Your Profile'}
          </button>
          <button
             onClick={() => {
                if (canOpenModal) {
                    open();
                } else {
                    alert("WalletConnect is not configured. Please ensure a valid Project ID is set up by the developer.");
                }
            }}
            disabled={!canOpenModal}
            className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-sky-500 text-sky-300 rounded-lg hover:bg-sky-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label={isConnected ? `Connected: ${address?.substring(0,6)}...${address?.substring(address.length -4)}` : "Connect Your Wallet"}
          >
            <WalletIcon className="w-6 h-6 mr-2.5" />
            {isConnected && address ? `Wallet Connected` : 'Connect Wallet'}
          </button>
        </div>
         {!canOpenModal && (
            <div className="mt-6 max-w-md mx-auto p-2.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-md text-xs">
                Wallet connection features are limited. A valid WalletConnect Project ID is required for full functionality.
            </div>
        )}
      </header>

      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-24">
        <FeatureCard 
          icon={<SparklesIcon className="w-6 h-6" />}
          title="AI-Powered Summaries"
          description="Let Gemini API craft a compelling professional summary based on your profile data, highlighting your key strengths."
        />
        <FeatureCard 
          icon={<CubeIcon className="w-6 h-6" />}
          title="On-Chain Activity"
          description="Connect your wallet to display relevant on-chain interactions, showcasing your Web3 engagement and history."
        />
        <FeatureCard 
          icon={<ArrowDownTrayIcon className="w-6 h-6" />} 
          title="Downloadable Profile"
          description="Easily download your generated Web3 profile as an image to share across platforms or include in applications."
        />
      </section>

      <footer className="text-center text-sm text-slate-500 pb-8">
        <p>&copy; {new Date().getFullYear()} Web3 AI Profile Generator. All rights reserved.</p>
        <p className="mt-1">Built with modern Web3 technologies.</p>
      </footer>
    </div>
  );
};

export default LandingPage;