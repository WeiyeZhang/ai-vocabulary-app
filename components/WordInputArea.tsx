import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { VocabularyItem } from '../types.ts';
import { generateImage } from '../services/geminiService.ts';
import SparklesIcon from './icons/SparklesIcon.tsx';
import PlusIcon from './icons/PlusIcon.tsx';
import UploadIcon from './icons/UploadIcon.tsx';
import ImageIcon from './icons/ImageIcon.tsx';

interface WordInputAreaProps {
  onAddWord: (item: Omit<VocabularyItem, 'nextReviewDate' | 'repetition' | 'interval'>) => void;
  onImportWords: (items: Array<{ word: string; meaning:string }>) => void;
  isImporting: boolean;
}

const WordInputArea: React.FC<WordInputAreaProps> = ({ onAddWord, onImportWords, isImporting }) => {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!imageUrl || !imageUrl.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const handleFileAsImage = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) {
        setError("Invalid file type. Please upload an image.");
        return;
    }
    const newObjectUrl = URL.createObjectURL(file);
    setImageUrl(newObjectUrl);
    setError('');
  };

  const handleGenerateImage = async () => {
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

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (word && imageUrl && meaning) {
      onAddWord({
        id: new Date().toISOString(),
        word,
        meaning,
        imageUrl,
      });
      setWord('');
      setMeaning('');
      setImageUrl('');
      setError('');
    } else {
      setError('A word, its meaning, and an image are required to add to the deck.');
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleUploadImageClick = () => imageFileInputRef.current?.click();

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileAsImage(event.target.files?.[0] ?? null);
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
    handleFileAsImage(event.clipboardData.files[0]);
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
    handleFileAsImage(event.dataTransfer.files[0]);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-gray-800/50 rounded-2xl shadow-lg p-8 backdrop-blur-sm border border-gray-700" onPaste={handlePaste}>
      <h2 className="text-2xl font-bold text-center text-white mb-6">Create a New Flashcard</h2>
      {error && <p className="text-red-400 text-center mb-4">{error}</p>}
      <form onSubmit={handleAddWord} className="space-y-6">
        <div>
          <label htmlFor="word" className="block text-sm font-medium text-gray-300 mb-2">Vocabulary Word</label>
          <input id="word" type="text" value={word} onChange={(e) => setWord(e.target.value)} placeholder="e.g., Photosynthesis" className="w-full bg-gray-700 border border-gray-600 rounded-md py-3 px-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
        </div>
        <div>
          <label htmlFor="meaning" className="block text-sm font-medium text-gray-300 mb-2">Chinese Meaning (for image hint)</label>
          <input id="meaning" type="text" value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="e.g., 光合作用" className="w-full bg-gray-700 border border-gray-600 rounded-md py-3 px-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
        </div>
        
        <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`p-4 rounded-lg transition-all ${isDraggingOver ? 'bg-indigo-500/10 ring-2 ring-indigo-500 ring-dashed' : 'bg-gray-700/50 border border-gray-700'}`}>
          <label className="block text-sm font-medium text-gray-300 mb-2">Image</label>
           <input type="file" ref={imageFileInputRef} onChange={handleImageFileChange} className="hidden" accept="image/*" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <button type="button" onClick={handleGenerateImage} disabled={isGenerating || !word || !meaning || isImporting} className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-300">
                <SparklesIcon className="w-5 h-5 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate with AI'}
              </button>
              <button type="button" onClick={handleUploadImageClick} disabled={isGenerating || isImporting} className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-300">
                <ImageIcon className="w-5 h-5 mr-2" />
                Upload from Device
              </button>
          </div>
           <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">Or</span>
            <div className="flex-grow border-t border-gray-600"></div>
           </div>
           <input id="imageUrl" type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Paste an image URL" className="w-full bg-gray-700 border border-gray-600 rounded-md py-3 px-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" />
           <p className="text-center text-xs text-gray-400 mt-2">You can also drag & drop or paste an image.</p>
        </div>

        {(imageUrl || isGenerating) && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-300 mb-2 text-center">Image Preview</h3>
            <div className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
              {isGenerating ? <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div> : <img src={imageUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />}
            </div>
          </div>
        )}

        <button type="submit" disabled={!word || !imageUrl || !meaning || isGenerating || isImporting} className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-green-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-300 mt-6">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add to Deck
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-gray-700">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">OR</h3>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.csv" disabled={isImporting} />
        <button type="button" onClick={handleImportClick} disabled={isImporting} className="w-full flex items-center justify-center bg-teal-600 hover:bg-teal-700 disabled:bg-teal-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-300">
          <UploadIcon className="w-5 h-5 mr-2" />
          {isImporting ? 'Importing & Generating...' : 'Import from File (.txt/.csv)'}
        </button>
      </div>
    </div>
  );
};

export default WordInputArea;