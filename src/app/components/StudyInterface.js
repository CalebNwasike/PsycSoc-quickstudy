'use client';

import { useState, useEffect } from 'react';

export default function StudyInterface({ terms }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  
  // Filter states
  const [mainFilter, setMainFilter] = useState('all'); // 'all', 'Psychology', 'Sociology'
  const [subFilter, setSubFilter] = useState('all'); // 'all', 'Neuroscience', 'Learning', etc.
  const [subsectionFilter, setSubsectionFilter] = useState('all'); // 'all', 'Cognition, language & intelligence', etc.
  
  // Stats tracking
  const [stats, setStats] = useState({
    wrong: {}, // { 'Psychology': 5, 'Neuroscience': 2, etc. }
    total: 0
  });
  
  // Get unique subcategories for current main filter
  const getSubcategories = () => {
    const filtered = mainFilter === 'all' 
      ? terms 
      : terms.filter(t => t.tag1 === mainFilter);
    const subs = [...new Set(filtered.map(t => t.tag2).filter(Boolean))];
    // Filter out "tag1" and "tag2" if they exist
    return subs.filter(sub => sub !== 'tag1' && sub !== 'tag2').sort();
  };
  
  // Get unique subsections for current main filter and subcategory
  const getSubsections = () => {
    let filtered = terms;
    if (mainFilter !== 'all') {
      filtered = filtered.filter(t => t.tag1 === mainFilter);
    }
    if (subFilter !== 'all') {
      filtered = filtered.filter(t => t.tag2 === subFilter);
    }
    const subsections = [...new Set(filtered.map(t => t.subsection).filter(Boolean))];
    return subsections.sort();
  };
  // Filter terms based on selected filters
  const filteredTerms = terms.filter(term => {
    // Exclude terms with "tag1" or "tag2" as actual category/subcategory values
    if (term.tag1 === 'tag1' || term.tag1 === 'tag2' || 
        term.tag2 === 'tag1' || term.tag2 === 'tag2') {
      return false;
    }
    
    const matchesMain = mainFilter === 'all' || term.tag1 === mainFilter;
    const matchesSub = subFilter === 'all' || term.tag2 === subFilter;
    const matchesSubsection = subsectionFilter === 'all' || term.subsection === subsectionFilter;
    return matchesMain && matchesSub && matchesSubsection;
  });
  
  // Reset to first term when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setShowDefinition(false);
  }, [mainFilter, subFilter, subsectionFilter]);
  
  // Reset subsection filter when main or sub filter changes
  useEffect(() => {
    setSubsectionFilter('all');
  }, [mainFilter, subFilter]);
  
  const currentTerm = filteredTerms[currentIndex];
  const progress = filteredTerms.length > 0 
    ? `${currentIndex + 1} of ${filteredTerms.length}` 
    : '0 of 0';
  
  const handleNext = () => {
    if (currentIndex < filteredTerms.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowDefinition(false);
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowDefinition(false);
    }
  };
  
  // Track wrong answer (for future quiz mode)
  const markWrong = () => {
    const category = currentTerm.tag1 || 'Other';
    const subcategory = currentTerm.tag2 || 'Other';
    
    setStats(prev => ({
      wrong: {
        ...prev.wrong,
        [category]: (prev.wrong[category] || 0) + 1,
        [subcategory]: (prev.wrong[subcategory] || 0) + 1,
      },
      total: prev.total + 1
    }));
    
    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem('mcatStats') || '{}');
    saved.wrong = {
      ...(saved.wrong || {}),
      [category]: ((saved.wrong || {})[category] || 0) + 1,
      [subcategory]: ((saved.wrong || {})[subcategory] || 0) + 1,
    };
    saved.total = (saved.total || 0) + 1;
    localStorage.setItem('mcatStats', JSON.stringify(saved));
  };
  
  // Load stats from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mcatStats');
    if (saved) {
      setStats(JSON.parse(saved));
    }
  }, []);
  
  if (filteredTerms.length === 0) {
    return (
      <div className="min-h-screen p-8 bg-zinc-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">MCAT Psychology & Sociology Study App</h1>
          <p className="text-lg">No terms match your filters. Try adjusting your selection.</p>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-8 bg-zinc-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">MCAT Psychology & Sociology Study App</h1>
        
        {/* Filter Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Main Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={mainFilter}
                onChange={(e) => setMainFilter(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="all">All Categories</option>
                <option value="Psychology">Psychology</option>
                <option value="Sociology">Sociology</option>
                <option value="People">People</option>
                <option value="Theories">Theories</option>
              </select>
            </div>
            
            {/* Subcategory Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Subcategory</label>
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="w-full p-2 border dark:border-gray-700 rounded-lg dark:bg-gray-700 dark:text-gray-200"
                disabled={mainFilter === 'all'}
              >
                <option value="all">All Subcategories</option>
                {getSubcategories().map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            
            {/* Subsection Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Subsection</label>
              <select
                value={subsectionFilter}
                onChange={(e) => setSubsectionFilter(e.target.value)}
                className="w-full p-2 border rounded-lg"
                disabled={mainFilter === 'all' || subFilter === 'all'}
              >
                <option value="all">All Subsections</option>
                {getSubsections().map(subsection => (
                  <option key={subsection} value={subsection}>{subsection}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Stats Display */}
          {stats.total > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <p className="text-sm font-semibold mb-2 dark:text-gray-200">Your Stats:</p>
              <div className="text-xs space-y-1 dark:text-gray-300">
                <p>Total wrong: {stats.total}</p>
                {Object.entries(stats.wrong)
                  .filter(([_, count]) => count > 0)
                  .sort(([_, a], [__, b]) => b - a)
                  .slice(0, 5)
                  .map(([category, count]) => (
                    <p key={category}>{category}: {count} wrong</p>
                  ))}
              </div>
            </div>
          )}
        </div>
        
        <p className="text-lg text-gray-900 dark:text-gray-100 mb-6">Progress: {progress}</p>
        
        {/* Study Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6 min-h-[400px] flex flex-col">
          {/* Category Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {currentTerm.tag1 && (
              <span className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                {currentTerm.tag1}
              </span>
            )}
            {currentTerm.tag2 && (
              <span className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full">
                {currentTerm.tag2}
              </span>
            )}
            {currentTerm.subsection && (
              <span className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full">
                {currentTerm.subsection}
              </span>
            )}
          </div>
          
          {/* Term */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-6 text-center dark:text-gray-100">{currentTerm.term}</h2>
            
            {/* Definition (shown/hidden) */}
            {showDefinition && (
              <div className="mt-6 p-4 bg-zinc-100 dark:bg-gray-700 rounded-lg">
                <p className="text-lg text-gray-900 dark:text-gray-100">{currentTerm.definition}</p>
              </div>
            )}
          </div>
          
          {/* Show/Hide Definition Button */}
          <button
            onClick={() => setShowDefinition(!showDefinition)}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4"
          >
            {showDefinition ? 'Hide Definition' : 'Show Definition'}
          </button>
          
          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === filteredTerms.length - 1}
              className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${filteredTerms.length > 0 ? ((currentIndex + 1) / filteredTerms.length) * 100 : 0}%` }}
          ></div>
        </div>
      </main>
    </div>
  );
}