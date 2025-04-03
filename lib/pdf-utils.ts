// lib/pdf-utils.ts

// Utility functions for exporting extracted and translated text

export function downloadAsPDF(
  originalText: string,
  translatedText: string,
  sourceLanguage: string,
  targetLanguage: string,
): void {
  // In a real implementation, you would use a library like jsPDF
  // to generate a PDF with the original and translated text

  // For this example, we'll just download as text with some formatting
  const content = `
ORIGINAL TEXT (${getLanguageName(sourceLanguage)})
------------------------
${originalText}

TRANSLATED TEXT (${getLanguageName(targetLanguage)})
------------------------
${translatedText}
  `

  downloadAsText(content, `translation-${sourceLanguage}-to-${targetLanguage}`)
}

function getLanguageName(languageCode: string): string {
  const languages: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    bn: "Bengali",
    ta: "Tamil",
    te: "Telugu",
    mr: "Marathi",
    gu: "Gujarati",
    kn: "Kannada",
    ml: "Malayalam",
    pa: "Punjabi",
    ur: "Urdu",
    auto: "Auto-detected",
  }

  return languages[languageCode] || languageCode
}

function downloadAsText(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

