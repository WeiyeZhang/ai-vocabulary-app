import React, { useState, useEffect } from 'react';
import SaveIcon from './icons/SaveIcon.tsx';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  currentKey: string | null;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKey(currentKey || '');
    }
  }, [currentKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(apiKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-popover rounded-lg shadow-xl p-6 w-full max-w-md border" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-popover-foreground">Set Gemini API Key</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          To use AI features like image and explanation generation, you need a Gemini API key. 
          You can get one for free from{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Google AI Studio
          </a>.
        </p>
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-muted-foreground mb-2">Your API Key</label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API Key"
            className="w-full bg-input border rounded-md py-2 px-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 transition">
            <SaveIcon className="w-5 h-5" />
            Save & Activate
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
