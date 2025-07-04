import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

// This function initializes the AI client with a provided API key.
export function initializeAi(apiKey: string) {
  if (!apiKey) {
    ai = null;
    console.warn("AI initialization skipped: no API key provided.");
    return;
  }
  try {
    // Re-initialize the client with the new key
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    ai = null;
  }
}

export function isAiReady(): boolean {
  return !!ai;
}

const checkAiReady = () => {
  if (!isAiReady()) {
    throw new Error("AI Service is not initialized. Please set a valid API key.");
  }
  return ai!;
};


export const generateImage = async (word: string, meaning: string): Promise<string> => {
    try {
        const client = checkAiReady();
        const prompt = `A vibrant, high-quality, photorealistic image representing the word: "${word}" (which means "${meaning}"). Centered object, clean background, focus on the concept.`;

        const response = await client.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error(`Failed to generate image. Please check your API key and network connection. Details: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const generateExplanation = async (word: string, meaning: string, hint?: string): Promise<string> => {
    let prompt = `您是一位乐于助人的语言学习助手。请针对英文单词 "${word}"（意思是 "${meaning}"），提供一个简洁易懂的中文解释，帮助学习者记住它。解释可以是一个简单的定义、一个例句或一个令人难忘的类比。请将解释限制在50个汉字以内，并仅返回解释文本。`;
    if (hint && hint.trim()) {
      prompt += `\n\n请参考以下提示来生成解释：${hint}`;
    }
    try {
        const client = checkAiReady();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating explanation:", error);
        throw new Error(`Failed to generate explanation. Details: ${error instanceof Error ? error.message : String(error)}`);
    }
};
