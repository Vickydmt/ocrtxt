import axios, { AxiosError } from "axios";

// Configuration (move to environment variables in production)
const GOOGLE_VISION_API_KEY = process.env.REACT_APP_GOOGLE_VISION_API_KEY || "your_api_key";
const GOOGLE_VISION_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

// Type definitions
interface VisionApiRequest {
  image: { content: string };
  features: { type: string }[];
  imageContext?: {
    languageHints?: string[];
    preprocessingOptions?: {
      contrastBoost?: number;
      sharpenRadius?: number;
    };
  };
}

interface VisionApiResponse {
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
    error?: {
      message: string;
    };
  }[];
}

/**
 * Process historical documents with enhanced OCR capabilities
 * @param file - Document image file
 * @param options - { languageHint: string, contrastBoost: boolean }
 * @returns Extracted text with metadata
 */
export async function processHistoricalDocument(
  file: File,
  options?: {
    languageHint?: string;
    contrastBoost?: boolean;
  }
): Promise<{
  text: string;
  detectedLanguage?: string;
  confidence?: number;
}> {
  try {
    // 1. Preprocess image if needed
    const processedFile = options?.contrastBoost
      ? await enhanceDocumentImage(file)
      : file;

    // 2. Convert to Base64
    const base64Image = await fileToBase64(processedFile);

    // 3. Prepare API request with document-specific optimizations
    const requestData = {
      requests: [
        {
          image: { content: base64Image },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          imageContext: {
            languageHints: options?.languageHint ? [options.languageHint] : undefined,
            preprocessingOptions: {
              contrastBoost: options?.contrastBoost ? 20 : undefined,
            },
          },
        } as VisionApiRequest,
      ],
    };

    // 4. API call with timeout and error handling
    const response = await axios.post<VisionApiResponse>(GOOGLE_VISION_ENDPOINT, requestData, {
      headers: { "Content-Type": "application/json" },
      timeout: 45000, // Longer timeout for historical documents
    });

    // 5. Extract text and metadata
    const result = extractTextFromResponse(response.data);
    
    return {
      text: result.text,
      detectedLanguage: result.detectedLanguages?.[0]?.languageCode,
      confidence: result.detectedLanguages?.[0]?.confidence,
    };
  } catch (error) {
    const err = error as AxiosError;
    console.error("OCR Error:", err.response?.data || err.message);
    
    // Fallback to Tesseract.js if Google Vision fails
    try {
      const fallbackResult = await tesseractFallback(file);
      return {
        text: fallbackResult,
        detectedLanguage: "unknown (fallback)",
      };
    } catch (fallbackError) {
      throw new Error(
        `OCR Failed: ${err.response?.data?.error?.message || err.message}\n` +
        `Fallback also failed: ${fallbackError}`
      );
    }
  }
}

// --- Helper Functions --- //

/** Enhanced image preprocessing for historical documents */
async function enhanceDocumentImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      
      // Adjust canvas size with padding
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      
      // Fill background for better contrast
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw image with processing
      ctx.filter = "contrast(1.4) brightness(1.1) grayscale(100%)";
      ctx.drawImage(
        img,
        20, 20, // Padding
        img.width, img.height
      );
      
      // Convert back to File
      canvas.toBlob((blob) => {
        resolve(new File([blob!], file.name, { type: "image/jpeg" }));
      }, "image/jpeg", 0.85);
    };
  });
}

/** Extract text with metadata from API response */
function extractTextFromResponse(data: VisionApiResponse): {
  text: string;
  detectedLanguages?: { languageCode: string; confidence: number }[];
} {
  if (!data.responses?.[0]) {
    throw new Error("No response from Vision API");
  }
  
  const response = data.responses[0];
  
  if (response.error) {
    throw new Error(response.error.message);
  }
  
  return {
    text: response.fullTextAnnotation?.text || "No text found",
    detectedLanguages: response.fullTextAnnotation?.pages?.[0]?.property?.detectedLanguages,
  };
}

/** Convert file to Base64 with validation */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result?.toString();
      if (!result) {
        reject(new Error("File read returned empty result"));
        return;
      }
      resolve(result.split(",")[1]);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}
