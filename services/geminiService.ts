
import { GoogleGenAI } from "@google/genai";
import { Service, UserRole } from "../types";

// Always use process.env.API_KEY directly for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  analyzePricing: async (services: Service[], marketTrend: string) => {
    const prompt = `
      As a business consultant, analyze the following service list and provide pricing recommendations based on this market trend: "${marketTrend}".
      
      Service Data:
      ${JSON.stringify(services, null, 2)}
      
      Provide your analysis in a concise format focusing on:
      1. Which services are underpriced/overpriced.
      2. Suggested price adjustments.
      3. A summary of competitiveness.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      // Correct usage of .text property
      return response.text;
    } catch (error) {
      console.error("Gemini analysis failed:", error);
      return "Unable to perform AI analysis at this time. Please check your API configuration.";
    }
  },

  generateMarketingCopy: async (service: Service) => {
    const prompt = `Generate a 2-sentence persuasive marketing pitch for this service: ${service.name} (${service.description}) provided by a ${service.providerRole}.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      // Correct usage of .text property
      return response.text;
    } catch (error) {
      return "Excellence in every delivery.";
    }
  }
};
