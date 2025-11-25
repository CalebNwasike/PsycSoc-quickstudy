'use client';

import { useState, useEffect } from 'react';

export default function QuizInterface({ terms }) {
  // Configuration states
  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]); // Array of selected tag1 values
  const [selectedSubcategories, setSelectedSubcategories] = useState([]); // Array of selected tag2 values
  const [useAllCategories, setUseAllCategories] = useState(false);
  
  // Quiz states
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Quiz stats
  const [quizStats, setQuizStats] = useState({
    correct: 0,
    wrong: 0,
    wrongByCategory: {},
    questionNumber: 0
  });
  
  // Track which terms have been shown
  const [shownTerms, setShownTerms] = useState(new Set());
  const [quizComplete, setQuizComplete] = useState(false);
  
  // Get all unique categories
  // Get all unique categories
const getAllCategories = () => {
    const cats = [...new Set(terms.map(t => t.tag1).filter(Boolean))];
    // Filter out "tag1" if it exists
    return cats.filter(cat => cat !== 'tag1' && cat !== 'tag2').sort();
  };
  // Get all unique subcategories (for selected categories or all)
  // Get all unique subcategories (for selected categories or all)
const getAllSubcategories = () => {
    const filtered = useAllCategories || selectedCategories.length === 0
      ? terms
      : terms.filter(t => selectedCategories.includes(t.tag1));
    const subs = [...new Set(filtered.map(t => t.tag2).filter(Boolean))];
    // Filter out "tag2" if it exists
    return subs.filter(sub => sub !== 'tag1' && sub !== 'tag2').sort();
  };
  // Filter terms based on configuration
  const filteredTerms = terms.filter(term => {
    // Exclude terms with "tag1" or "tag2" as actual category/subcategory values
    if (term.tag1 === 'tag1' || term.tag1 === 'tag2' || 
        term.tag2 === 'tag1' || term.tag2 === 'tag2') {
      return false;
    }
    
    if (useAllCategories) {
      // If "all categories" is selected, only filter by subcategories if any selected
      if (selectedSubcategories.length === 0) {
        return true; // All terms
      }
      // If term has no subcategory, exclude it when filtering by subcategories
      if (!term.tag2 || term.tag2.trim() === '') {
        return false;
      }
      return selectedSubcategories.includes(term.tag2);
    } else {
      // Filter by selected categories
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(term.tag1);
      
      // If no subcategories selected, include all terms from selected categories (even if they have no tag2)
      if (selectedSubcategories.length === 0) {
        return matchesCategory;
      }
      
      // If subcategories are selected, only include terms that:
      // 1. Match the category AND
      // 2. Either have a matching subcategory OR have no subcategory (for People/Theories)
      if (!term.tag2 || term.tag2.trim() === '') {
        // Terms with no subcategory (like People/Theories) should be included if their category matches
        return matchesCategory;
      }
      
      // Terms with subcategories must match both category and subcategory
      return matchesCategory && selectedSubcategories.includes(term.tag2);
    }
  });
  // Toggle category selection
  const toggleCategory = (category) => {
    if (useAllCategories) return; // Disabled when "all" is selected
    
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        // Remove category and clear its subcategories
        const newCats = prev.filter(c => c !== category);
        // Remove subcategories that belong to this category
        const categorySubs = terms
          .filter(t => t.tag1 === category)
          .map(t => t.tag2)
          .filter(Boolean);
        setSelectedSubcategories(prevSubs => 
          prevSubs.filter(sub => !categorySubs.includes(sub))
        );
        return newCats;
      } else {
        return [...prev, category];
      }
    });
  };
  
  // Toggle subcategory selection
  const toggleSubcategory = (subcategory) => {
    setSelectedSubcategories(prev => {
      if (prev.includes(subcategory)) {
        return prev.filter(s => s !== subcategory);
      } else {
        return [...prev, subcategory];
      }
    });
  };
  
  // Handle "All Categories" toggle
  const handleAllCategoriesToggle = (checked) => {
    setUseAllCategories(checked);
    if (checked) {
      setSelectedCategories([]);
    }
  };
  
  // Start quiz with current configuration
  const startQuiz = () => {
    if (filteredTerms.length === 0) {
      alert('Please select at least one category or subcategory to start the quiz.');
      return;
    }
    setQuizStarted(true);
    setShownTerms(new Set()); // Reset shown terms
    setQuizComplete(false); // Reset completion status
    generateQuestion();
  };
  
  // Reset quiz configuration
  const resetConfiguration = () => {
    setQuizStarted(false);
    setQuizStats({
      correct: 0,
      wrong: 0,
      wrongByCategory: {},
      questionNumber: 0
    });
    setShownTerms(new Set()); // Reset shown terms
    setQuizComplete(false); // Reset completion status
    setCurrentQuestion(null);
    setOptions([]);
    setSelectedAnswer(null);
    setShowResult(false);
  };
  
  // Find potential wrong answers for multiple choice
  const findWrongAnswers = (correctTerm) => {
    const isPeopleOrTheory = correctTerm.tag1 === 'People' || correctTerm.tag1 === 'Theories';
    
    let candidates;
    if (isPeopleOrTheory) {
      candidates = filteredTerms.filter(t => 
        t.tag1 === correctTerm.tag1 && t.term !== correctTerm.term
      );
    } else {
      candidates = filteredTerms.filter(t => 
        t.tag1 === correctTerm.tag1 && 
        t.tag2 === correctTerm.tag2 && 
        t.term !== correctTerm.term
      );
    }
    
    if (candidates.length < 3) {
      if (isPeopleOrTheory) {
        candidates = filteredTerms.filter(t => t.term !== correctTerm.term);
      } else {
        candidates = filteredTerms.filter(t => 
          t.tag1 === correctTerm.tag1 && t.term !== correctTerm.term
        );
      }
    }
    
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3).map(t => t.term);
  };
  
  // Generate a new question
  const generateQuestion = () => {
    if (filteredTerms.length === 0) return;
    
    // Check if all terms have been shown
    if (shownTerms.size >= filteredTerms.length) {
      setQuizComplete(true);
      return;
    }
    
    // Get terms that haven't been shown yet
    const availableTerms = filteredTerms.filter(term => !shownTerms.has(term.term));
    
    if (availableTerms.length === 0) {
      setQuizComplete(true);
      return;
    }
    
    // Pick random term from available (unshown) terms
    const randomIndex = Math.floor(Math.random() * availableTerms.length);
    const questionTerm = availableTerms[randomIndex];
    
    // Mark this term as shown
    setShownTerms(prev => new Set([...prev, questionTerm.term]));
    
    const wrongAnswers = findWrongAnswers(questionTerm);
    
    const allOptions = [
      questionTerm.term,
      ...wrongAnswers
    ];
    
    // Fisher-Yates shuffle
    const shuffled = [...allOptions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setCurrentQuestion(questionTerm);
    setOptions(shuffled);
    setSelectedAnswer(null);
    setShowResult(false);
  };
  
  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.term;
    setIsCorrect(correct);
    setShowResult(true);
    
    setQuizStats(prev => {
      const newStats = {
        ...prev,
        correct: correct ? prev.correct + 1 : prev.correct,
        wrong: correct ? prev.wrong : prev.wrong + 1,
        questionNumber: prev.questionNumber + 1
      };
      
      if (!correct) {
        const category = currentQuestion.tag1 || 'Other';
        const subcategory = currentQuestion.tag2 || 'Other';
        newStats.wrongByCategory = {
          ...prev.wrongByCategory,
          [category]: (prev.wrongByCategory[category] || 0) + 1,
          [subcategory]: (prev.wrongByCategory[subcategory] || 0) + 1,
        };
        
        const saved = JSON.parse(localStorage.getItem('mcatStats') || '{}');
        saved.wrong = {
          ...(saved.wrong || {}),
          [category]: ((saved.wrong || {})[category] || 0) + 1,
          [subcategory]: ((saved.wrong || {})[subcategory] || 0) + 1,
        };
        saved.total = (saved.total || 0) + 1;
        localStorage.setItem('mcatStats', JSON.stringify(saved));
      }
      
      // Check if quiz is complete after this answer
      if (shownTerms.size + 1 >= filteredTerms.length) {
        setQuizComplete(true);
      }
      
      return newStats;
    });
  };
  
  // Configuration Screen (shown before quiz starts)
  if (!quizStarted) {
    const availableCategories = getAllCategories();
    const availableSubcategories = getAllSubcategories();
    const termCount = filteredTerms.length;
    
    return (
      <div className="min-h-screen p-8 bg-zinc-50">
        <main className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Configure Your Quiz</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            {/* All Categories Option */}
            <div className="mb-6 pb-6 border-b">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAllCategories}
                  onChange={(e) => handleAllCategoriesToggle(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="ml-3 text-lg font-semibold">All Categories</span>
              </label>
              <p className="ml-8 text-sm text-gray-600 mt-1">
                Quiz will include terms from all categories
              </p>
            </div>
            
            {/* Category Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Select Categories:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableCategories.map(category => (
                  <label
                    key={category}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedCategories.includes(category)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${useAllCategories ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      disabled={useAllCategories}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="ml-2">{category}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Subcategory Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Select Subcategories (Optional):</h3>
              <p className="text-sm text-gray-600 mb-3">
                Leave empty to include all subcategories from selected categories
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {availableSubcategories.map(subcategory => (
                  <label
                    key={subcategory}
                    className={`flex items-center p-2 border-2 rounded-lg cursor-pointer transition-colors text-sm ${
                      selectedSubcategories.includes(subcategory)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubcategories.includes(subcategory)}
                      onChange={() => toggleSubcategory(subcategory)}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="ml-2">{subcategory}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Summary */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="font-semibold text-blue-900">
                Selected: {termCount} term{termCount !== 1 ? 's' : ''} will be included in the quiz
              </p>
            </div>
            
            {/* Start Quiz Button */}
            <button
              onClick={startQuiz}
              disabled={termCount === 0}
              className="w-full py-4 px-6 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Quiz ({termCount} terms)
            </button>
          </div>
        </main>
      </div>
    );
  }
  
  // Quiz Completion Screen
  if (quizComplete && quizStarted) {
    const totalAnswered = quizStats.correct + quizStats.wrong;
    const accuracy = totalAnswered > 0 
      ? Math.round((quizStats.correct / totalAnswered) * 100) 
      : 0;
    const wrongCount = quizStats.wrong;
    const correctCount = quizStats.correct;
    
    return (
      <div className="min-h-screen p-8 bg-zinc-50">
        <main className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-green-600">Quiz Complete! 🎉</h1>
            <p className="text-xl text-gray-600 mb-8">You've answered all {filteredTerms.length} terms!</p>
            
            {/* Score Display */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-6">
              <div className="text-6xl font-bold text-blue-600 mb-2">{accuracy}%</div>
              <p className="text-lg text-gray-700">Overall Score</p>
            </div>
            
            {/* Detailed Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600 mb-1">{correctCount}</div>
                <p className="text-sm text-gray-600">Correct</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-red-600 mb-1">{wrongCount}</div>
                <p className="text-sm text-gray-600">Incorrect</p>
              </div>
            </div>
            
            {/* Wrong by Category (if any) */}
            {Object.keys(quizStats.wrongByCategory).length > 0 && (
              <div className="mb-6 text-left">
                <h3 className="text-lg font-semibold mb-3">Areas to Review:</h3>
                <div className="space-y-2">
                  {Object.entries(quizStats.wrongByCategory)
                    .sort(([_, a], [__, b]) => b - a)
                    .slice(0, 5)
                    .map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm text-red-600 font-semibold">{count} wrong</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetConfiguration}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start New Quiz
              </button>
              <button
                onClick={() => {
                  setQuizComplete(false);
                  setShownTerms(new Set());
                  setQuizStats({
                    correct: 0,
                    wrong: 0,
                    wrongByCategory: {},
                    questionNumber: 0
                  });
                  generateQuestion();
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Retake Same Quiz
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // Quiz Interface (shown after configuration)
  if (filteredTerms.length === 0) {
    return (
      <div className="min-h-screen p-8 bg-zinc-50">
        <main className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">MCAT Quiz Mode</h1>
          <p className="text-lg">No terms match your selection.</p>
          <button
            onClick={resetConfiguration}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Change Configuration
          </button>
        </main>
      </div>
    );
  }
  
  if (!currentQuestion) {
    return <div>Loading...</div>;
  }
  
  const totalAnswered = quizStats.correct + quizStats.wrong;
  const accuracy = totalAnswered > 0 
    ? Math.round((quizStats.correct / totalAnswered) * 100) 
    : 0;
  
  return (
    <div className="min-h-screen p-8 bg-zinc-50">
      <main className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">MCAT Quiz Mode</h1>
          <button
            onClick={resetConfiguration}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Change Settings
          </button>
        </div>
        
        {/* Quiz Stats */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Questions: {quizStats.questionNumber}</p>
              <p className="text-sm text-gray-600">
                Score: {quizStats.correct} / {totalAnswered} ({accuracy}%)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Terms in quiz: {filteredTerms.length}
              </p>
            </div>
            {Object.keys(quizStats.wrongByCategory).length > 0 && (
              <div className="text-right">
                <p className="text-xs font-semibold mb-1">Wrong by Category:</p>
                {Object.entries(quizStats.wrongByCategory)
                  .sort(([_, a], [__, b]) => b - a)
                  .slice(0, 3)
                  .map(([category, count]) => (
                    <p key={category} className="text-xs text-red-600">
                      {category}: {count}
                    </p>
                  ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {/* Category Tags */}
          <div className="flex gap-2 mb-4">
            {currentQuestion.tag1 && (
              <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                {currentQuestion.tag1}
              </span>
            )}
            {currentQuestion.tag2 && (
              <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                {currentQuestion.tag2}
              </span>
            )}
          </div>
          
          {/* Question (Definition) */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">Question:</p>
            <p className="text-xl font-medium text-gray-800">{currentQuestion.definition}</p>
          </div>
          
          {/* Multiple Choice Options */}
          <div className="space-y-3 mb-6">
            {options.map((option, index) => {
              let buttonClass = "w-full p-4 text-left border-2 rounded-lg transition-colors ";
              
              if (showResult) {
                if (option === currentQuestion.term) {
                  buttonClass += "bg-green-100 border-green-500 text-green-800";
                } else if (option === selectedAnswer && option !== currentQuestion.term) {
                  buttonClass += "bg-red-100 border-red-500 text-red-800";
                } else {
                  buttonClass += "bg-gray-50 border-gray-300 text-gray-600";
                }
              } else {
                buttonClass += selectedAnswer === option
                  ? "bg-blue-100 border-blue-500 text-blue-800"
                  : "bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50";
              }
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              );
            })}
          </div>
          
          {/* Result Message */}
          {showResult && (
            <div className={`p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              {!isCorrect && (
                <p className="text-sm text-red-700 mt-1">
                  The correct answer is: <strong>{currentQuestion.term}</strong>
                </p>
              )}
            </div>
          )}
          
          {/* Next Question Button */}
          {showResult && (
            <button
              onClick={() => {
                if (shownTerms.size + 1 >= filteredTerms.length) {
                  // This was the last question, completion will be handled
                  generateQuestion();
                } else {
                  generateQuestion();
                }
              }}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {shownTerms.size + 1 >= filteredTerms.length ? 'Finish Quiz' : 'Next Question →'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}