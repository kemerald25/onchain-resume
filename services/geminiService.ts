
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ResumeData } from '../types';

// Ensure API_KEY is accessed from environment variables as per instructions.
// In a real build process (e.g., Vite, Webpack), process.env.API_KEY would be replaced.
// For development, you might need to set this up in your local environment or a .env file
// that your bundler processes. For this codegen, we assume it's available.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This error will be thrown at module load time if API_KEY is not set.
  // The UI should gracefully handle API errors that occur during calls.
  console.error("API_KEY for Gemini is not configured. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! }); // Non-null assertion, as we check above and error/log.

export const generateProfileSummary = async (resumeData: ResumeData): Promise<string> => {
  if (!API_KEY) {
    throw new Error("Gemini API key is not configured. Cannot generate summary.");
  }
  
  const { name, bio, skills, projects } = resumeData;

  const prompt = `
You are a highly skilled professional resume writer and career coach specializing in the Web3, blockchain, and decentralized technology sectors. 
Your task is to generate a compelling, concise, and impactful professional summary (approximately 2-4 sentences) for a Web3 profile based on the provided information.
The summary should be engaging, highlight key skills and notable achievements, and be tailored for a Web3 audience (e.g., potential employers, collaborators, or investors in the space).
Focus on action verbs and quantifiable achievements if available in the input.

Here is the user's information:
Name: ${name}
Bio/Current Summary: ${bio}
Skills: ${skills}
Notable Projects/Contributions: ${projects}

Please generate the professional summary:
  `.trim();

  try {
    // Using the specified model 'gemini-2.5-flash-preview-04-17'
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17", // Ensure this is the correct and available model
      contents: prompt,
      config: {
        // Temperature can be adjusted for more creative (higher) or more factual (lower) responses.
        // 0.7 is a good balance.
        temperature: 0.7, 
        // Max output tokens can be set to control length, but the prompt already asks for concise summary.
        // maxOutputTokens: 150, 
      }
    });
    
    // Directly access the text property as per guidance
    const summaryText = response.text;

    if (!summaryText) {
      throw new Error("Received an empty summary from the API.");
    }
    
    return summaryText.trim();

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        // More specific error handling can be added here, e.g., for auth errors, quota issues etc.
        if (error.message.includes("API key not valid")) {
             throw new Error("Invalid API Key. Please check your Gemini API key.");
        }
    }
    throw new Error("Failed to generate profile summary due to an API error.");
  }
};
