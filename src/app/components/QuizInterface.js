'use client';

import { useState, useEffect } from 'react';

export default function QuizInterface({ terms }) {
  // Configuration states
  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]); // Array of selected tag1 values
  const [selectedSubcategories, setSelectedSubcategories] = useState([]); // Array of selected tag2 values
  const [selectedSubsections, setSelectedSubsections] = useState([]); // Array of selected subsection values
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
  
  // Track wrong answer terms (for retake feature)
  const [wrongAnswerTerms, setWrongAnswerTerms] = useState(new Set());
  
  // Quiz mode states
  const [inverseMode, setInverseMode] = useState(false); // false = definition as question, true = term as question
  const [retakeWrongMode, setRetakeWrongMode] = useState(false); // true when retaking wrong answers
  
  // Get all unique categories
  // Get all unique categories
const getAllCategories = () => {
    const cats = [...new Set(terms.map(t => t.tag1).filter(Boolean))];
    // Filter out "tag1" if it exists
    return cats.filter(cat => cat !== 'tag1' && cat !== 'tag2').sort();
  };
  // Get all unique subcategories (for selected categories or all)
  const getAllSubcategories = () => {
    const filtered = useAllCategories || selectedCategories.length === 0
      ? terms
      : terms.filter(t => selectedCategories.includes(t.tag1));
    const subs = [...new Set(filtered.map(t => t.tag2).filter(Boolean))];
    // Filter out "tag2" if it exists
    return subs.filter(sub => sub !== 'tag1' && sub !== 'tag2').sort();
  };
  
  // Get all unique subsections (for selected categories and subcategories)
  const getAllSubsections = () => {
    let filtered = terms;
    if (!useAllCategories && selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(t.tag1));
    }
    if (selectedSubcategories.length > 0) {
      filtered = filtered.filter(t => selectedSubcategories.includes(t.tag2));
    }
    const subsections = [...new Set(filtered.map(t => t.subsection).filter(Boolean))];
    return subsections.sort();
  };
  // Get terms to use for quiz (either all filtered terms or just wrong answers)
  const getQuizTerms = () => {
    if (retakeWrongMode && wrongAnswerTerms.size > 0) {
      // Return only terms that were answered incorrectly
      return filteredTerms.filter(term => wrongAnswerTerms.has(term.term));
    }
    return filteredTerms;
  };
  
  // Filter terms based on configuration
  const filteredTerms = terms.filter(term => {
    // Exclude terms with "tag1" or "tag2" as actual category/subcategory values
    if (term.tag1 === 'tag1' || term.tag1 === 'tag2' || 
        term.tag2 === 'tag1' || term.tag2 === 'tag2') {
      return false;
    }
    
    if (useAllCategories) {
      // If "all categories" is selected
      if (selectedSubcategories.length === 0 && selectedSubsections.length === 0) {
        return true; // All terms
      }
      
      // Filter by subcategories if selected
      if (selectedSubcategories.length > 0) {
        if (!term.tag2 || term.tag2.trim() === '') {
          return false;
        }
        if (!selectedSubcategories.includes(term.tag2)) {
          return false;
        }
      }
      
      // Filter by subsections if selected
      if (selectedSubsections.length > 0) {
        if (!term.subsection || term.subsection.trim() === '') {
          return false;
        }
        if (!selectedSubsections.includes(term.subsection)) {
          return false;
        }
      }
      
      return true;
    } else {
      // Filter by selected categories
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(term.tag1);
      if (!matchesCategory) return false;
      
      // Filter by subcategories if selected
      if (selectedSubcategories.length > 0) {
        if (!term.tag2 || term.tag2.trim() === '') {
          // Terms with no subcategory (like People/Theories) should be included if their category matches
          // But only if no subsections are selected (since they won't have subsections either)
          if (selectedSubsections.length === 0) {
            return true;
          }
          return false;
        }
        if (!selectedSubcategories.includes(term.tag2)) {
          return false;
        }
      }
      
      // Filter by subsections if selected
      if (selectedSubsections.length > 0) {
        if (!term.subsection || term.subsection.trim() === '') {
          return false;
        }
        if (!selectedSubsections.includes(term.subsection)) {
          return false;
        }
      }
      
      return true;
    }
  });
  // Toggle category selection
  const toggleCategory = (category) => {
    if (useAllCategories) return; // Disabled when "all" is selected
    
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        // Remove category and clear its subcategories and subsections
        const newCats = prev.filter(c => c !== category);
        // Remove subcategories that belong to this category
        const categorySubs = terms
          .filter(t => t.tag1 === category)
          .map(t => t.tag2)
          .filter(Boolean);
        setSelectedSubcategories(prevSubs => 
          prevSubs.filter(sub => !categorySubs.includes(sub))
        );
        // Remove subsections that belong to this category
        const categorySubsections = terms
          .filter(t => t.tag1 === category)
          .map(t => t.subsection)
          .filter(Boolean);
        setSelectedSubsections(prevSubsections =>
          prevSubsections.filter(subsection => !categorySubsections.includes(subsection))
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
        // Remove subcategory and clear its subsections
        const newSubs = prev.filter(s => s !== subcategory);
        // Remove subsections that belong to this subcategory
        const subcategorySubsections = terms
          .filter(t => t.tag2 === subcategory)
          .map(t => t.subsection)
          .filter(Boolean);
        setSelectedSubsections(prevSubsections =>
          prevSubsections.filter(subsection => !subcategorySubsections.includes(subsection))
        );
        return newSubs;
      } else {
        return [...prev, subcategory];
      }
    });
  };
  
  // Toggle subsection selection
  const toggleSubsection = (subsection) => {
    setSelectedSubsections(prev => {
      if (prev.includes(subsection)) {
        return prev.filter(s => s !== subsection);
      } else {
        return [...prev, subsection];
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
    const quizTerms = getQuizTerms();
    if (quizTerms.length === 0) {
      alert('Please select at least one category or subcategory to start the quiz.');
      return;
    }
    setQuizStarted(true);
    setRetakeWrongMode(false);
    setShownTerms(new Set()); // Reset shown terms
    setQuizComplete(false); // Reset completion status
    generateQuestion();
  };
  
  // Start retake wrong answers quiz
  const startRetakeWrong = () => {
    if (wrongAnswerTerms.size === 0) return;
    
    setQuizStarted(true);
    setRetakeWrongMode(true);
    setShownTerms(new Set()); // Reset shown terms
    setQuizComplete(false); // Reset completion status
    setQuizStats({
      correct: 0,
      wrong: 0,
      wrongByCategory: {},
      questionNumber: 0
    });
    generateQuestion();
  };
  
  // Reset quiz configuration
  const resetConfiguration = () => {
    setQuizStarted(false);
    setRetakeWrongMode(false);
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
    // Note: Don't reset selectedCategories/Subcategories/Subsections - let user keep their selection
    // Note: Don't reset wrongAnswerTerms - keep them for retake feature
  };
  
  // Find potential wrong answers for multiple choice
  const findWrongAnswers = (correctTerm, isInverse = false) => {
    const quizTerms = getQuizTerms();
    
    if (isInverse) {
      // Inverse mode: term is question, definitions are answers
      // Find wrong definitions (from other terms)
      const isPeopleOrTheory = correctTerm.tag1 === 'People' || correctTerm.tag1 === 'Theories';
      
      let candidates;
      if (isPeopleOrTheory) {
        candidates = quizTerms.filter(t => 
          t.tag1 === correctTerm.tag1 && t.term !== correctTerm.term
        );
      } else {
        candidates = quizTerms.filter(t => 
          t.tag1 === correctTerm.tag1 && 
          t.tag2 === correctTerm.tag2 && 
          t.term !== correctTerm.term
        );
      }
      
      if (candidates.length < 3) {
        if (isPeopleOrTheory) {
          candidates = quizTerms.filter(t => t.term !== correctTerm.term);
        } else {
          candidates = quizTerms.filter(t => 
            t.tag1 === correctTerm.tag1 && t.term !== correctTerm.term
          );
        }
      }
      
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3).map(t => t.definition);
    } else {
      // Normal mode: definition is question, terms are answers
      const isPeopleOrTheory = correctTerm.tag1 === 'People' || correctTerm.tag1 === 'Theories';
      
      let candidates;
      if (isPeopleOrTheory) {
        candidates = quizTerms.filter(t => 
          t.tag1 === correctTerm.tag1 && t.term !== correctTerm.term
        );
      } else {
        candidates = quizTerms.filter(t => 
          t.tag1 === correctTerm.tag1 && 
          t.tag2 === correctTerm.tag2 && 
          t.term !== correctTerm.term
        );
      }
      
      if (candidates.length < 3) {
        if (isPeopleOrTheory) {
          candidates = quizTerms.filter(t => t.term !== correctTerm.term);
        } else {
          candidates = quizTerms.filter(t => 
            t.tag1 === correctTerm.tag1 && t.term !== correctTerm.term
          );
        }
      }
      
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3).map(t => t.term);
    }
  };
  
  // Generate a new question
  const generateQuestion = () => {
    const quizTerms = getQuizTerms();
    
    if (quizTerms.length === 0) {
      setQuizComplete(true);
      return;
    }
    
    // In retake mode, check if all wrong answers have been corrected
    if (retakeWrongMode && wrongAnswerTerms.size === 0) {
      setQuizComplete(true);
      return;
    }
    
    // Check if all terms have been shown (for normal mode)
    if (!retakeWrongMode && shownTerms.size >= quizTerms.length) {
      setQuizComplete(true);
      return;
    }
    
    // Get terms that haven't been shown yet
    // In retake mode, also filter by terms still in wrongAnswerTerms
    const availableTerms = quizTerms.filter(term => {
      if (retakeWrongMode) {
        // In retake mode, only show terms that are still wrong
        return wrongAnswerTerms.has(term.term);
      }
      // Normal mode: show terms that haven't been shown
      return !shownTerms.has(term.term);
    });
    
    if (availableTerms.length === 0) {
      setQuizComplete(true);
      return;
    }
    
    // Pick random term from available (unshown) terms
    const randomIndex = Math.floor(Math.random() * availableTerms.length);
    const questionTerm = availableTerms[randomIndex];
    
    // Mark this term as shown
    setShownTerms(prev => new Set([...prev, questionTerm.term]));
    
    const wrongAnswers = findWrongAnswers(questionTerm, inverseMode);
    
    let allOptions;
    if (inverseMode) {
      // Inverse: term is question, definitions are answers
      allOptions = [
        questionTerm.definition,
        ...wrongAnswers
      ];
    } else {
      // Normal: definition is question, terms are answers
      allOptions = [
        questionTerm.term,
        ...wrongAnswers
      ];
    }
    
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
    
    // Check if answer is correct based on mode
    let correct;
    if (inverseMode) {
      // Inverse: term is question, definition is answer
      correct = answer === currentQuestion.definition;
    } else {
      // Normal: definition is question, term is answer
      correct = answer === currentQuestion.term;
    }
    
    setIsCorrect(correct);
    setShowResult(true);
    
    // Track wrong answer terms and handle retake mode completion
    if (!correct) {
      // Add term to wrongAnswerTerms set for retake feature
      setWrongAnswerTerms(prev => new Set([...prev, currentQuestion.term]));
    } else if (retakeWrongMode) {
      // If in retake mode and answer is correct, remove from wrongAnswerTerms
      setWrongAnswerTerms(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentQuestion.term);
        // Check if quiz is complete (all wrong answers corrected)
        if (newSet.size === 0) {
          setQuizComplete(true);
        }
        return newSet;
      });
    }
    
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
      
      // Check if quiz is complete after this answer (for normal mode)
      if (!retakeWrongMode) {
        const quizTerms = getQuizTerms();
        if (shownTerms.size + 1 >= quizTerms.length) {
          setQuizComplete(true);
        }
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
      <div className="min-h-screen p-8 bg-zinc-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 dark:text-gray-100">Configure Your Quiz</h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            {/* All Categories Option */}
            <div className="mb-6 pb-6 border-b dark:border-gray-700">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAllCategories}
                  onChange={(e) => handleAllCategoriesToggle(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="ml-3 text-lg font-semibold dark:text-gray-200">All Categories</span>
              </label>
              <p className="ml-8 text-sm text-gray-800 dark:text-gray-300 mt-1">
                Quiz will include terms from all categories
              </p>
            </div>
            
            {/* Category Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 dark:text-gray-200">Select Categories:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableCategories.map(category => (
                  <label
                    key={category}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors dark:text-gray-200 ${
                      selectedCategories.includes(category)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
              <h3 className="text-lg font-semibold mb-3 dark:text-gray-200">Select Subcategories (Optional):</h3>
              <p className="text-sm text-gray-800 dark:text-gray-300 mb-3">
                Leave empty to include all subcategories from selected categories
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {availableSubcategories.map(subcategory => (
                  <label
                    key={subcategory}
                    className={`flex items-center p-2 border-2 rounded-lg cursor-pointer transition-colors text-sm dark:text-gray-200 ${
                      selectedSubcategories.includes(subcategory)
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
            
            {/* Subsection Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 dark:text-gray-200">Select Subsections (Optional):</h3>
              <p className="text-sm text-gray-800 dark:text-gray-300 mb-3">
                Leave empty to include all subsections from selected subcategories
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {getAllSubsections().map(subsection => (
                  <label
                    key={subsection}
                    className={`flex items-center p-2 border-2 rounded-lg cursor-pointer transition-colors text-sm dark:text-gray-200 ${
                      selectedSubsections.includes(subsection)
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubsections.includes(subsection)}
                      onChange={() => toggleSubsection(subsection)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="ml-2">{subsection}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Inverse Mode Toggle */}
            <div className="mb-6 pb-6 border-b dark:border-gray-700">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={inverseMode}
                  onChange={(e) => setInverseMode(e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded"
                />
                <span className="ml-3 text-lg font-semibold dark:text-gray-200">Inverse Mode</span>
              </label>
              <p className="ml-8 text-sm text-gray-800 dark:text-gray-300 mt-1">
                {inverseMode 
                  ? 'Term will be shown as question, definitions as multiple choice answers'
                  : 'Definition will be shown as question, terms as multiple choice answers (default)'}
              </p>
            </div>
            
            {/* Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <p className="font-semibold text-blue-900 dark:text-blue-200">
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
    
    // If in retake mode and all wrong answers are now correct, clear the wrong answers set
    if (retakeWrongMode && wrongAnswerTerms.size === 0) {
      // All wrong answers have been corrected
    }
    
    return (
      <div className="min-h-screen p-8 bg-zinc-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-green-600 dark:text-green-400">Quiz Complete! 🎉</h1>
            <p className="text-xl text-gray-900 dark:text-gray-100 mb-8">
              {retakeWrongMode 
                ? wrongAnswerTerms.size === 0
                  ? 'Perfect! All wrong answers are now correct! 🎯'
                  : `You've completed the retake. ${wrongAnswerTerms.size} term${wrongAnswerTerms.size !== 1 ? 's still need' : ' still needs'} practice.`
                : `You've answered all ${filteredTerms.length} terms!`}
            </p>
            
            {/* Score Display */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-6 mb-6">
              <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">{accuracy}%</div>
              <p className="text-lg text-gray-900 dark:text-gray-100">Overall Score</p>
            </div>
            
            {/* Detailed Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-800 dark:text-green-300 mb-1">{correctCount}</div>
                <p className="text-sm text-gray-900 dark:text-gray-100">Correct</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="text-3xl font-bold text-red-800 dark:text-red-300 mb-1">{wrongCount}</div>
                <p className="text-sm text-gray-900 dark:text-gray-100">Incorrect</p>
              </div>
            </div>
            
            {/* Wrong by Category (if any) */}
            {Object.keys(quizStats.wrongByCategory).length > 0 && (
              <div className="mb-6 text-left">
                <h3 className="text-lg font-semibold mb-3 dark:text-gray-200">Areas to Review:</h3>
                <div className="space-y-2">
                  {Object.entries(quizStats.wrongByCategory)
                    .sort(([_, a], [__, b]) => b - a)
                    .slice(0, 5)
                    .map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{category}</span>
                        <span className="text-sm text-red-600 dark:text-red-400 font-semibold">{count} wrong</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 justify-center">
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
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Retake Same Quiz
                </button>
              </div>
              
              {/* Retake Wrong Answers Button - only show if there are wrong answers */}
              {wrongAnswerTerms.size > 0 && (
                <button
                  onClick={startRetakeWrong}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Retake Wrong Answers Only ({wrongAnswerTerms.size} term{wrongAnswerTerms.size !== 1 ? 's' : ''})
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // Quiz Interface (shown after configuration)
  if (filteredTerms.length === 0) {
    return (
      <div className="min-h-screen p-8 bg-zinc-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 dark:text-gray-100">MCAT Quiz Mode</h1>
          <p className="text-lg dark:text-gray-300">No terms match your selection.</p>
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
    return <div className="dark:text-gray-100">Loading...</div>;
  }
  
  const totalAnswered = quizStats.correct + quizStats.wrong;
  const accuracy = totalAnswered > 0 
    ? Math.round((quizStats.correct / totalAnswered) * 100) 
    : 0;
  
  return (
    <div className="min-h-screen p-8 bg-zinc-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold dark:text-gray-100">MCAT Quiz Mode</h1>
            {retakeWrongMode && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">Retaking wrong answers only</p>
            )}
            {inverseMode && (
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">Inverse Mode: Term → Definition</p>
            )}
          </div>
          <button
            onClick={resetConfiguration}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Change Settings
          </button>
        </div>
        
        {/* Quiz Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-900 dark:text-gray-100">Questions: {quizStats.questionNumber}</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                Score: {quizStats.correct} / {totalAnswered} ({accuracy}%)
              </p>
              <p className="text-xs text-gray-900 dark:text-gray-300 mt-1">
                Terms in quiz: {getQuizTerms().length}
              </p>
            </div>
            {Object.keys(quizStats.wrongByCategory).length > 0 && (
              <div className="text-right">
                <p className="text-xs font-semibold mb-1 dark:text-gray-200">Wrong by Category:</p>
                {Object.entries(quizStats.wrongByCategory)
                  .sort(([_, a], [__, b]) => b - a)
                  .slice(0, 3)
                  .map(([category, count]) => (
                    <p key={category} className="text-xs text-red-600 dark:text-red-400">
                      {category}: {count}
                    </p>
                  ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          {/* Category Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {currentQuestion.tag1 && (
              <span className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                {currentQuestion.tag1}
              </span>
            )}
            {currentQuestion.tag2 && (
              <span className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full">
                {currentQuestion.tag2}
              </span>
            )}
            {currentQuestion.subsection && (
              <span className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full">
                {currentQuestion.subsection}
              </span>
            )}
          </div>
          
          {/* Question (Definition or Term based on mode) */}
          <div className="mb-6">
            <p className="text-sm text-gray-800 dark:text-gray-300 mb-2">Question:</p>
            <p className="text-xl font-medium text-gray-900 dark:text-gray-100">
              {inverseMode ? currentQuestion.term : currentQuestion.definition}
            </p>
          </div>
          
          {/* Multiple Choice Options */}
          <div className="space-y-3 mb-6">
            {options.map((option, index) => {
              let buttonClass = "w-full p-4 text-left border-2 rounded-lg transition-colors ";
              
              // Determine correct answer based on mode
              const correctAnswer = inverseMode ? currentQuestion.definition : currentQuestion.term;
              
              if (showResult) {
                if (option === correctAnswer) {
                  buttonClass += "bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-400 text-green-800 dark:text-green-200";
                } else if (option === selectedAnswer && option !== correctAnswer) {
                  buttonClass += "bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-400 text-red-800 dark:text-red-200";
                } else {
                  buttonClass += "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200";
                }
              } else {
                buttonClass += selectedAnswer === option
                  ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 text-blue-800 dark:text-blue-200"
                  : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-gray-200";
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
            <div className={`p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <p className={`font-semibold ${isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              {!isCorrect && (
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  The correct answer is: <strong>{inverseMode ? currentQuestion.definition : currentQuestion.term}</strong>
                </p>
              )}
            </div>
          )}
          
          {/* Next Question Button */}
          {showResult && !quizComplete && (
            <button
              onClick={() => {
                generateQuestion();
              }}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {(() => {
                const quizTerms = getQuizTerms();
                if (retakeWrongMode) {
                  // In retake mode, show remaining wrong answers
                  return wrongAnswerTerms.size <= 1 ? 'Finish Quiz' : `Next Question → (${wrongAnswerTerms.size - 1} remaining)`;
                }
                // Normal mode: show remaining questions
                const remaining = quizTerms.length - shownTerms.size - 1;
                return remaining <= 0 ? 'Finish Quiz' : `Next Question → (${remaining} remaining)`;
              })()}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}