
import React, { useState } from 'react';
import type { VocabularyItem } from './types.ts';
import { generateImage } from './services/geminiService.ts';
import WordInputArea from './components/WordInputArea.tsx';
import FlashcardDeck from './components/FlashcardDeck.tsx';
import PlusIcon from './components/icons/PlusIcon.tsx';
import BookOpenIcon from './components/icons/BookOpenIcon.tsx';

type ViewMode = 'add' | 'study';

const App: React.FC = () => {
  const [vocabItems, setVocabItems] = useState<VocabularyItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('add');
  const [isImporting, setIsImporting] = useState(false);

  const addSRSProperties = (item: Omit<VocabularyItem, 'nextReviewDate' | 'repetition' | 'interval' | 'explanation'>): VocabularyItem => {
    return {
      ...item,
      repetition: 0,
      interval: 1,
      nextReviewDate: new Date().toISOString(),
      explanation: '',
    };
  };

  const handleAddWord = (item: Omit<VocabularyItem, 'nextReviewDate' | 'repetition' | 'interval' | 'explanation'>) => {
    const newCard = addSRSProperties(item);
    setVocabItems((prevItems) => [...prevItems, newCard]);
  };

  const handleImportWords = async (importedItems: Array<{ word: string; meaning: string }>) => {
    setIsImporting(true);
    try {
      const newVocabItems = await Promise.all(
        importedItems.map(async (item) => {
          const imageUrl = await generateImage(item.word, item.meaning);
          return addSRSProperties({
            id: `${item.word}-${Date.now()}`,
            word: item.word,
            meaning: item.meaning,
            imageUrl: imageUrl,
          });
        })
      );
      setVocabItems((prevItems) => [...prevItems, ...newVocabItems]);
    } catch (error) {
      console.error("Failed during bulk import and image generation:", error);
      // In a real app, you might set an error state to show a toast notification
    } finally {
      setIsImporting(false);
    }
  };

  const handleCardReview = (cardId: string, performance: 'correct' | 'incorrect') => {
    setVocabItems(items => items.map(item => {
      if (item.id !== cardId) {
        return item;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day

      if (performance === 'incorrect') {
        const nextReviewDate = new Date(today);
        nextReviewDate.setDate(today.getDate() + 1); // Review tomorrow
        return {
          ...item,
          repetition: 0,
          interval: 1,
          nextReviewDate: nextReviewDate.toISOString(),
        };
      } else { // 'correct'
        const intervals = [1, 3, 7, 16, 35, 90]; // Spaced repetition intervals in days
        const newRepetition = item.repetition + 1;
        const newInterval = intervals[Math.min(newRepetition, intervals.length - 1)];

        const nextReviewDate = new Date(today);
        nextReviewDate.setDate(today.getDate() + newInterval);
        
        return {
          ...item,
          repetition: newRepetition,
          interval: newInterval,
          nextReviewDate: nextReviewDate.toISOString(),
        };
      }
    }));
  };
  
  const handleUpdateExplanation = (cardId: string, explanation: string) => {
    setVocabItems(items => items.map(item => 
        item.id === cardId ? { ...item, explanation } : item
    ));
  };

  return (
    <div className="min-h-screen bg-gray-900 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-900/50 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            AI Vocabulary Flashcards
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Create cards with AI, then study using Spaced Repetition.
          </p>
        </header>
        
        <nav className="flex justify-center mb-12">
          <div className="flex p-1 bg-gray-800 rounded-full border border-gray-700">
            <button
              onClick={() => setViewMode('add')}
              disabled={isImporting}
              className={`flex items-center justify-center px-6 py-2 text-sm font-semibold rounded-full transition-colors ${
                viewMode === 'add' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Words
            </button>
            <button
              onClick={() => setViewMode('study')}
              disabled={isImporting}
              className={`flex items-center justify-center px-6 py-2 text-sm font-semibold rounded-full transition-colors ${
                viewMode === 'study' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <BookOpenIcon className="w-5 h-5 mr-2" />
              Study ({vocabItems.length})
            </button>
          </div>
        </nav>

        <main>
          {viewMode === 'add' ? (
            <WordInputArea 
              onAddWord={handleAddWord}
              onImportWords={handleImportWords}
              isImporting={isImporting}
            />
          ) : (
            <FlashcardDeck 
              items={vocabItems} 
              onCardReview={handleCardReview} 
              onUpdateExplanation={handleUpdateExplanation}
            />
          )}
        </main>
        
        <footer className="text-center mt-16 text-gray-500 text-sm">
          <p>Powered by Gemini and React</p>
        </footer>
      </div>
    </div>
  );
};

export default App;