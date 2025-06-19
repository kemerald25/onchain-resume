
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ResumeData, LoadingState, OnChainHistoryData, OnChainHistoryLoadingState } from '../types';
import ResumeForm from '../components/ResumeForm';
import ResumeDisplay from '../components/ResumeDisplay';
import { generateProfileSummary } from '../services/geminiService';
import { fetchOnChainHistory } from '../services/onChainHistoryService'; 
import { SparklesIcon, ArrowDownTrayIcon, ExclamationTriangleIcon, WalletIcon, HomeIcon, TwitterIcon } from '../components/Icons'; 
import LoadingSpinner from '../components/LoadingSpinner';
import html2canvas from 'html2canvas';
import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';

const LOCAL_STORAGE_RESUME_KEY = 'web3ResumeData';
const LOCAL_STORAGE_AI_SUMMARY_KEY = 'web3AiSummary';
const ONCHAIN_HISTORY_POLLING_INTERVAL = 60000; // 60 seconds

interface ProfileEditorPageProps {
  onNavigateToLanding: () => void;
}

const ProfileEditorPage: React.FC<ProfileEditorPageProps> = ({ onNavigateToLanding }) => {
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_RESUME_KEY);
    return saved ? JSON.parse(saved) : {
      name: '', bio: '', skills: '', projects: '', github: '', twitter: '', linkedin: '',
    };
  });
  const [aiSummary, setAiSummary] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_AI_SUMMARY_KEY) || '';
  });

  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const resumeDisplayRef = useRef<HTMLDivElement>(null);

  // State for on-chain history
  const [onChainHistory, setOnChainHistory] = useState<OnChainHistoryData | null>(null);
  const [historyLoadingState, setHistoryLoadingState] = useState<OnChainHistoryLoadingState>(OnChainHistoryLoadingState.IDLE);
  
  const { address, isConnected, chainId } = useAccount();
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();

  const projectId = (window as any).ENV.WALLETCONNECT_PROJECT_ID;
  const canOpenModal = projectId && projectId !== 'YOUR_WALLETCONNECT_PROJECT_ID';


  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_RESUME_KEY, JSON.stringify(resumeData));
  }, [resumeData]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_AI_SUMMARY_KEY, aiSummary);
  }, [aiSummary]);

  const triggerFetchOnChainHistory = useCallback((currentAddress?: string, currentChainId?: number) => {
    if (currentAddress && typeof currentChainId === 'number') { // Ensure chainId is also present
      setHistoryLoadingState(OnChainHistoryLoadingState.LOADING);
      // Don't clear previous history immediately for a smoother polling update experience, 
      // unless it's the very first load or address/chain changes.
      // setOnChainHistory(null); 
      fetchOnChainHistory(currentAddress, currentChainId)
        .then(data => {
          setOnChainHistory(data);
          setHistoryLoadingState(OnChainHistoryLoadingState.SUCCESS);
          if(data.error) {
            console.warn("On-chain history fetch returned an error in data:", data.error);
            setHistoryLoadingState(OnChainHistoryLoadingState.ERROR);
          }
        })
        .catch(err => {
          console.error("Error fetching on-chain history:", err);
          setOnChainHistory({ error: "Failed to fetch on-chain activity. See console." });
          setHistoryLoadingState(OnChainHistoryLoadingState.ERROR);
        });
    } else {
      setOnChainHistory(null);
      setHistoryLoadingState(OnChainHistoryLoadingState.IDLE);
    }
  }, []);

  // Effect to fetch on-chain history when wallet connection state changes (initial load)
  useEffect(() => {
    if (isConnected && address && typeof chainId === 'number') {
      setOnChainHistory(null); // Clear previous history on new connection/chain change
      triggerFetchOnChainHistory(address, chainId);
    } else {
      setOnChainHistory(null);
      setHistoryLoadingState(OnChainHistoryLoadingState.IDLE);
    }
  }, [isConnected, address, chainId, triggerFetchOnChainHistory]);

  // Effect for polling on-chain history
  useEffect(() => {
    if (isConnected && address && typeof chainId === 'number') {
      const intervalId = setInterval(() => {
        console.log("Polling for on-chain history updates...");
        triggerFetchOnChainHistory(address, chainId);
      }, ONCHAIN_HISTORY_POLLING_INTERVAL);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isConnected, address, chainId, triggerFetchOnChainHistory]);


  const handleFormChange = useCallback((data: Partial<ResumeData>) => {
    setResumeData(prev => ({ ...prev, ...data }));
  }, []);

  const handleGenerateSummary = async () => {
    if (!resumeData.name || !resumeData.bio) {
      setError("Name and Bio are required to generate a summary.");
      setLoadingState(LoadingState.ERROR);
      return;
    }
    setLoadingState(LoadingState.LOADING);
    setError(null);
    setAiSummary('');

    try {
      const summary = await generateProfileSummary(resumeData);
      setAiSummary(summary);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err) {
      console.error("Error generating summary:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to generate summary: ${errorMessage}. Check console for details (e.g. API Key).`);
      setLoadingState(LoadingState.ERROR);
    }
  };

  const downloadProfileAsImage = useCallback(() => {
    if (resumeDisplayRef.current) {
      html2canvas(resumeDisplayRef.current, {
        useCORS: true, 
        scale: 2,
        backgroundColor: '#1e293b', 
      }).then(canvas => {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const fileName = resumeData.name ? `${resumeData.name.replace(/\s+/g, '_').toLowerCase()}_web3_profile.png` : 'web3_profile.png';
        link.download = fileName;
        link.href = image;
        link.click();
      }).catch(err => {
        console.error("Error generating image:", err);
        setError("Could not download profile as image. See console for details.");
      });
    }
  }, [resumeData.name]);

  const handleShareToTwitter = () => {
    const appName = "Web3 AI Profile Generator";
    const text = `Check out my Web3 Identity created with ${appName}! 🚀 Showcasing my on-chain achievements and AI-powered insights.`;
    const url = window.location.origin; 
    const hashtags = "Web3Profile,AICareer,OnChainIdentity,DigitalResume";
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <header className="mb-6 sm:mb-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button 
                onClick={onNavigateToLanding}
                className="flex items-center text-sm text-sky-400 hover:text-sky-300 transition-colors"
                aria-label="Back to Landing Page"
            >
                <HomeIcon className="w-5 h-5 mr-1.5" />
                Home
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500 text-center">
                Your Web3 Profile
            </h1>
            <div> {/* Spacer */} </div>
        </div>
        
        <p className="mt-2 text-center text-md text-slate-300 max-w-2xl mx-auto">
          Fill in your details, generate an AI summary, connect your wallet to see on-chain activity, and download your profile.
        </p>
         <div className="mt-6 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
                onClick={() => {
                    if (canOpenModal) {
                        open();
                    } else {
                        alert("WalletConnect is not configured. Please ensure a valid Project ID is set up by the developer for full wallet functionality.");
                    }
                }}
                disabled={!canOpenModal}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-sky-500 text-sky-300 rounded-lg hover:bg-sky-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <WalletIcon className="w-5 h-5 mr-2" />
                {isConnected && address ? `Connected: ${address.substring(0,6)}...${address.substring(address.length - 4)}` : "Connect Wallet"}
            </button>
            {isConnected && canOpenModal && (
                 <button
                    onClick={() => open({ view: 'Account' })}
                    className="w-full sm:w-auto px-3 py-2 border border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                >
                    Account Details
                </button>
            )}
            {isConnected && (
                 <button
                    onClick={() => disconnect()}
                    className="w-full sm:w-auto px-3 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                >
                    Disconnect
                </button>
            )}
        </div>
        {!canOpenModal && (
            <div className="mt-4 max-w-md mx-auto p-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-md text-xs text-center">
                Wallet connection features are limited. A valid WalletConnect Project ID is required by the developer for full functionality.
            </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
          <h2 className="text-2xl font-semibold mb-6 text-sky-400">1. Your Web3 Details</h2>
          <ResumeForm initialData={resumeData} onChange={handleFormChange} />
          <button
            onClick={handleGenerateSummary}
            disabled={loadingState === LoadingState.LOADING || !resumeData.name || !resumeData.bio}
            className="mt-6 w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500"
            aria-label="Generate AI Summary for your profile"
          >
            {loadingState === LoadingState.LOADING ? (
              <LoadingSpinner />
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                Generate AI Summary
              </>
            )}
          </button>
           {error && loadingState === LoadingState.ERROR && (
            <div className="mt-4 p-3 bg-red-500/20 text-red-300 border border-red-500 rounded-md flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2 mt-0.5 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </section>

        <section className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700 flex flex-col">
          <h2 className="text-2xl font-semibold mb-6 text-sky-400">2. Your AI-Enhanced Profile</h2>
          
          <div className="flex-grow">
            { (loadingState === LoadingState.LOADING && !aiSummary) && (
               <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                  <LoadingSpinner size="lg"/>
                  <p className="mt-4 text-slate-400">AI is crafting your summary...</p>
              </div>
            )}
            { (loadingState !== LoadingState.LOADING || aiSummary) && (
              <div 
                ref={resumeDisplayRef} 
                className="bg-slate-800 p-6 rounded-lg shadow-inner" 
                key={`${address}-${historyLoadingState}-${onChainHistory ? JSON.stringify(onChainHistory) : 'noload'}`} // More robust key for re-render
              > 
                <ResumeDisplay 
                  resumeData={resumeData} 
                  aiSummary={aiSummary} 
                  walletAddress={address}
                  onChainHistoryData={onChainHistory}
                  historyLoadingState={historyLoadingState}
                />
              </div>
            )}

            {loadingState !== LoadingState.LOADING && !aiSummary && loadingState !== LoadingState.ERROR && (!resumeData.name || !resumeData.bio) && (
               <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400 text-center">
                  <SparklesIcon className="w-12 h-12 mb-4 text-indigo-400" />
                  <p>Your AI-generated summary will appear here.</p>
                  <p className="text-sm mt-1">Fill in details and generate summary.</p>
              </div>
            )}
             {loadingState === LoadingState.ERROR && !aiSummary && (
               <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400 text-center">
                  <ExclamationTriangleIcon className="w-12 h-12 mb-4 text-red-400" />
                  <p>Could not generate summary. Please check the error message and try again.</p>
              </div>
            )}
          </div>

          { (loadingState === LoadingState.SUCCESS || aiSummary || (resumeData.name && resumeData.bio)) && (
             <div className="mt-6 space-y-3 sm:space-y-0 sm:flex sm:space-x-3">
                <button
                    onClick={downloadProfileAsImage}
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-sky-100 bg-sky-600 hover:bg-sky-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
                    aria-label="Download your profile as an image"
                >
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    Download Profile
                </button>
                <button
                    onClick={handleShareToTwitter}
                    className="w-full flex items-center justify-center px-6 py-3 border border-sky-400 text-sky-300 hover:bg-sky-400/20 text-base font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-400"
                    aria-label="Share your profile on Twitter"
                >
                    <TwitterIcon className="w-5 h-5 mr-2" />
                    Share on Twitter
                </button>
             </div>
            )
          }
        </section>
      </main>
      <footer className="text-center mt-12 py-6 border-t border-slate-700">
        <p className="text-sm text-slate-400">
          Remember to save your profile by downloading it. Data is saved locally in your browser.
        </p>
         <p className="text-sm text-slate-500 mt-1">
          On-chain activity for connected wallet updates periodically.
        </p>
      </footer>
    </div>
  );
};

export default ProfileEditorPage;
