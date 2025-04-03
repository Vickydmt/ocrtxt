"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { getUserDocumentsAction } from "@/lib/document-actions"
import { FileText, Search, Calendar, Upload, Loader2 } from "lucide-react"

interface Document {
  _id: string
  name: string
  type: string
  language: string
  createdAt: string
  pages: number
  confidence: number
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const docs = await getUserDocumentsAction(user.uid)
        setDocuments(docs)
        setFilteredDocuments(docs)
      } catch (error) {
        console.error("Error fetching documents:", error)
        toast({
          title: "Failed to load documents",
          description: "There was an error loading your documents",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [user, toast])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDocuments(documents)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = documents.filter(
        (doc) => doc.name.toLowerCase().includes(query) || doc.type.toLowerCase().includes(query),
      )
      setFilteredDocuments(filtered)
    }
  }, [searchQuery, documents])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-6">My Documents</h1>
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <p>Please log in to view your documents</p>
                <Button asChild>
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">My Documents</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search documents..."
                className="pl-8 w-full md:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href="/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload New
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="recent">Recently Added</TabsTrigger>
            <TabsTrigger value="historical">Historical</TabsTrigger>
            <TabsTrigger value="manuscripts">Manuscripts</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((doc) => (
                  <DocumentCard key={doc._id} document={doc} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No documents found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? "No documents match your search criteria" : "You haven't uploaded any documents yet"}
                </p>
                <Button asChild>
                  <Link href="/upload">Upload Your First Document</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 6)
                  .map((doc) => (
                    <DocumentCard key={doc._id} document={doc} />
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="historical">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments
                  .filter((doc) => doc.type === "historical")
                  .map((doc) => (
                    <DocumentCard key={doc._id} document={doc} />
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="manuscripts">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments
                  .filter((doc) => doc.type === "manuscript")
                  .map((doc) => (
                    <DocumentCard key={doc._id} document={doc} />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function DocumentCard({ document }: { document: Document }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="truncate">{document.name}</CardTitle>
        <CardDescription className="flex items-center">
          <Calendar className="h-3.5 w-3.5 mr-1" />
          {new Date(document.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium capitalize">{document.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Language:</span>
            <span className="font-medium">{getLanguageName(document.language)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pages:</span>
            <span className="font-medium">{document.pages}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">OCR Quality:</span>
            <span className="font-medium">{getQualityLabel(document.confidence)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/documents/${document._id}`}>View Document</Link>
        </Button>
      </CardFooter>
    </Card>
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

