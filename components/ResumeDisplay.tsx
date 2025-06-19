import React from 'react';
import { ResumeData, OnChainHistoryData, OnChainHistoryLoadingState } from '../types';
import { LinkIcon, UserCircleIcon, BriefcaseIcon, CodeBracketIcon, SparklesIcon, WalletIcon, CubeIcon, ExclamationTriangleIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

interface ResumeDisplayProps {
  resumeData: ResumeData;
  aiSummary: string;
  walletAddress?: string | null;
  onChainHistoryData?: OnChainHistoryData | null;
  historyLoadingState?: OnChainHistoryLoadingState;
}

const Section: React.FC<{title: string, icon?: React.ReactNode, children: React.ReactNode, titleClassName?: string, contentClassName?: string}> = 
  ({ title, icon, children, titleClassName = "text-sky-400", contentClassName = "" }) => (
  <div className="mb-6 last:mb-0">
    <h3 className={`text-xl font-semibold ${titleClassName} mb-2 flex items-center`}>
      {icon && <span className="mr-2">{icon}</span>}
      {title}
    </h3>
    <div className={`text-slate-300 whitespace-pre-wrap break-words prose prose-sm prose-invert max-w-none ${contentClassName}`}>
        {children}
    </div>
  </div>
);

const ResumeDisplay: React.FC<ResumeDisplayProps> = ({ 
  resumeData, 
  aiSummary, 
  walletAddress,
  onChainHistoryData,
  historyLoadingState 
}) => {
  const { name, bio, skills, projects, github, twitter, linkedin } = resumeData;

  const renderSocialLink = (url: string, platformName: string, icon: React.ReactNode) => {
    if (!url) return null;
    let displayUrl = url;
    try {
      const parsedUrl = new URL(url);
      displayUrl = parsedUrl.protocol + "//" + parsedUrl.hostname + (parsedUrl.pathname === '/' ? '' : parsedUrl.pathname);
    } catch (e) { /* use original url if parsing fails */ }

    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        aria-label={`Link to ${platformName} profile`}
        className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-150 mr-4 mb-2"
      >
        {icon}
        <span className="ml-1.5">{platformName}</span>
      </a>
    );
  }

  const renderOnChainHistory = () => {
    if (!walletAddress) { // Only show this section if a wallet is connected
      return (
        <p className="text-slate-500 text-sm">Connect your wallet to view on-chain activity.</p>
      );
    }

    if (historyLoadingState === OnChainHistoryLoadingState.LOADING) {
      return (
        <div className="flex items-center text-slate-400">
          <LoadingSpinner size="sm" color="text-sky-400" />
          <span className="ml-2">Fetching on-chain activity...</span>
        </div>
      );
    }

    if (historyLoadingState === OnChainHistoryLoadingState.ERROR || onChainHistoryData?.error) {
      return (
        <div className="flex items-start text-red-400">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{onChainHistoryData?.error || "An error occurred while fetching on-chain activity."}</span>
        </div>
      );
    }
    
    if (historyLoadingState === OnChainHistoryLoadingState.SUCCESS && onChainHistoryData) {
      const { firstTxDate, totalTransactions, contractInteractions, activeChains } = onChainHistoryData;
      if (!firstTxDate && !totalTransactions && (!contractInteractions || contractInteractions.length === 0)) {
        return <p className="text-slate-400">No significant on-chain activity found or data is unavailable.</p>;
      }
      return (
        <ul className="list-none p-0 space-y-1 text-sm">
          {firstTxDate && <li><strong>First Transaction:</strong> {firstTxDate}</li>}
          {totalTransactions !== undefined && <li><strong>Total Transactions:</strong> {totalTransactions.toLocaleString()}</li>}
          {activeChains && activeChains.length > 0 && (
            <li><strong>Active On:</strong> {activeChains.join(', ')}</li>
          )}
          {contractInteractions && contractInteractions.length > 0 && (
            <li>
              <strong>Key Interactions:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                {contractInteractions.map((interaction, index) => (
                  <li key={index}>{interaction}</li>
                ))}
              </ul>
            </li>
          )}
        </ul>
      );
    }
    return <p className="text-slate-500 text-sm">On-chain activity will appear here when your wallet is connected.</p>;
  };


  return (
    <div className="space-y-6 p-4 md:p-0">
      {name && (
        <Section title={name || "Your Name"} icon={<UserCircleIcon className="w-6 h-6" />}>
          <p>{bio || "No bio provided."}</p>
        </Section>
      )}

      {aiSummary && (
        <Section title="AI Generated Summary" icon={<SparklesIcon className="w-6 h-6" />}>
          <p className="italic text-sky-300">{aiSummary}</p>
        </Section>
      )}
      
      {walletAddress && (
         <Section title="Connected Wallet" icon={<WalletIcon className="w-6 h-6" />}>
           <p className="text-sm text-slate-400 break-all">{walletAddress}</p>
         </Section>
      )}

      <Section title="On-Chain Activity" icon={<CubeIcon className="w-6 h-6" />} contentClassName="text-sm">
        {renderOnChainHistory()}
      </Section>

      {skills && (
        <Section title="Skills" icon={<CodeBracketIcon className="w-6 h-6" />}>
          <p>{skills}</p>
        </Section>
      )}

      {projects && (
        <Section title="Notable Projects & Contributions" icon={<BriefcaseIcon className="w-6 h-6" />}>
          <p>{projects}</p>
        </Section>
      )}
      
      {(github || twitter || linkedin) && (
        <Section title="Social Links" icon={<LinkIcon className="w-6 h-6" />}>
          <div className="flex flex-wrap items-center">
             {renderSocialLink(github, "GitHub", <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.026 2.747-1.026.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12.017C22 6.484 17.522 2 12 2Z" clipRule="evenodd" /></svg>)}
            {renderSocialLink(twitter, "Twitter", <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>)}
            {renderSocialLink(linkedin, "LinkedIn", <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>)}
          </div>
        </Section>
      )}

      {!name && !bio && !skills && !projects && !aiSummary && !walletAddress && (
        <p className="text-slate-400 text-center py-8">
          Your generated profile will appear here. Fill out the form and click "Generate AI Summary". Connect your wallet to display its address and on-chain activity.
        </p>
      )}
    </div>
  );
};

export default ResumeDisplay;