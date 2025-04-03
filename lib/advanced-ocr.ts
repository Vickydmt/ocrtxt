import axios, { AxiosError } from "axios";

// Configuration (store in environment variables)
const API_KEY = "AIzaSyA2xoFUwlBNOK112_DwXJy2Pq5Tqlp_7PA";
const API_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

// Type definitions
interface VisionRequest {
  image: { content: string };
  features: { type: "DOCUMENT_TEXT_DETECTION" }[];
  imageContext?: {
    languageHints?: string[];
    preprocessingOptions?: {
      contrastBoost?: number;
      sharpenRadius?: number;
    };
  };
}

interface VisionResponse {
  responses: {
    fullTextAnnotation?: {
      text: string;
      pages?: {
        property?: {
          detectedLanguages?: {
            languageCode: string;
            confidence: number;
          }[];
        };
      }[];
    };
    error?: { message: string };
  }[];
}

/**
 * Enhanced OCR for historical documents
 * @param file - Image/PDF file
 * @param options - { languageHint?: string; enhanceQuality?: boolean }
 */
export async function extractHistoricalText(
  file: File,
  options?: {
    languageHint?: string;
    enhanceQuality?: boolean;
  }
): Promise<{
  text: string;
  languages?: { code: string; confidence: number }[];
}> {
  try {
    // 1. Optional image enhancement
    const processedImage = options?.enhanceQuality
      ? await enhanceImage(file)
      : await fileToBase64(file);

    // 2. Prepare request
    const request: VisionRequest = {
      image: { content: processedImage },
      features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
      imageContext: {
        languageHints: options?.languageHint ? [options.languageHint] : undefined,
        preprocessingOptions: {
          contrastBoost: options?.enhanceQuality ? 15 : undefined,
        },
      },
    };

    // 3. API call with extended timeout
    const { data } = await axios.post<VisionResponse>(
      API_ENDPOINT,
      { requests: [request] },
      { timeout: 40000 } // 40s timeout
    );

    // 4. Validate and return results
    if (!data.responses?.[0]) throw new Error("No API response");
    if (data.responses[0].error) throw new Error(data.responses[0].error.message);

    const text = data.responses[0].fullTextAnnotation?.text || "";
    const languages = data.responses[0].fullTextAnnotation?.pages?.[0]?.property?.detectedLanguages;

    return { text, languages };
  } catch (error) {
    console.error("OCR Failed:", (error as AxiosError).response?.data || error);
    throw new Error(
      `Document processing failed: ${(error as Error).message}`
    );
  }
}

// --- Helper Functions --- //

/** Convert File to Base64 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result?.toString();
      result ? resolve(result.split(",")[1]) : reject("Invalid file");
    };
    reader.onerror = () => reject("File read error");
  });
}

/** Enhance document image quality */
async function enhanceImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      
      // Add white background padding
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Apply enhancements
      ctx.filter = "contrast(1.3) brightness(1.1) grayscale(100%)";
      ctx.drawImage(img, 20, 20, img.width, img.height);
      
      // Return as Base64
      resolve(canvas.toDataURL("image/jpeg", 0.9).split(",")[1]);
    };
  });
}
