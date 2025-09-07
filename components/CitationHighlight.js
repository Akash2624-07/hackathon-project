import { useState } from 'react';

export default function CitationHighlight({ content, sources }) {
  const [activeSource, setActiveSource] = useState(null);

  if (!content) return null;

  // If no sources, just return the content formatted
  if (!sources || sources.length === 0) {
    return (
      <div className="whitespace-pre-wrap break-words">
        {content.split('\n').map((line, index) => (
          <p key={index} className="mb-2 last:mb-0">
            {line}
          </p>
        ))}
      </div>
    );
  }

  // Process content to highlight citations
  let processedContent = content;
  const citationMap = new Map();

  // Create a map of citations for quick lookup
  sources.forEach((source) => {
    const pattern = new RegExp(`\\[Source ${source.id}\\]`, 'g');
    citationMap.set(source.id, source);
  });

  // Split content by citation patterns and process
  const parts = processedContent.split(/(\[Source \d+\])/g);

  const handleCitationClick = (sourceId, event) => {
    event.preventDefault();
    const source = citationMap.get(parseInt(sourceId));
    if (source) {
      const message = `Source: ${source.title}\n\nRelevance: ${(source.similarity * 100).toFixed(0)}%\n\n${source.text}`;
      
      // For better UX, you could show a modal instead of alert
      alert(message);
      
      // Optional: Track which citation was clicked
      setActiveSource(sourceId);
      setTimeout(() => setActiveSource(null), 2000);
    }
  };

  return (
    <div className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        // Check if this part is a citation
        const citationMatch = part.match(/\[Source (\d+)\]/);
        
        if (citationMatch) {
          const sourceId = parseInt(citationMatch[1]);
          const source = citationMap.get(sourceId);
          
          if (source) {
            return (
              <button
                key={index}
                onClick={(e) => handleCitationClick(sourceId, e)}
                className={`citation-highlight mx-1 ${
                  activeSource === sourceId ? 'bg-blue-300 scale-110' : ''
                }`}
                title={`Click to view: ${source.title}`}
              >
                [Source {sourceId}]
              </button>
            );
          }
        }
        
        // Regular content - split by newlines for proper formatting
        return part.split('\n').map((line, lineIndex) => (
          <span key={`${index}-${lineIndex}`}>
            {line}
            {lineIndex < part.split('\n').length - 1 && <br />}
          </span>
        ));
      })}
    </div>
  );
}