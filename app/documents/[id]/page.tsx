"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { getDocumentByIdAction } from "@/lib/document-actions"
import { translateText } from "@/lib/translate"
import { downloadAsPDF } from "@/lib/pdf-utils"
import { ArrowLeft, Download, Languages, Loader2 } from "lucide-react"
import Link from "next/link"

interface Document {
  _id: string
  name: string
  type: string
  language: string
  content: string
  translatedContent?: string
  translationLanguage?: string
  pages: number
  confidence: number
  createdAt: string
  userId: string
}

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [translatedText, setTranslatedText] = useState("")
  const [targetLanguage, setTargetLanguage] = useState("en")
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    const fetchDocument = async () => {
      if (!params.id) return

      try {
        const doc = await getDocumentByIdAction(params.id as string)
        if (!doc) {
          toast({
            title: "Document not found",
            description: "The requested document could not be found",
            variant: "destructive",
          })
          router.push("/documents")
          return
        }

        // Check if user has access to this document
        if (user && doc.userId !== user.uid) {
          toast({
            title: "Access denied",
            description: "You don't have permission to view this document",
            variant: "destructive",
          })
          router.push("/documents")
          return
        }

        setDocument(doc)

        // If document has translated content, set it
        if (doc.translatedContent) {
          setTranslatedText(doc.translatedContent)
          setTargetLanguage(doc.translationLanguage || "en")
        }
      } catch (error) {
        console.error("Error fetching document:", error)
        toast({
          title: "Failed to load document",
          description: "There was an error loading the document",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchDocument()
    } else {
      setIsLoading(false)
    }
  }, [params.id, router, toast, user])

  const handleTranslate = async () => {
    if (!document) return

    try {
      setIsTranslating(true)
      const translated = await translateText(document.content, targetLanguage, document.language)
      setTranslatedText(translated)
    } catch (error) {
      console.error("Translation error:", error)
      toast({
        title: "Translation failed",
        description: "There was an error translating the document",
        variant: "destructive",
      })
    } finally {
      setIsTranslating(false)
    }
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="mb-6">Please login to view document details</p>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Document Not Found</h2>
          <p className="mb-6">The document you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button asChild>
            <Link href="/documents">Back to Documents</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" asChild className="mr-4">
            <Link href="/documents">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{document.name}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Document Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="capitalize">{document.type}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Language</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{getLanguageName(document.language)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">OCR Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{getQualityLabel(document.confidence)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{document.pages}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="text">Extracted Text</TabsTrigger>
            <TabsTrigger value="translate">Translate</TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Extracted Text</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => downloadText(document.content, document.name)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea value={document.content} readOnly className="min-h-[400px] font-mono text-sm" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="translate">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle>Translate Document</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
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
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Original ({getLanguageName(document.language)})</h3>
                    <Textarea value={document.content} readOnly className="min-h-[400px] font-mono text-sm" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Translation ({getLanguageName(targetLanguage)})</h3>
                    <Textarea
                      value={translatedText}
                      readOnly
                      className="min-h-[400px] font-mono text-sm"
                      placeholder={isTranslating ? "Translating..." : "Click 'Translate' to see the translation"}
                    />
                  </div>
                </div>

                {translatedText && (
                  <div className="flex justify-end mt-4 space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => downloadText(translatedText, `${document.name}-translated`)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Text
                    </Button>
                    <Button
                      onClick={() => downloadAsPDF(document.content, translatedText, document.language, targetLanguage)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
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

function getQualityLabel(confidence: number): string {
  if (confidence >= 90) return "High (90%+)"
  if (confidence >= 70) return "Medium (70-89%)"
  return "Low (<70%)"
}

