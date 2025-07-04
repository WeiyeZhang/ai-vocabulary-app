import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { VocabularyItem, Folder } from './types.ts';
import { generateExplanation, initializeAi, isAiReady } from './services/geminiService.ts';
import WordInputArea from './components/WordInputArea.tsx';
import FlashcardDeck from './components/FlashcardDeck.tsx';
import BrowseDeck from './components/BrowseDeck.tsx';
import ApiKeyModal from './components/ApiKeyModal.tsx';
import ThemeSwitcher from './components/ThemeSwitcher.tsx';
import PlusIcon from './components/icons/PlusIcon.tsx';
import BookOpenIcon from './components/icons/BookOpenIcon.tsx';
import GridIcon from './components/icons/GridIcon.tsx';
import KeyIcon from './components/icons/KeyIcon.tsx';

type ViewMode = 'add' | 'study' | 'browse';
const STORAGE_KEY = 'ai-vocab-flashcards';
const API_KEY_STORAGE_KEY = 'gemini-api-key';

const App: React.FC = () => {
  const [vocabItems, setVocabItems] = useState<VocabularyItem[]>(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        return JSON.parse(savedState).items || [];
      }
    } catch (error) {
      console.error("Could not load vocab items from localStorage", error);
    }
    return [];
  });
  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        return JSON.parse(savedState).folders || [];
      }
    } catch (error) {
      console.error("Could not load folders from localStorage", error);
    }
    return [];
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>('add');
  const [editingItem, setEditingItem] = useState<VocabularyItem | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [aiReady, setAiReady] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const handleSaveApiKey = useCallback((key: string) => {
    setApiKey(key);
    initializeAi(key);
    setAiReady(isAiReady());
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  }, []);

  // Load API key and initialize AI service on mount
  useEffect(() => {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      handleSaveApiKey(savedKey);
    }
  }, [handleSaveApiKey]);

  // Save deck to localStorage whenever items or folders change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: vocabItems, folders }));
    } catch (error) {
      console.error("Could not save state to localStorage", error);
    }
  }, [vocabItems, folders]);

  // Sync editingItem with vocabItems if it changes (e.g., after AI generation)
  useEffect(() => {
    if (editingItem) {
        const updatedItem = vocabItems.find(item => item.id === editingItem.id);
        if (updatedItem && updatedItem !== editingItem) {
            setEditingItem(updatedItem);
        } else if (!updatedItem) {
            setEditingItem(null);
            setViewMode('browse');
        }
    }
  }, [vocabItems, editingItem]);

  const dueItemsCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return vocabItems.filter(item => {
        const reviewDate = new Date(item.nextReviewDate);
        reviewDate.setHours(0, 0, 0, 0);
        return reviewDate <= today;
    }).length;
  }, [vocabItems]);

  const addSRSProperties = (item: Omit<VocabularyItem, 'id' | 'nextReviewDate' | 'repetition' | 'interval' | 'explanation'>): VocabularyItem => {
    return {
      id: `${item.word}-${Date.now()}`,
      ...item,
      repetition: 0,
      interval: 1,
      nextReviewDate: new Date().toISOString(),
      explanation: '',
    };
  };

  const handleAddWord = (item: Omit<VocabularyItem, 'id' | 'nextReviewDate' | 'repetition' | 'interval' | 'explanation'>) => {
    const newCard = addSRSProperties(item);
    setVocabItems((prevItems) => [newCard, ...prevItems]);
    setViewMode('browse');
  };
  
  const handleUpdateWord = (updatedItem: VocabularyItem) => {
    setVocabItems(prevItems => prevItems.map(item => item.id === updatedItem.id ? updatedItem : item));
    setEditingItem(null);
    setViewMode('browse');
  };
  
  const handleStartEdit = (item: VocabularyItem) => {
    setEditingItem(item);
    setViewMode('add');
  };
  
  const handleCancelEdit = () => {
    setEditingItem(null);
    setViewMode('browse');
  };

  const handleDeleteWord = (id: string) => {
    setVocabItems(prevItems => prevItems.filter(item => item.id !== id));
  };
  
  const handleCreateFolder = (name: string): string => {
    const newFolder = { id: `folder-${Date.now()}`, name };
    setFolders(prev => [...prev, newFolder]);
    return newFolder.id;
  };

  const handleMoveItemsToFolder = (itemIds: string[], folderId: string | null) => {
    setVocabItems(prev => 
      prev.map(item => 
        itemIds.includes(item.id) ? { ...item, folderId: folderId ?? undefined } : item
      )
    );
  };
  
  const handleDeleteFolder = (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setVocabItems(prev => prev.map(item => item.folderId === folderId ? { ...item, folderId: undefined } : item));
  };

  const handleImportWords = (importedItems: Array<{ word: string; meaning: string }>) => {
    const newVocabItems = importedItems.map(item => {
      return addSRSProperties({
        word: item.word,
        meaning: item.meaning,
        imageUrl: '', // Import with no image
      });
    });
    setVocabItems((prevItems) => [...newVocabItems, ...prevItems]);
    setViewMode('browse');
  };
  
  const handleGenerateExplanation = async (itemId: string, hint: string): Promise<void> => {
    if (!aiReady) {
        setIsApiKeyModalOpen(true);
        throw new Error("API Key not set.");
    }
    const item = vocabItems.find(i => i.id === itemId);
    if (!item) throw new Error("Item not found");

    const explanation = await generateExplanation(item.word, item.meaning, hint);
    setVocabItems(prev => prev.map(i => i.id === itemId ? { ...i, aiExplanation: explanation } : i));
  };

  const handleGenerateExplanations = async (itemIds: string[], hint: string): Promise<void> => {
    if (!aiReady) {
        setIsApiKeyModalOpen(true);
        throw new Error("API Key not set.");
    }

    const itemsToUpdate = vocabItems.filter(i => itemIds.includes(i.id));
    if (itemsToUpdate.length === 0) return;

    try {
        const explanationPromises = itemsToUpdate.map(item =>
            generateExplanation(item.word, item.meaning, hint)
                .then(explanation => ({ id: item.id, explanation }))
        );

        const results = await Promise.all(explanationPromises);

        const explanationsMap = new Map(results.map(r => [r.id, r.explanation]));

        setVocabItems(prev =>
            prev.map(item =>
                explanationsMap.has(item.id)
                    ? { ...item, aiExplanation: explanationsMap.get(item.id) }
                    : item
            )
        );
    } catch (error) {
        console.error("Failed during bulk explanation generation:", error);
        throw error; // re-throw to be caught by caller
    }
  };

  const handleCardReview = (cardId: string, performance: 'correct' | 'incorrect') => {
    setVocabItems(items => items.map(item => {
      if (item.id !== cardId) return item;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (performance === 'incorrect') {
        const nextReviewDate = new Date(today);
        nextReviewDate.setDate(today.getDate() + 1);
        return { ...item, repetition: 0, interval: 1, nextReviewDate: nextReviewDate.toISOString() };
      } else {
        const intervals = [1, 3, 7, 16, 35, 90];
        const newRepetition = item.repetition + 1;
        const newInterval = intervals[Math.min(newRepetition, intervals.length - 1)];
        const nextReviewDate = new Date(today);
        nextReviewDate.setDate(today.getDate() + newInterval);
        return { ...item, repetition: newRepetition, interval: newInterval, nextReviewDate: nextReviewDate.toISOString() };
      }
    }));
  };
  
  const handleUpdateExplanation = (cardId: string, explanation: string) => {
    setVocabItems(items => items.map(item => item.id === cardId ? { ...item, explanation } : item));
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'add':
        return <WordInputArea onAddWord={handleAddWord} onUpdateWord={handleUpdateWord} onImportWords={handleImportWords} editingItem={editingItem} onCancelEdit={handleCancelEdit} isAiReady={aiReady} onAiRequired={() => setIsApiKeyModalOpen(true)} onGenerateExplanation={handleGenerateExplanation} />;
      case 'study':
        return <FlashcardDeck items={vocabItems} onCardReview={handleCardReview} onUpdateExplanation={handleUpdateExplanation} />;
      case 'browse':
        return <BrowseDeck 
                    items={vocabItems} 
                    folders={folders}
                    onDeleteWord={handleDeleteWord} 
                    onStartEdit={handleStartEdit}
                    onCreateFolder={handleCreateFolder}
                    onMoveItemsToFolder={handleMoveItemsToFolder}
                    onDeleteFolder={handleDeleteFolder}
                    isAiReady={aiReady}
                    onAiRequired={() => setIsApiKeyModalOpen(true)}
                    onGenerateExplanations={handleGenerateExplanations}
                />;
      default:
        return <WordInputArea onAddWord={handleAddWord} onUpdateWord={handleUpdateWord} onImportWords={handleImportWords} editingItem={editingItem} onCancelEdit={() => setViewMode(editingItem ? 'browse' : 'add')} isAiReady={aiReady} onAiRequired={() => setIsApiKeyModalOpen(true)} onGenerateExplanation={handleGenerateExplanation} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
       <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} onSave={handleSaveApiKey} currentKey={apiKey} />
      <div className="max-w-7xl mx-auto">
        <header className="relative text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            AI Vocabulary Flashcards
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Create cards with AI, then study using Spaced Repetition.
          </p>
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <ThemeSwitcher />
            <button onClick={() => setIsApiKeyModalOpen(true)} className={`p-2 rounded-full transition-colors ${aiReady ? 'text-green-400 hover:bg-green-400/10' : 'text-yellow-400 hover:bg-yellow-400/10'}`} title={aiReady ? "API Key is set" : "Set API Key"}>
              <KeyIcon className="w-6 h-6"/>
            </button>
          </div>
        </header>
        
        <nav className="flex justify-center mb-12">
          <div className="flex p-1 bg-muted rounded-full border">
            <button onClick={() => { setEditingItem(null); setViewMode('add');}} className={`flex items-center justify-center px-5 py-2 text-sm font-semibold rounded-full transition-colors ${viewMode === 'add' && !editingItem ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Words
            </button>
             <button onClick={() => setViewMode('browse')} className={`flex items-center justify-center px-5 py-2 text-sm font-semibold rounded-full transition-colors ${viewMode === 'browse' || editingItem ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
              <GridIcon className="w-5 h-5 mr-2" />
              Browse Deck ({vocabItems.length})
            </button>
            <button onClick={() => setViewMode('study')} className={`flex items-center justify-center px-5 py-2 text-sm font-semibold rounded-full transition-colors ${viewMode === 'study' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
              <BookOpenIcon className="w-5 h-5 mr-2" />
              Study ({dueItemsCount})
            </button>
          </div>
        </nav>

        <main>
          {renderContent()}
        </main>
        
        <footer className="text-center mt-16 text-muted-foreground/80 text-sm">
          <p>Powered by Gemini and React</p>
        </footer>
      </div>
    </div>
  );
};

export default App;