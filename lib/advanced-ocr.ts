import axios from "axios";
import cv from "opencv.js"; // Import OpenCV.js

const GOOGLE_VISION_API_KEY = "AIzaSyA2xoFUwlBNOK112_DwXJy2Pq5Tqlp_7PA";
const GOOGLE_VISION_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

export async function processHistoricalDocument(file: File): Promise<string> {
    try {
        const base64Image = await preprocessImage(file); // Preprocess before OCR

        const requestData = {
            requests: [
                {
                    image: { content: base64Image },
                    features: [{ type: "DOCUMENT_TEXT_DETECTION" }], // Better for dense text & handwriting
                },
            ],
        };

        const response = await axios.post(GOOGLE_VISION_ENDPOINT, requestData, {
            headers: { "Content-Type": "application/json" },
        });

        return extractTextFromResponse(response.data);
    } catch (error) {
        console.error("OCR Error:", error);
        throw new Error("Failed to process document");
    }
}

// Preprocess image using OpenCV.js
async function preprocessImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const img = new Image();
            img.src = reader.result as string;
            img.onload = () => {
                const src = cv.imread(img);
                const dst = new cv.Mat();

                // Convert to grayscale
                cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);

                // Apply adaptive thresholding (better for faded text)
                cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

                // Denoising (Gaussian blur to remove noise)
                cv.GaussianBlur(dst, dst, new cv.Size(3, 3), 0);

                // Convert back to Base64 for OCR processing
                const processedBase64 = matToBase64(dst);

                // Cleanup
                src.delete();
                dst.delete();

                resolve(processedBase64);
            };
        };
        reader.onerror = (error) => reject(error);
    });
}

// Convert OpenCV.js Mat to Base64
function matToBase64(mat: cv.Mat): string {
    const canvas = document.createElement("canvas");
    cv.imshow(canvas, mat);
    return canvas.toDataURL("image/png").split(",")[1];
}

// Extract text from Google Vision response
function extractTextFromResponse(data: any): string {
    return data.responses?.[0]?.fullTextAnnotation?.text || "No text found";
}
