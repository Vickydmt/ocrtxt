"use client"

import { Slider } from "@/components/ui/slider"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUploader } from "@/components/file-uploader"
import { DocumentPreview } from "@/components/document-preview"
import { ProcessingAnimation } from "@/components/processing-animation"
import { DocumentSettings } from "@/components/document-settings"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { FileText, Settings, ArrowRight, Languages, Download, Loader2, Save } from "lucide-react"
import { defaultSettings } from "@/lib/document-settings"
import { processImage } from "@/lib/ocr"
import { processHistoricalDocument } from "@/lib/advanced-ocr"
import { saveDocumentAction } from "@/lib/document-actions"
import { downloadAsPDF } from "@/lib/pdf-utils"

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [file, setFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState("")
  const [documentType, setDocumentType] = useState("")
  const [language, setLanguage] = useState("auto")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingComplete, setProcessingComplete] = useState(false)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [settings, setSettings] = useState(defaultSettings)
  const [translationLanguage, setTranslationLanguage] = useState("en")
  const [translatedText, setTranslatedText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [documentSaved, setDocumentSaved] = useState(false)

  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile)
    // Auto-generate document name from file name
    if (!documentName) {
      setDocumentName(selectedFile.name.split(".")[0])
    }

    // Create a preview URL for the image
    const url = URL.createObjectURL(selectedFile)
    setImageUrl(url)
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    if (!documentName) {
      toast({
        title: "Missing document name",
        description: "Please provide a name for your document",
        variant: "destructive",
      })
      return
    }

    if (!documentType) {
      toast({
        title: "Missing document type",
        description: "Please select a document type",
        variant: "destructive",
      })
      return
    }

    try {
      setIsProcessing(true)
      setActiveTab("processing")

      // Simulate processing progress
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + 5
        })
      }, 200)

      // Process the document using the appropriate OCR function based on settings
      let text
      if (settings.processingMode === "historical") {
        text = await processHistoricalDocument(file)
      } else {
        text = await processImage(file)
      }

      clearInterval(progressInterval)
      setProcessingProgress(100)
      setExtractedText(text)

      // Complete processing and go directly to result tab
      setTimeout(() => {
        setProcessingComplete(true)
        setActiveTab("result")
        setIsProcessing(false)

        toast({
          title: "Document processed successfully",
          description: "Your document has been processed and text has been extracted",
        })
      }, 500)
    } catch (error) {
      console.error("Error processing document:", error)
      toast({
        title: "Processing failed",
        description: "There was an error processing your document. Please try again.",
        variant: "destructive",
      })
      setActiveTab("upload")
      setIsProcessing(false)
    }
  }

  const handleTranslate = () => {
    if (!extractedText) return

    setIsTranslating(true)

    // Simulate translation process
    setTimeout(() => {
      const translatedSample = `This is a translated version of the document. The translation preserves the meaning while making it accessible in the selected language.

The document provides valuable insights into the content. Some nuances may be lost in translation, but the core information remains intact.

This translation aims to make this important document accessible to a wider audience.`

      setTranslatedText(translatedSample)
      setIsTranslating(false)
      setActiveTab("translate")

      toast({
        title: "Translation complete",
        description: `Document has been translated to ${getLanguageName(translationLanguage)}`,
      })
    }, 2000)
  }

  const handleSaveDocument = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to save documents",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!extractedText) {
      toast({
        title: "No content to save",
        description: "Please process a document first",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      const documentData = {
        name: documentName,
        type: documentType,
        language: language,
        content: extractedText,
        translatedContent: translatedText || null,
        translationLanguage: translatedText ? translationLanguage : null,
        originalImage: imageUrl || "",
        fileSize: file?.size || 0,
        pages: 1,
        confidence: 92,
        userId: user.uid,
        settings: settings,
        createdAt: new Date(),
      }

      const docId = await saveDocumentAction(documentData)
      setDocumentId(docId)
      setDocumentSaved(true)

      toast({
        title: "Document saved",
        description: "Your document has been saved successfully",
      })
    } catch (error) {
      console.error("Error saving document:", error)
      toast({
        title: "Save failed",
        description: "There was an error saving your document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getLanguageName = (code: string): string => {
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

    return languages[code] || code
  }

  const downloadText = (text: string, filename: string) => {
    const element = document.createElement("a")
    const file = new Blob([text], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `${filename}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="rounded-lg bg-card text-card-foreground border shadow-md">
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <h1 className="tracking-tight text-3xl font-bold">Historical Document Digitizer</h1>
          <p className="text-sm text-muted-foreground">
            Digitize handwritten and historical documents with OCR and translation
          </p>
        </div>

        <div className="p-6 pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground grid grid-cols-4 mb-8">
              <TabsTrigger value="upload" disabled={isProcessing} className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="settings" disabled={isProcessing} className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="result" disabled={!processingComplete} className="flex items-center">
                <ArrowRight className="mr-2 h-4 w-4" />
                Result
              </TabsTrigger>
              <TabsTrigger value="translate" disabled={!processingComplete} className="flex items-center">
                <Languages className="mr-2 h-4 w-4" />
                Translate
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FileUploader onFileSelected={handleFileSelected} />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="source-language">Source Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger id="source-language" className="w-[180px]">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto-detect</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                          <SelectItem value="bn">Bengali</SelectItem>
                          <SelectItem value="ta">Tamil</SelectItem>
                          <SelectItem value="te">Telugu</SelectItem>
                          <SelectItem value="mr">Marathi</SelectItem>
                          <SelectItem value="gu">Gujarati</SelectItem>
                          <SelectItem value="kn">Kannada</SelectItem>
                          <SelectItem value="ml">Malayalam</SelectItem>
                          <SelectItem value="pa">Punjabi</SelectItem>
                          <SelectItem value="ur">Urdu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="document-name">Document Name</Label>
                      <Input
                        id="document-name"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        placeholder="Enter document name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="document-type">Document Type</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger id="document-type">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="historical">Historical Document</SelectItem>
                          <SelectItem value="manuscript">Manuscript</SelectItem>
                          <SelectItem value="letter">Letter</SelectItem>
                          <SelectItem value="certificate">Certificate</SelectItem>
                          <SelectItem value="legal">Legal Document</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <DocumentSettings settings={settings} onSettingsChange={setSettings} />

                    <Button onClick={handleUpload} disabled={!file || isProcessing} className="w-full">
                      Extract Text
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col space-y-4">
                  <div className="text-sm font-medium">Document Preview</div>
                  <DocumentPreview imageUrl={imageUrl} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium mb-4">Processing Mode</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div
                        className={`p-4 rounded-lg border cursor-pointer ${
                          settings.processingMode === "standard"
                            ? "bg-primary/10 border-primary"
                            : "bg-card border-border"
                        }`}
                        onClick={() => setSettings({ ...settings, processingMode: "standard" })}
                      >
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          <h4 className="font-medium">Standard Documents</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Best for printed documents, forms, and modern text
                        </p>
                      </div>

                      <div
                        className={`p-4 rounded-lg border cursor-pointer ${
                          settings.processingMode === "historical"
                            ? "bg-primary/10 border-primary"
                            : "bg-card border-border"
                        }`}
                        onClick={() => setSettings({ ...settings, processingMode: "historical" })}
                      >
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          <h4 className="font-medium">Historical Documents</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Optimized for handwritten and aged historical documents
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium mb-4">Image Enhancement</h3>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Pre-process image for better OCR results</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Applies contrast enhancement, deskewing, and noise reduction
                          </p>
                        </div>
                        <div className="ml-4">
                          <Label className="sr-only" htmlFor="image-enhancement">
                            Image Enhancement
                          </Label>
                          <input
                            type="checkbox"
                            id="image-enhancement"
                            checked={settings.enhanceImage}
                            onChange={(e) => setSettings({ ...settings, enhanceImage: e.target.checked })}
                            className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium mb-4">OCR Confidence Threshold</h3>
                    <div className="p-4 rounded-lg border bg-card">
                      <Slider
                        value={[settings.confidenceThreshold]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) => setSettings({ ...settings, confidenceThreshold: value[0] })}
                        className="mb-6"
                      />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Low accuracy, more text</span>
                        <span className="font-medium">{settings.confidenceThreshold}%</span>
                        <span className="text-muted-foreground">High accuracy, less text</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={() => setActiveTab("upload")}>Apply Settings</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="processing">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-10 space-y-6">
                    {isProcessing ? (
                      <ProcessingAnimation progress={processingProgress} />
                    ) : (
                      <>
                        <h2 className="text-xl font-semibold">Document Processing Complete</h2>
                        <Button onClick={() => setActiveTab("result")}>View Results</Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="result">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Extracted Text</h3>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveDocument}
                        disabled={isSaving || documentSaved || !user}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : documentSaved ? (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Document
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <Card className="h-[500px] flex flex-col">
                    <CardContent className="flex-1 p-4 overflow-auto">
                      <pre className="whitespace-pre-wrap font-mono text-sm">
                        {extractedText || "No text extracted yet."}
                      </pre>
                    </CardContent>
                    <div className="p-4 border-t flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Confidence: <span className="font-medium">92%</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadText(extractedText, documentName || "extracted-text")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Text
                      </Button>
                    </div>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Translation Options</h3>
                  <Card className="h-[500px] flex flex-col">
                    <CardContent className="flex-1 p-4">
                      <div className="space-y-4">
                        <p className="text-sm">
                          Translate the extracted text to make it accessible in different languages.
                        </p>

                        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                          <div className="space-y-2">
                            <Label htmlFor="target-language">Translate to</Label>
                            <Select value={translationLanguage} onValueChange={setTranslationLanguage}>
                              <SelectTrigger id="target-language">
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="hi">Hindi</SelectItem>
                                <SelectItem value="bn">Bengali</SelectItem>
                                <SelectItem value="ta">Tamil</SelectItem>
                                <SelectItem value="te">Telugu</SelectItem>
                                <SelectItem value="mr">Marathi</SelectItem>
                                <SelectItem value="gu">Gujarati</SelectItem>
                                <SelectItem value="kn">Kannada</SelectItem>
                                <SelectItem value="ml">Malayalam</SelectItem>
                                <SelectItem value="pa">Punjabi</SelectItem>
                                <SelectItem value="ur">Urdu</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            onClick={handleTranslate}
                            disabled={!extractedText || isTranslating}
                            className="w-full"
                          >
                            {isTranslating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Translating...
                              </>
                            ) : (
                              "Translate"
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="translate">
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="text-lg font-medium">Translate Document</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSaveDocument}
                      disabled={isSaving || documentSaved || !user || !translatedText}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : documentSaved ? (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Document
                        </>
                      )}
                    </Button>
                    <Select value={translationLanguage} onValueChange={setTranslationLanguage}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="bn">Bengali</SelectItem>
                        <SelectItem value="ta">Tamil</SelectItem>
                        <SelectItem value="te">Telugu</SelectItem>
                        <SelectItem value="mr">Marathi</SelectItem>
                        <SelectItem value="gu">Gujarati</SelectItem>
                        <SelectItem value="kn">Kannada</SelectItem>
                        <SelectItem value="ml">Malayalam</SelectItem>
                        <SelectItem value="pa">Punjabi</SelectItem>
                        <SelectItem value="ur">Urdu</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleTranslate} disabled={isTranslating}>
                      {isTranslating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Translating...
                        </>
                      ) : (
                        <>
                          <Languages className="h-4 w-4 mr-2" />
                          Translate
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="h-[400px] flex flex-col">
                    <CardContent className="flex-1 p-4 overflow-auto">
                      <h4 className="text-sm font-medium mb-2">Original</h4>
                      <pre className="whitespace-pre-wrap font-mono text-sm">
                        {extractedText || "No text extracted yet."}
                      </pre>
                    </CardContent>
                  </Card>

                  <Card className="h-[400px] flex flex-col">
                    <CardContent className="flex-1 p-4 overflow-auto">
                      <h4 className="text-sm font-medium mb-2">Translation</h4>
                      {translatedText ? (
                        <pre className="whitespace-pre-wrap font-mono text-sm">{translatedText}</pre>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          {isTranslating ? (
                            <div className="flex items-center">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Translating...
                            </div>
                          ) : (
                            "Click 'Translate' to see the translation"
                          )}
                        </div>
                      )}
                    </CardContent>
                    {translatedText && (
                      <div className="p-4 border-t flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadText(translatedText, `${documentName || "document"}-translated`)}
                          className="mr-2"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Text
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => downloadAsPDF(extractedText, translatedText, language, translationLanguage)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="items-center p-6 flex justify-between border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Powered by Google Cloud Vision OCR and Neural Machine Translation
          </p>
        </div>
      </div>
    </div>
  )
}

