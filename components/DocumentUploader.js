import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Globe, X, CheckCircle } from 'lucide-react';
import api from '../lib/api';

export default function DocumentUploader({ onUpload, documents, onRefresh }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md'],
      'text/html': ['.html']
    },
    multiple: false,
    onDrop: handleFileUpload
  });

  async function handleFileUpload(files) {
    if (files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadStatus('Processing document...');

    try {
      const formData = new FormData();
      formData.append('document', file);
      
      // Determine file type
      const fileType = file.type === 'application/pdf' ? 'pdf' :
                      file.name.endsWith('.md') ? 'markdown' : 'html';
      
      formData.append('fileType', fileType);

      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadStatus('✅ Document uploaded successfully!');
      onUpload(response.data);
      setTimeout(() => setUploadStatus(''), 3000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('❌ Upload failed. Please try again.');
      setTimeout(() => setUploadStatus(''), 3000);
    } finally {
      setIsUploading(false);
    }
  }

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;

    setIsUploading(true);
    setUploadStatus('Fetching content from URL...');

    try {
      const response = await api.post('/upload', {
        fileType: 'url',
        url: urlInput.trim()
      });

      setUploadStatus('✅ URL content processed successfully!');
      setUrlInput('');
      onUpload(response.data);
      setTimeout(() => setUploadStatus(''), 3000);

    } catch (error) {
      console.error('URL upload error:', error);
      setUploadStatus('❌ Failed to process URL. Please check the URL and try again.');
      setTimeout(() => setUploadStatus(''), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (docId) => {
    try {
      await api.delete(`/upload/documents/${docId}`);
      onRefresh();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Upload Documents
        </h2>
      </div>

      {/* File Upload Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg text-gray-600 mb-2">
          {isDragActive
            ? 'Drop the file here...'
            : 'Drag & drop a file here, or click to select'}
        </p>
        <p className="text-sm text-gray-500">
          PDF, Markdown, HTML
        </p>
      </div>

      {/* URL Input */}
      <div className="mt-6">
        <div className="flex items-center mb-3">
          <Globe className="h-5 w-5 text-gray-500 mr-2" />
          <span className="text-sm font-medium text-gray-700">
            Or enter a URL
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/article"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          />
          <button
            onClick={handleUrlUpload}
            disabled={!urlInput.trim() || isUploading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>

      {/* Upload Status */}
      {uploadStatus && (
        <div className="mt-4 p-3 rounded-lg bg-gray-50 text-sm text-gray-700">
          {uploadStatus}
        </div>
      )}

      {/* Loading Indicator */}
      {isUploading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Documents List */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Uploaded Documents ({documents.length})
        </h3>
        <div className="space-y-2">
          {documents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No documents uploaded yet
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <File className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-800">
                        {doc.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {doc.fileType} • {new Date(doc.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
