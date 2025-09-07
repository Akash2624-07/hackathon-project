// pages/index.js (minimal version for testing)
import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [test, setTest] = useState('App is working!');

  return (
    <>
      <Head>
        <title>RAG Q&A App - Test</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            RAG Q&A Assistant
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Status Check:</h2>
            <p className="text-green-600 font-medium">{test}</p>
            <button 
              onClick={() => setTest('Button clicked! React is working.')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test React
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Document Upload</h3>
              <p className="text-sm text-gray-600">Component will go here</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Chat Interface</h3>
              <p className="text-sm text-gray-600">Component will go here</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Answer History</h3>
              <p className="text-sm text-gray-600">Component will go here</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}