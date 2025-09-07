// pages/api/upload/documents.js
import { documents } from '../upload.js';

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        // Get all documents
        res.status(200).json({
          documents: documents.map(doc => ({
            id: doc.id,
            title: doc.title,
            fileType: doc.fileType,
            timestamp: doc.timestamp,
            size: doc.size || null,
            url: doc.url || null
          }))
        });
        break;

      case 'DELETE':
        // This endpoint handles individual document deletion
        // The actual route will be /api/upload/documents/[id].js
        res.status(405).json({ error: 'Use DELETE /api/upload/documents/[id] instead' });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Documents API error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}