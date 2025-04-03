"use server"

import { ObjectId } from "mongodb"
import clientPromise from "./mongodb"
import type { Document } from "./models/document"

// Save a new document
export async function saveDocumentAction(data: Document): Promise<string> {
  const client = await clientPromise
  const collection = client.db("ocr-app").collection("documents")

  const documentToInsert = {
    ...data,
    createdAt: new Date(),
  }

  const result = await collection.insertOne(documentToInsert)
  return result.insertedId.toString()
}

// Get all documents for a user
export async function getUserDocumentsAction(userId: string): Promise<any[]> {
  const client = await clientPromise
  const collection = client.db("ocr-app").collection("documents")

  const documents = await collection.find({ userId }).sort({ createdAt: -1 }).toArray()
  return documents.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
  }))
}

// Get a single document by ID
export async function getDocumentByIdAction(id: string): Promise<any | null> {
  const client = await clientPromise
  const collection = client.db("ocr-app").collection("documents")

  const document = await collection.findOne({ _id: new ObjectId(id) })
  if (!document) return null

  return {
    ...document,
    _id: document._id.toString(),
  }
}

// Update a document
export async function updateDocumentAction(id: string, data: Partial<Document>): Promise<boolean> {
  const client = await clientPromise
  const collection = client.db("ocr-app").collection("documents")

  const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: data })
  return result.modifiedCount === 1
}

// Delete a document
export async function deleteDocumentAction(id: string): Promise<boolean> {
  const client = await clientPromise
  const collection = client.db("ocr-app").collection("documents")

  const result = await collection.deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount === 1
}

