// pages/api/upload.js
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// In-memory storage for demo (use database in production)
let documents = [];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const contentType = req.headers['content-type'];

    // Handle URL uploads
    if (contentType?.includes('application/json')) {
      const body = await parseJsonBody(req);
      
      if (body.fileType === 'url') {
        const urlContent = await fetchUrlContent(body.url);
        const document = {
          id: uuidv4(),
          title: urlContent.title || new URL(body.url).hostname,
          content: urlContent.content,
          fileType: 'url',
          url: body.url,
          timestamp: new Date().toISOString()
        };
        
        documents.push(document);
        return res.status(200).json(document);
      }
    }

    // Handle file uploads
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'uploads'),
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.document) ? files.document[0] : files.document;
    const fileType = Array.isArray(fields.fileType) ? fields.fileType[0] : fields.fileType;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read and process file content
    let content = '';
    const filePath = file.filepath;
    
    try {
      if (fileType === 'pdf') {
        // For PDF files - you'd need to install pdf-parse: npm install pdf-parse
        // content = await extractPdfText(filePath);
        content = 'PDF content extraction not implemented yet. Install pdf-parse package.';
      } else {
        // For text files (markdown, html)
        content = fs.readFileSync(filePath, 'utf-8');
      }

      const document = {
        id: uuidv4(),
        title: file.originalFilename || 'Untitled Document',
        content: content,
        fileType: fileType,
        originalName: file.originalFilename,
        size: file.size,
        timestamp: new Date().toISOString()
      };

      documents.push(document);

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.status(200).json(document);
    } catch (error) {
      console.error('File processing error:', error);
      // Clean up file if processing failed
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.status(500).json({ error: 'Failed to process file' });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}

// Helper function to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Helper function to fetch URL content
async function fetchUrlContent(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Simple HTML text extraction (you might want to use cheerio for better parsing)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;

    return {
      title,
      content: textContent
    };
  } catch (error) {
    throw new Error(`Failed to fetch URL: ${error.message}`);
  }
}

// Export documents array for other API routes
export { documents };