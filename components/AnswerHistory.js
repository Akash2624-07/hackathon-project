// components/AnswerHistory.jsx
import { useState } from 'react';
import { History, ChevronDown, ChevronUp, FileText, Clock } from 'lucide-react';

export default function AnswerHistory({ chatHistory }) {
  const [expandedItems, setExpandedItems] = useState(new Set());

  // Filter to only show assistant responses (answers)
  const answers = chatHistory.filter(message => message.type === 'assistant');

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <History className="h-5 w-5 text-green-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Answer History</h3>
          <span className="ml-auto text-sm text-gray-500">({answers.length})</span>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {answers.length === 0 ? (
          <div className="text-center text-gray-500 mt-8 p-4">
            <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>No answers yet</p>
            <p className="text-sm mt-2">Ask questions to see your answer history</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {answers.map((answer, index) => {
              const isExpanded = expandedItems.has(index);
              const displayText = isExpanded 
                ? answer.content 
                : truncateText(answer.content);

              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* Answer Header */}
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">
                          Answer #{answers.length - index}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {answer.confidence && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {answer.confidence}% confident
                          </span>
                        )}
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(answer.timestamp).toLocaleDateString()} {new Date(answer.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Answer Content */}
                  <div className="p-3">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {displayText}
                    </p>

                    {/* Expand/Collapse Button */}
                    {answer.content.length > 150 && (
                      <button
                        onClick={() => toggleExpanded(index)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Show more
                          </>
                        )}
                      </button>
                    )}

                    {/* Sources */}
                    {answer.sources && answer.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center mb-2">
                          <span className="text-xs font-semibold text-gray-600">
                            Sources ({answer.sources.length}):
                          </span>
                        </div>
                        <div className="space-y-1">
                          {answer.sources.map((source, sourceIndex) => (
                            <div key={sourceIndex} className="flex items-center text-xs">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                              <span className="text-gray-600">
                                <span className="font-medium">{source.title}</span>
                                <span className="text-gray-500 ml-1">({source.fileType})</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {answers.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Total Answers: {answers.length}</span>
            <span>
              Avg Confidence: {
                Math.round(
                  answers
                    .filter(a => a.confidence)
                    .reduce((acc, a) => acc + a.confidence, 0) / 
                  answers.filter(a => a.confidence).length
                ) || 0
              }%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}