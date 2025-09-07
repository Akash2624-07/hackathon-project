// pages/api/upload/documents/[id].js
import { documents } from '../../upload.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Find document index
    const documentIndex = documents.findIndex(doc => doc.id === id);

    if (documentIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Remove document from array
    const deletedDocument = documents.splice(documentIndex, 1)[0];

    res.status(200).json({ 
      message: 'Document deleted successfully',
      document: {
        id: deletedDocument.id,
        title: deletedDocument.title
      }
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}