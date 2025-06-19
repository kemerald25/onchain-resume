
import React from 'react';
import { ResumeData } from '../types';

interface ResumeFormProps {
  initialData: ResumeData;
  onChange: (data: Partial<ResumeData>) => void;
}

const InputField: React.FC<{label: string, name: keyof ResumeData, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string, type?: string}> = 
  ({label, name, value, onChange, placeholder, type = "text"}) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-100"
    />
  </div>
);

const TextAreaField: React.FC<{label: string, name: keyof ResumeData, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder?: string, rows?: number}> = 
  ({label, name, value, onChange, placeholder, rows = 3}) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">
      {label}
    </label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-100"
    />
  </div>
);


const ResumeForm: React.FC<ResumeFormProps> = ({ initialData, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <InputField 
        label="Full Name" 
        name="name" 
        value={initialData.name} 
        onChange={handleChange}
        placeholder="e.g., Satoshi Nakamoto" 
      />
      <TextAreaField 
        label="Bio / Summary" 
        name="bio" 
        value={initialData.bio} 
        onChange={handleChange}
        placeholder="Briefly describe yourself and your Web3 passion"
        rows={4}
      />
      <TextAreaField 
        label="Skills" 
        name="skills" 
        value={initialData.skills} 
        onChange={handleChange}
        placeholder="e.g., Solidity, Smart Contracts, DeFi, DAO Governance, Rust"
        rows={3}
      />
      <TextAreaField 
        label="Notable Projects / Contributions" 
        name="projects" 
        value={initialData.projects} 
        onChange={handleChange}
        placeholder="Describe key projects or contributions in the Web3 space"
        rows={5}
      />
      <h3 className="text-lg font-medium text-slate-300 mt-6 mb-3">Social Links (Optional)</h3>
      <InputField 
        label="GitHub Profile URL" 
        name="github" 
        value={initialData.github} 
        onChange={handleChange}
        placeholder="https://github.com/username" 
      />
      <InputField 
        label="Twitter Profile URL" 
        name="twitter" 
        value={initialData.twitter} 
        onChange={handleChange}
        placeholder="https://twitter.com/username" 
      />
       <InputField 
        label="LinkedIn Profile URL" 
        name="linkedin" 
        value={initialData.linkedin} 
        onChange={handleChange}
        placeholder="https://linkedin.com/in/username" 
      />
    </form>
  );
};

export default ResumeForm;
