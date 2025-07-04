import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { VocabularyItem } from '../types.ts';
import { generateImage } from '../services/geminiService.ts';
import SparklesIcon from './icons/SparklesIcon.tsx';
import PlusIcon from './icons/PlusIcon.tsx';
import UploadIcon from './icons/UploadIcon.tsx';
import ImageIcon from './icons/ImageIcon.tsx';
import SaveIcon from './icons/SaveIcon.tsx';

interface WordInputAreaProps {
  onAddWord: (item: Omit<VocabularyItem, 'id' | 'nextReviewDate' | 'repetition' | 'interval'>) => void;
  onUpdateWord: (item: VocabularyItem) => void;
  onImportWords: (items: Array<{ word: string; meaning:string }>) => void;
  editingItem: VocabularyItem | null;
  onCancelEdit: () => void;
  isAiReady: boolean;
  onAiRequired: () => void;
  onGenerateExplanation: (itemId: string, hint: string) => Promise<void>;
}

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const WordInputArea: React.FC<WordInputAreaProps> = ({ onAddWord, onUpdateWord, onImportWords, editingItem, onCancelEdit, isAiReady, onAiRequired, onGenerateExplanation }) => {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [aiHint, setAiHint] = useState('');
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setWord(editingItem.word);
      setMeaning(editingItem.meaning);
      setImageUrl(editingItem.imageUrl);
      setError('');
      setAiHint('');
    } else {
      setWord('');
      setMeaning('');
      setImageUrl('');
      setError('');
    }
  }, [editingItem]);

  const processImageFile = async (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) {
      setError("Invalid file type. Please upload an image.");
      return;
    }
    setError('');
    try {
      const dataUrl = await fileToDataUrl(file);
      setImageUrl(dataUrl);
    } catch (err) {
      setError("Could not process image file.");
    }
  };

  const handleGenerateImage = async () => {
    if (!isAiReady) {
      onAiRequired();
      return;
    }
    if (!word || !meaning) {
      setError(!word ? 'Please enter a word first.' : 'Please enter the Chinese meaning as a hint.');
      return;
    }
    setError('');
    setIsGenerating(true);
    setImageUrl('');
    try {
      const generatedImageUrl = await generateImage(word, meaning);
      setImageUrl(generatedImageUrl);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleGenerateExplanationClick = async () => {
    if (!editingItem) return;
    if (!isAiReady) {
        onAiRequired();
        return;
    }
    setIsGeneratingExplanation(true);
    try {
        await onGenerateExplanation(editingItem.id, aiHint);
        setAiHint('');
    } catch (err: any) {
        setError(err.message || 'Failed to generate explanation.');
    } finally {
        setIsGeneratingExplanation(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word && imageUrl && meaning) {
      if (editingItem) {
        onUpdateWord({
          ...editingItem,
          word,
          meaning,
          imageUrl,
        });
      } else {
        onAddWord({
          word,
          meaning,
          imageUrl,
        });
        setWord('');
        setMeaning('');
        setImageUrl('');
      }
      setError('');
    } else {
      setError('A word, its meaning, and an image are required.');
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleUploadImageClick = () => imageFileInputRef.current?.click();

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processImageFile(event.target.files?.[0] ?? null);
    if(event.target) event.target.value = '';
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) throw new Error("File is empty.");
        const parsedItems = lines.map(line => {
            const parts = line.split(',');
            if (parts.length < 2) throw new Error(`Invalid line format: "${line}". Expected "word,meaning".`);
            const word = parts[0].trim();
            const meaning = parts.slice(1).join(',').trim();
            if (!word || !meaning) throw new Error(`Invalid line format: "${line}". Both word and meaning are required.`);
            return { word, meaning };
        });
        onImportWords(parsedItems);
    } catch (err: any) {
        setError(err.message || 'Failed to parse file. Please use format: word,meaning');
    }
    if(event.target) event.target.value = '';
  };
  
  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    processImageFile(event.clipboardData.files[0]);
  }, []);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };
  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDraggingOver(false);
  };
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDraggingOver(false);
    processImageFile(event.dataTransfer.files[0]);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-card/50 rounded-2xl shadow-lg p-8 backdrop-blur-sm border" onPaste={handlePaste}>
      <h2 className="text-2xl font-bold text-center text-card-foreground mb-6">{editingItem ? 'Edit Flashcard' : 'Create a New Flashcard'}</h2>
      {error && <p className="text-red-400 text-center mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="word" className="block text-sm font-medium text-muted-foreground mb-2">Vocabulary Word</label>
          <input id="word" type="text" value={word} onChange={(e) => setWord(e.target.value)} placeholder="e.g., Photosynthesis" className="w-full bg-input border rounded-md py-3 px-4 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary transition" />
        </div>
        <div>
          <label htmlFor="meaning" className="block text-sm font-medium text-muted-foreground mb-2">Chinese Meaning (for image hint)</label>
          <input id="meaning" type="text" value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="e.g., 光合作用" className="w-full bg-input border rounded-md py-3 px-4 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary transition" />
        </div>
        
        <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`p-4 rounded-lg transition-all ${isDraggingOver ? 'bg-primary/10 ring-2 ring-primary ring-dashed' : 'bg-muted/50 border'}`}>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Image</label>
           <input type="file" ref={imageFileInputRef} onChange={handleImageFileChange} className="hidden" accept="image/*" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <button type="button" onClick={handleGenerateImage} disabled={isGenerating || !word || !meaning} className="w-full flex items-center justify-center bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:text-primary-foreground/70 disabled:cursor-not-allowed text-primary-foreground font-bold py-3 px-4 rounded-md transition-all duration-300">
                <SparklesIcon className="w-5 h-5 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate with AI'}
              </button>
              <button type="button" onClick={handleUploadImageClick} disabled={isGenerating} className="w-full flex items-center justify-center bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 disabled:text-secondary-foreground/70 disabled:cursor-not-allowed text-secondary-foreground font-bold py-3 px-4 rounded-md transition-all duration-300">
                <ImageIcon className="w-5 h-5 mr-2" />
                Upload from Device
              </button>
          </div>
           <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase">Or</span>
            <div className="flex-grow border-t border-border"></div>
           </div>
           <input id="imageUrl" type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Paste an image URL" className="w-full bg-input border rounded-md py-3 px-4 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:border-secondary transition" />
           <p className="text-center text-xs text-muted-foreground mt-2">You can also drag & drop or paste an image.</p>
        </div>

        {(imageUrl || isGenerating) && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-muted-foreground mb-2 text-center">Image Preview</h3>
            <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
              {isGenerating ? <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div> : <img src={imageUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />}
            </div>
          </div>
        )}
        
        {editingItem && (
          <div className="space-y-4 rounded-lg p-4 border bg-muted/30">
              <h3 className="text-lg font-medium text-muted-foreground">AI Explanation</h3>
              <div className="bg-input p-3 rounded-md min-h-[4rem] text-sm text-foreground">
                  {editingItem.aiExplanation ? (
                      <p className="italic">"{editingItem.aiExplanation}"</p>
                  ) : (
                      <p className="text-muted-foreground">No AI explanation generated yet.</p>
                  )}
              </div>
              <div>
                  <label htmlFor="ai-hint" className="block text-sm font-medium text-muted-foreground mb-2">Hint for Generation/Regeneration</label>
                  <textarea
                      id="ai-hint"
                      value={aiHint}
                      onChange={(e) => setAiHint(e.target.value)}
                      placeholder="e.g., Explain it like I'm five..."
                      className="w-full h-20 bg-input border rounded-md py-2 px-3 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring transition"
                  />
              </div>
              <button type="button" onClick={handleGenerateExplanationClick} disabled={isGeneratingExplanation} className="w-full flex items-center justify-center bg-teal-600 hover:bg-teal-700 disabled:bg-teal-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-all duration-300">
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  {isGeneratingExplanation ? 'Generating...' : (editingItem.aiExplanation ? 'Regenerate Explanation' : 'Generate Explanation')}
              </button>
          </div>
        )}

        <div className={`flex items-center gap-4 mt-6 ${editingItem ? 'justify-between' : 'justify-center'}`}>
            {editingItem && (
                 <button type="button" onClick={onCancelEdit} className="w-1/3 flex items-center justify-center bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground font-bold py-3 px-4 rounded-md transition-all duration-300">
                    Cancel
                </button>
            )}
            <button type="submit" disabled={!word || !imageUrl || !meaning || isGenerating} className={`${editingItem ? 'w-2/3' : 'w-full'} flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-300`}>
                {editingItem ? <SaveIcon className="w-5 h-5 mr-2" /> : <PlusIcon className="w-5 h-5 mr-2" />}
                {editingItem ? 'Update Card' : 'Add to Deck'}
            </button>
        </div>
      </form>
      
      {!editingItem && (
        <div className="mt-8 pt-8 border-t">
          <h3 className="text-center text-muted-foreground mb-4 text-sm font-medium">OR</h3>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.csv" />
          <button type="button" onClick={handleImportClick} className="w-full flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300">
            <UploadIcon className="w-5 h-5 mr-2" />
            Import from File (.txt/.csv)
          </button>
        </div>
      )}
    </div>
  );
};

export default WordInputArea;