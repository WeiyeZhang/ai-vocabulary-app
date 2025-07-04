import React from 'react';
import type { VocabularyItem } from '../types.ts';
import SparklesIcon from './icons/SparklesIcon.tsx';

interface FlashcardProps {
  item: VocabularyItem;
  isFlipped: boolean;
}

const Flashcard: React.FC<FlashcardProps> = ({ item, isFlipped }) => {
  return (
    <div className="w-full h-full [perspective:1000px] cursor-pointer">
      <div
        className={`relative w-full h-full text-center transition-transform duration-700 ease-in-out [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* Front of Card - Image or Word */}
        <div className="absolute w-full h-full [backface-visibility:hidden] bg-card border rounded-2xl shadow-xl flex items-center justify-center p-4">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={`Illustration for ${item.word}`} className="max-h-full max-w-full object-contain rounded-lg" />
          ) : (
             <h3 className="text-4xl lg:text-5xl font-bold text-card-foreground tracking-wider capitalize text-center px-4">{item.word}</h3>
          )}
        </div>
        {/* Back of Card - Word, Meaning & Explanations */}
        <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-card rounded-2xl shadow-xl flex flex-col items-center justify-center p-4 sm:p-6 border border-primary overflow-y-auto">
          <div className="text-center">
            <h3 className="text-4xl lg:text-5xl font-bold text-card-foreground tracking-wider capitalize">{item.word}</h3>
            <p className="mt-4 text-2xl text-primary">{item.meaning}</p>
          </div>
          {(item.aiExplanation || item.explanation) && (
            <div className="mt-6 pt-4 border-t border-primary/20 w-full max-w-md text-left space-y-4">
              {item.aiExplanation && (
                  <div>
                      <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2 flex items-center">
                          <SparklesIcon className="w-4 h-4 mr-2" />
                          AI Explanation
                      </h4>
                      <p className="text-base text-muted-foreground">"{item.aiExplanation}"</p>
                  </div>
              )}
              {item.explanation && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">My Explanation</h4>
                  <p className="text-base text-muted-foreground italic">"{item.explanation}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Flashcard;