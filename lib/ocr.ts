import axios from "axios";

// Environment variables (recommended for API keys)
const GOOGLE_VISION_API_KEY = process.env.REACT_APP_GOOGLE_VISION_API_KEY || "AIzaSyA2xoFUwlBNOK112_DwXJy2Pq5Tqlp_7PA";
const GOOGLE_VISION_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

// Type definitions for better code safety
interface VisionApiRequest {
  image: { content: string };
  features: { type: string }[];
  imageContext?: {
    languageHints?: string[];
  };
}

interface VisionApiResponse {
  responses: {
    fullTextAnnotation?: {
      text: string;
    };
    error?: {
      message: string;
    };
  }[];
}

export async function processImage(file: File, languageHint?: string): Promise<string> {
  try {
    // Step 1: Preprocess image (optional)
    const processedImage = await preprocessImage(file);

    // Step 2: Convert to Base64
    const base64Image = await fileToBase64(processedImage);

    // Step 3: Prepare API request
    const requestData = {
      requests: [
        {
          image: { content: base64Image },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }], // Better for documents than TEXT_DETECTION
          imageContext: {
            languageHints: languageHint ? [languageHint] : ["en"], // Default to English if no hint
          },
        } as VisionApiRequest,
      ],
    };

    // Step 4: Call API with timeout
    const response = await axios.post<VisionApiResponse>(
      GOOGLE_VISION_ENDPOINT,
      requestData,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000, // 30-second timeout
      }
    );

    // Step 5: Validate and extract text
    return extractTextFromResponse(response.data);
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error(
      axios.isAxiosError(error)
        ? `OCR Failed: ${error.response?.data?.error?.message || error.message}`
        : "Failed to process image"
    );
  }
}

// --- Helper Functions --- //

/** Convert File to Base64 (optimized) */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result?.toString().split(",")[1] || "");
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}

/** Extract text from API response with validation */
function extractTextFromResponse(data: VisionApiResponse): string {
  if (!data.responses?.[0]) {
    throw new Error("No response from Vision API");
  }
  if (data.responses[0].error) {
    throw new Error(data.responses[0].error.message);
  }
  return data.responses[0].fullTextAnnotation?.text || "No text found";
}

/** Optional: Client-side image preprocessing */
async function preprocessImage(file: File): Promise<File> {
  // Example: Use canvas to adjust contrast/brightness
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = img.width;
      canvas.height = img.height;

      // Apply preprocessing (adjust as needed)
      ctx.filter = "contrast(1.2) brightness(1.1)";
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        resolve(new File([blob!], file.name, { type: file.type }));
      }, "image/jpeg", 0.9);
    };
  });
}
