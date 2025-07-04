
import React from 'react';
import type { VocabularyItem } from '../types.ts';

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
        {/* Front of Card - Image */}
        <div className="absolute w-full h-full [backface-visibility:hidden] bg-gray-700 rounded-2xl shadow-xl flex items-center justify-center p-4 border border-gray-600">
          <img src={item.imageUrl} alt={`Illustration for ${item.word}`} className="max-h-full max-w-full object-contain rounded-lg" />
        </div>
        {/* Back of Card - Word, Meaning & Explanation */}
        <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gray-800 rounded-2xl shadow-xl flex flex-col items-center justify-center p-4 sm:p-6 border border-indigo-500 overflow-y-auto">
          <div className="text-center">
            <h3 className="text-4xl lg:text-5xl font-bold text-white tracking-wider capitalize">{item.word}</h3>
            <p className="mt-4 text-2xl text-indigo-300">{item.meaning}</p>
          </div>
          {item.explanation && (
            <div className="mt-6 pt-4 border-t border-indigo-700 w-full max-w-sm text-left">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">My Explanation</h4>
              <p className="text-base text-gray-200 italic">"{item.explanation}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Flashcard;