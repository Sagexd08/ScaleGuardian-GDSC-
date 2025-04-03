import React, { useState } from 'react';
import { useAI } from '../hooks/useAI';

const ReportModal = ({ isOpen, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('hate_speech');
  const [details, setDetails] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  
  const { analyzeContent } = useAI();

  const categories = [
    { id: 'hate_speech', label: 'Hate Speech' },
    { id: 'harassment', label: 'Harassment' },
    { id: 'violence', label: 'Violence' },
    { id: 'misinformation', label: 'Misinformation' },
    { id: 'other', label: 'Other' }
  ];

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeContent(content);
      setAiAnalysis(analysis);
      setCategory(analysis.recommendedCategory);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      content,
      category,
      details,
      aiAnalysis
    });
    resetForm();
  };

  const resetForm = () => {
    setContent('');
    setCategory('hate_speech');
    setDetails('');
    setAiAnalysis(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Report Content</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Input */}
          <div>
            <label className="block text-gray-700 mb-2">Content to Report</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border rounded-lg p-2 min-h-[100px]"
              placeholder="Paste or type the content you want to report..."
              required
            />
          </div>

          {/* AI Analysis Button */}
          <div>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !content.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Analyzing...
                </>
              ) : (
                <>
                  <i className="fas fa-robot mr-2"></i>
                  Analyze with AI
                </>
              )}
            </button>
          </div>

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-800">AI Analysis Results</h3>
              
              {/* Overall Assessment */}
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  aiAnalysis.severity === 'high' ? 'bg-red-100 text-red-800' :
                  aiAnalysis.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {aiAnalysis.severity === 'high' ? 'High Severity' :
                   aiAnalysis.severity === 'medium' ? 'Medium Severity' :
                   'Low Severity'}
                </span>
                <span className="text-gray-600">
                  Confidence: {Math.round(aiAnalysis.confidence * 100)}%
                </span>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-2">
                {Object.entries(aiAnalysis.categories).map(([cat, score]) => (
                  <div key={cat} className="flex justify-between items-center">
                    <span className="text-gray-700 capitalize">
                      {cat.replace('_', ' ')}
                    </span>
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 rounded-full h-2"
                        style={{ width: `${Math.round(score * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {Math.round(score * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label className="block text-gray-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-lg p-2"
              required
            >
              {categories.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Details */}
          <div>
            <label className="block text-gray-700 mb-2">
              Additional Details
              <span className="text-gray-500 text-sm ml-2">(Optional)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full border rounded-lg p-2 min-h-[80px]"
              placeholder="Provide any additional context or details about this report..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;