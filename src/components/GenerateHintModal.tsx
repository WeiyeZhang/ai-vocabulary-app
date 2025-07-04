import React, { useState } from 'react';
import type { VocabularyItem } from '../types.ts';
import SparklesIcon from './icons/SparklesIcon.tsx';

interface GenerateHintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (hint: string) => void;
  itemsToGenerate: VocabularyItem[];
}

const GenerateHintModal: React.FC<GenerateHintModalProps> = ({ isOpen, onClose, onSubmit, itemsToGenerate }) => {
  const [hint, setHint] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(hint);
    onClose();
  };
  
  const wordList = itemsToGenerate.map(item => item.word).join(', ');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-popover rounded-lg shadow-xl p-6 w-full max-w-md border" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-2 text-popover-foreground">Generate AI Explanation</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Generating explanation for: <span className="font-semibold text-primary/90">{wordList}</span>
        </p>
        <div>
          <label htmlFor="ai-hint" className="block text-sm font-medium text-muted-foreground mb-2">
            Hint for AI (Optional)
          </label>
          <textarea
            id="ai-hint"
            value={hint}
            onChange={e => setHint(e.target.value)}
            placeholder="e.g., Explain it like I'm five, or focus on the etymology."
            className="w-full h-24 bg-input border rounded-md py-2 px-3 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring"
          />
           <p className="text-muted-foreground mt-1 text-xs">
            If multiple items are selected, this hint will be applied to all of them.
           </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 transition">
            <SparklesIcon className="w-5 h-5" />
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateHintModal;
