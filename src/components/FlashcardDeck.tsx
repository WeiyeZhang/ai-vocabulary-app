import React, { useState, useEffect, useMemo } from 'react';
import type { VocabularyItem } from '../types.ts';
import Flashcard from './Flashcard.tsx';
import CheckCircleIcon from './icons/CheckCircleIcon.tsx';
import XCircleIcon from './icons/XCircleIcon.tsx';
import SaveIcon from './icons/SaveIcon.tsx';
import SparklesIcon from './icons/SparklesIcon.tsx';
import ChevronDownIcon from './icons/ChevronDownIcon.tsx';

interface FlashcardDeckProps {
  items: VocabularyItem[];
  onCardReview: (cardId: string, performance: 'correct' | 'incorrect') => void;
  onUpdateExplanation: (cardId: string, explanation: string) => void;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ items, onCardReview, onUpdateExplanation }) => {
  const [sessionItems, setSessionItems] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showAiExplanation, setShowAiExplanation] = useState(false);

  const dueItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return items.filter(item => {
      const reviewDate = new Date(item.nextReviewDate);
      reviewDate.setHours(0, 0, 0, 0);
      return reviewDate <= today;
    });
  }, [items]);
  
  const currentItem = useMemo(() => sessionItems[currentIndex], [sessionItems, currentIndex]);

  useEffect(() => {
    if (dueItems.length > 0) {
      setSessionItems(shuffleArray(dueItems));
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionComplete(false);
    } else {
      setSessionItems([]);
      setSessionComplete(true);
    }
  }, [dueItems]);

  useEffect(() => {
    if(currentItem) {
      setExplanation(currentItem.explanation || '');
      setIsSaved(false);
      setShowAiExplanation(false);
    }
  }, [currentItem]);

  const handleFlip = () => setIsFlipped(prev => !prev);
  
  const handleSaveExplanation = () => {
    if(currentItem) {
      onUpdateExplanation(currentItem.id, explanation);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000); // Reset saved status indicator
    }
  };
  
  const handleReview = (performance: 'correct' | 'incorrect') => {
    if (!currentItem) return;

    onCardReview(currentItem.id, performance);
    
    let nextItems = [...sessionItems];
    
    if (performance === 'incorrect') {
      nextItems.push(nextItems.splice(currentIndex, 1)[0]);
    } else {
      nextItems.splice(currentIndex, 1);
    }

    if (nextItems.length === 0) {
      setSessionComplete(true);
      return;
    }

    const nextIndex = currentIndex % nextItems.length;
    
    setSessionItems(nextItems);
    setCurrentIndex(nextIndex);
    setIsFlipped(false);
  };
  
  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 bg-card/50 rounded-2xl">
        <h2 className="text-2xl font-bold mb-2 text-card-foreground">Your deck is empty.</h2>
        <p>Switch to "Add Words" mode to create your first flashcard!</p>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="text-center text-muted-foreground p-8 bg-card/50 rounded-2xl">
        <h2 className="text-2xl font-bold mb-2 text-green-400">All done for now!</h2>
        <p>You have no cards due for review. Come back tomorrow to practice more.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center space-y-6">
      <div className="w-full h-64 sm:h-80 md:h-96" onClick={!isFlipped ? handleFlip : undefined}>
        {currentItem ? <Flashcard item={currentItem} isFlipped={isFlipped} /> : <div className="w-full h-full bg-card rounded-2xl"></div>}
      </div>

      <div className="flex flex-col items-center w-full space-y-4">
        <p className="text-muted-foreground font-medium">
          {sessionItems.length} card{sessionItems.length !== 1 ? 's' : ''} left in this session
        </p>
        
        {isFlipped && (
          <div className="w-full max-w-lg space-y-4 animate-fade-in">
            {/* AI Explanation Area */}
            {currentItem?.aiExplanation && (
                <div className="bg-card/50 p-4 rounded-xl border">
                     <button onClick={() => setShowAiExplanation(prev => !prev)} className="w-full flex justify-between items-center font-bold text-teal-400 transition-colors hover:text-teal-300">
                        <span className="flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5" />
                            AI Explanation
                        </span>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${showAiExplanation ? 'rotate-180' : ''}`} />
                     </button>
                     {showAiExplanation && (
                         <p className="text-muted-foreground mt-3 pt-3 border-t border-border/50">"{currentItem.aiExplanation}"</p>
                     )}
                </div>
            )}

            {/* Feynman Technique Area */}
            <div className="bg-card/50 p-4 rounded-xl border">
              <h4 className="font-bold text-card-foreground mb-2">Feynman Technique: Explain it simply</h4>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain this concept in your own words..."
                className="w-full bg-input border rounded-md py-2 px-3 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring transition h-24"
              />
              <button onClick={handleSaveExplanation} className="mt-2 w-full flex items-center justify-center bg-teal-600 hover:bg-teal-700 disabled:bg-teal-900 text-white font-bold py-2 px-4 rounded-md transition-all text-sm">
                <SaveIcon className="w-4 h-4 mr-2" />
                {isSaved ? 'Saved!' : 'Save Explanation'}
              </button>
            </div>
          
            {/* Review Buttons */}
            <div className="flex justify-around w-full">
              <button
                onClick={() => handleReview('incorrect')}
                className="flex flex-col items-center px-8 py-3 bg-red-800/50 hover:bg-red-700/70 text-red-200 font-bold rounded-full transition-all"
              >
                <XCircleIcon className="w-7 h-7 mb-1" />
                Forgot
              </button>
              <button
                onClick={() => handleReview('correct')}
                className="flex flex-col items-center px-8 py-3 bg-green-800/50 hover:bg-green-700/70 text-green-200 font-bold rounded-full transition-all"
              >
                <CheckCircleIcon className="w-7 h-7 mb-1" />
                Remembered
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardDeck;
