// pages/api/query.js
import { documents } from './upload.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (documents.length === 0) {
      return res.status(400).json({ 
        error: 'No documents uploaded. Please upload documents first.' 
      });
    }

    // Simple keyword-based search and answer generation
    const results = await searchDocuments(question, documents);
    const answer = await generateAnswer(question, results);

    res.status(200).json({
      answer: answer.text,
      sources: answer.sources,
      confidence: answer.confidence,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
}

// Simple document search function
async function searchDocuments(query, documents) {
  const queryWords = query.toLowerCase().split(/\s+/);
  
  const scoredDocuments = documents.map(doc => {
    const content = doc.content.toLowerCase();
    let score = 0;
    
    // Count keyword matches
    queryWords.forEach(word => {
      const matches = (content.match(new RegExp(word, 'g')) || []).length;
      score += matches;
    });
    
    // Find relevant passages (sentences containing query words)
    const sentences = doc.content.split(/[.!?]+/);
    const relevantPassages = sentences
      .filter(sentence => 
        queryWords.some(word => 
          sentence.toLowerCase().includes(word.toLowerCase())
        )
      )
      .slice(0, 3) // Take top 3 relevant sentences
      .map(passage => passage.trim())
      .filter(passage => passage.length > 10);

    return {
      document: doc,
      score,
      relevantPassages
    };
  });

  // Sort by relevance score and return top results
  return scoredDocuments
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 documents
}

// Simple answer generation function
async function generateAnswer(question, searchResults) {
  if (searchResults.length === 0) {
    return {
      text: "I couldn't find relevant information in the uploaded documents to answer your question.",
      sources: [],
      confidence: 0
    };
  }

  // Collect all relevant passages
  const allPassages = searchResults
    .flatMap(result => result.relevantPassages)
    .slice(0, 10); // Limit to top 10 passages

  let answer = '';
  const sources = [];

  if (allPassages.length === 0) {
    answer = `I found ${searchResults.length} relevant document(s) but couldn't extract specific passages that directly answer your question. The documents contain information related to your query, but may require more specific questions to get detailed answers.`;
  } else {
    // Create a basic answer by combining relevant passages
    answer = `Based on the uploaded documents, here's what I found:\n\n`;
    
    searchResults.slice(0, 3).forEach((result, index) => {
      if (result.relevantPassages.length > 0) {
        answer += `From "${result.document.title}":\n`;
        answer += result.relevantPassages[0] + '\n\n';
        
        sources.push({
          title: result.document.title,
          fileType: result.document.fileType,
          relevance: result.score,
          passage: result.relevantPassages[0].substring(0, 200) + '...'
        });
      }
    });
  }

  // Calculate confidence based on number of matches and passages found
  const confidence = Math.min(
    (searchResults.length * 0.2 + allPassages.length * 0.1) * 100,
    95
  );

  return {
    text: answer.trim(),
    sources,
    confidence: Math.round(confidence)
  };
}

// Advanced version using external AI API (commented out - requires API keys)
/*
async function generateAnswerWithAI(question, context) {
  try {
    // Example using OpenAI API (requires openai package and API key)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that answers questions based on provided document context. Only use information from the context provided.'
          },
          {
            role: 'user',
            content: `Context: ${context}\n\nQuestion: ${question}`
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI API error:', error);
    throw error;
  }
}
*/