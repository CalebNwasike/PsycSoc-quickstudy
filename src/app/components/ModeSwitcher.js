'use client';

import { useState } from 'react';
import StudyInterface from './StudyInterface';
import QuizInterface from './QuizInterface';

export default function ModeSwitcher({ terms }) {
  const [mode, setMode] = useState('study');
  
  return (
    <div>
      {/* Mode Switcher */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex gap-4">
          <button
            onClick={() => setMode('study')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              mode === 'study'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Study Mode
          </button>
          <button
            onClick={() => setMode('quiz')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              mode === 'quiz'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Quiz Mode
          </button>
        </div>
      </div>
      
      {/* Render appropriate interface */}
      {mode === 'study' ? (
        <StudyInterface terms={terms} />
      ) : (
        <QuizInterface terms={terms} />
      )}
    </div>
  );
}