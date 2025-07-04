import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { VocabularyItem, Folder } from '../types.ts';
import TrashIcon from './icons/TrashIcon.tsx';
import PencilIcon from './icons/PencilIcon.tsx';
import FolderIcon from './icons/FolderIcon.tsx';
import ChevronDownIcon from './icons/ChevronDownIcon.tsx';
import SparklesIcon from './icons/SparklesIcon.tsx';
import Flashcard from './Flashcard.tsx';
import GenerateHintModal from './GenerateHintModal.tsx';

interface BrowseDeckProps {
  items: VocabularyItem[];
  folders: Folder[];
  onDeleteWord: (id: string) => void;
  onStartEdit: (item: VocabularyItem) => void;
  onCreateFolder: (name: string) => string;
  onMoveItemsToFolder: (itemIds: string[], folderId: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  isAiReady: boolean;
  onAiRequired: () => void;
  onGenerateExplanations: (itemIds: string[], hint: string) => Promise<void>;
}

const MoveToFolderModal = ({
  isOpen,
  onClose,
  folders,
  selectedItemCount,
  onCreateFolder,
  onMoveItemsToFolder,
}: {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  selectedItemCount: number;
  onCreateFolder: (name: string) => string;
  onMoveItemsToFolder: (folderId: string | null) => void;
}) => {
  const [newFolderName, setNewFolderName] = useState('');

  if (!isOpen) return null;

  const handleCreateAndMove = () => {
    if (newFolderName.trim()) {
      const newFolderId = onCreateFolder(newFolderName.trim());
      onMoveItemsToFolder(newFolderId);
      setNewFolderName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-popover rounded-lg shadow-xl p-6 w-full max-w-md border" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-popover-foreground">Move {selectedItemCount} item(s) to...</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          <button onClick={() => { onMoveItemsToFolder(null); onClose(); }} className="w-full text-left p-3 bg-muted hover:bg-primary/80 hover:text-primary-foreground rounded-md transition-colors">
            (No Folder / Ungrouped)
          </button>
          {folders.map(folder => (
            <button key={folder.id} onClick={() => { onMoveItemsToFolder(folder.id); onClose(); }} className="w-full text-left p-3 bg-muted hover:bg-primary/80 hover:text-primary-foreground rounded-md transition-colors">
              {folder.name}
            </button>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t">
          <h3 className="font-semibold mb-2 text-popover-foreground">Create a new folder</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="New folder name..."
              className="flex-grow bg-input border rounded-md py-2 px-3 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <button onClick={handleCreateAndMove} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-md transition-colors">
              Create & Move
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EMOJIS = ['📚', '💡', '🌟', '🤔', '😊', '🧐', '🧩'];
const getEmojiForWord = (word: string) => {
    if (!word) return EMOJIS[0];
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
        hash += word.charCodeAt(i);
    }
    return EMOJIS[hash % EMOJIS.length];
};

const CardItem = React.memo(({ item, isSelected, onToggleSelect, onStartEdit, onDeleteWord, onDoubleClick }: {
  item: VocabularyItem;
  isSelected: boolean;
  onToggleSelect: (id: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onStartEdit: (item: VocabularyItem) => void;
  onDeleteWord: (id: string) => void;
  onDoubleClick: (item: VocabularyItem) => void;
}) => (
  <div onDoubleClick={() => onDoubleClick(item)} className="relative group aspect-square rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:!z-20 hover:scale-105 cursor-pointer" style={{ backfaceVisibility: 'hidden' }}>
    {/* Image or Placeholder */}
    {item.imageUrl ? (
      <img src={item.imageUrl} alt={item.word} className="w-full h-full object-cover transition-opacity duration-300" />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <span className="text-5xl filter blur-sm select-none">{getEmojiForWord(item.word)}</span>
      </div>
    )}

    {/* Overlay */}
    <div className="absolute inset-0 bg-white/20 group-hover:bg-black/30 backdrop-blur-[2px] group-hover:backdrop-blur-0 transition-all duration-300 flex items-center justify-center p-2">
      <h3 className="font-bold text-lg text-slate-900 group-hover:text-white text-center break-words transition-all duration-300 group-hover:opacity-0 group-hover:scale-75">{item.word}</h3>
    </div>

    {/* Expanded Info */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        <div className="text-white">
            <h3 className="font-bold text-lg capitalize drop-shadow-lg">{item.word}</h3>
            <p className="text-sm drop-shadow-md text-indigo-300">{item.meaning}</p>
        </div>
    </div>
    
    {/* Controls */}
    <div className="absolute top-1.5 right-1.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
      <button onClick={() => onStartEdit(item)} className="p-1.5 bg-blue-600/70 hover:bg-blue-600 rounded-full text-white" aria-label={`Edit ${item.word}`}>
        <PencilIcon className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => onDeleteWord(item.id)} className="p-1.5 bg-red-600/70 hover:bg-red-600 rounded-full text-white" aria-label={`Delete ${item.word}`}>
        <TrashIcon className="w-3.5 h-3.5" />
      </button>
    </div>
    <div className="absolute top-2 left-2 z-20">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onToggleSelect(item.id, e)}
        className="form-checkbox h-5 w-5 bg-card/50 border-border rounded text-primary focus:ring-primary/50 transition opacity-60 group-hover:opacity-100"
      />
    </div>
  </div>
));

const HeaderCheckbox = ({
    itemIds,
    selectedIds,
    onToggleSelectAll,
}: {
    itemIds: string[];
    selectedIds: Set<string>;
    onToggleSelectAll: (ids: string[], select: boolean) => void;
}) => {
    const checkboxRef = useRef<HTMLInputElement>(null);
    const selectedCount = useMemo(() => itemIds.filter(id => selectedIds.has(id)).length, [itemIds, selectedIds]);

    const isAllSelected = selectedCount > 0 && selectedCount === itemIds.length;
    const isIndeterminate = selectedCount > 0 && selectedCount < itemIds.length;

    useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        onToggleSelectAll(itemIds, e.target.checked);
    };

    return (
        <input
            ref={checkboxRef}
            type="checkbox"
            checked={isAllSelected}
            onChange={handleToggle}
            className="form-checkbox h-5 w-5 bg-card/50 border-border rounded text-primary focus:ring-primary/50 transition"
            aria-label="Select all items in this group"
        />
    );
};


const BrowseDeck: React.FC<BrowseDeckProps> = ({ items, folders, onDeleteWord, onStartEdit, onCreateFolder, onMoveItemsToFolder, onDeleteFolder, isAiReady, onAiRequired, onGenerateExplanations }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openFolders, setOpenFolders] = useState<Set<string>>(() => new Set(folders.map(f => f.id)));
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [itemsToGenerate, setItemsToGenerate] = useState<VocabularyItem[]>([]);
  const [isGeneratingExplanations, setIsGeneratingExplanations] = useState(false);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [quickStudyItem, setQuickStudyItem] = useState<VocabularyItem | null>(null);
  const [isQuickStudyFlipped, setIsQuickStudyFlipped] = useState(false);

  const { itemsByFolder, ungroupedItems, sortedFolders, flatItemIds } = useMemo(() => {
    const itemsByFolder = new Map<string, VocabularyItem[]>();
    const ungroupedItems: VocabularyItem[] = [];
    const folderIdSet = new Set(folders.map(f => f.id));
    items.forEach(item => {
      if (item.folderId && folderIdSet.has(item.folderId)) {
        if (!itemsByFolder.has(item.folderId)) itemsByFolder.set(item.folderId, []);
        itemsByFolder.get(item.folderId)!.push(item);
      } else {
        ungroupedItems.push(item);
      }
    });

    const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name));
    itemsByFolder.forEach(v => v.sort((a,b) => a.word.localeCompare(b.word)));
    ungroupedItems.sort((a, b) => a.word.localeCompare(b.word));
    
    const flatItemIds = [
        ...sortedFolders.flatMap(f => (itemsByFolder.get(f.id) || []).map(i => i.id)),
        ...ungroupedItems.map(i => i.id)
    ];

    return { itemsByFolder, ungroupedItems, sortedFolders, flatItemIds };
  }, [items, folders]);

  const handleToggleSelect = useCallback((id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        if ((event.nativeEvent as MouseEvent).shiftKey && lastSelectedId) {
            const lastIndex = flatItemIds.indexOf(lastSelectedId);
            const currentIndex = flatItemIds.indexOf(id);
            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                for (let i = start; i <= end; i++) {
                    newSet.add(flatItemIds[i]);
                }
            }
        } else {
             if (newSet.has(id)) newSet.delete(id);
             else newSet.add(id);
             setLastSelectedId(id);
        }
        return newSet;
    });
  }, [lastSelectedId, flatItemIds]);

  const handleToggleSelectAll = (ids: string[], select: boolean) => {
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (select) ids.forEach(id => newSet.add(id));
        else ids.forEach(id => newSet.delete(id));
        return newSet;
    });
  };
  
  const handleToggleFolder = useCallback((folderId: string) => {
    setOpenFolders(prev => {
        const newSet = new Set(prev);
        if(newSet.has(folderId)) newSet.delete(folderId);
        else newSet.add(folderId);
        return newSet;
    })
  }, []);

  const handleMoveSelected = (folderId: string | null) => {
    onMoveItemsToFolder(Array.from(selectedIds), folderId);
    setSelectedIds(new Set());
  };

  const handleOpenHintModal = () => {
    if (!isAiReady) {
        onAiRequired();
        return;
    }
    const selectedItems = items.filter(item => selectedIds.has(item.id));
    if (selectedItems.length > 0) {
        setItemsToGenerate(selectedItems);
        setIsHintModalOpen(true);
    }
  };
  
  const handleGenerateWithHint = async (hint: string) => {
    const ids = itemsToGenerate.map(item => item.id);
    if (ids.length > 0) {
        setIsGeneratingExplanations(true);
        try {
            await onGenerateExplanations(ids, hint);
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Failed to generate explanations", error);
            // In a real app, you'd show a user-facing error.
        } finally {
            setIsGeneratingExplanations(false);
        }
    }
  };
  
  const handleQuickStudy = (item: VocabularyItem) => {
    setQuickStudyItem(item);
    setIsQuickStudyFlipped(false);
  };

  const handleCloseQuickStudy = () => {
    setQuickStudyItem(null);
  };

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 bg-card/50 rounded-2xl">
        <h2 className="text-2xl font-bold mb-2 text-card-foreground">Your deck is empty.</h2>
        <p>Switch to "Add Words" mode to create your first flashcard!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <MoveToFolderModal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} folders={sortedFolders} selectedItemCount={selectedIds.size} onCreateFolder={onCreateFolder} onMoveItemsToFolder={handleMoveSelected}/>
      <GenerateHintModal
        isOpen={isHintModalOpen}
        onClose={() => setIsHintModalOpen(false)}
        onSubmit={handleGenerateWithHint}
        itemsToGenerate={itemsToGenerate}
      />
      
      {selectedIds.size > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-auto bg-popover/80 backdrop-blur-sm border rounded-full shadow-lg z-40 p-2 flex items-center gap-2">
            <span className="text-sm font-medium text-popover-foreground pl-3 pr-1">{selectedIds.size} selected</span>
            <button onClick={() => setIsMoveModalOpen(true)} className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition">Move</button>
            <button 
                onClick={handleOpenHintModal}
                disabled={isGeneratingExplanations}
                className="px-4 py-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-full transition flex items-center disabled:bg-teal-900 disabled:cursor-wait"
            >
                <SparklesIcon className="w-4 h-4 mr-1.5" />
                {isGeneratingExplanations ? 'Generating...' : 'AI Explanations'}
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="px-4 py-2 text-sm font-semibold hover:bg-accent text-muted-foreground hover:text-accent-foreground rounded-full transition">Deselect All</button>
          </div>
      )}
      
      {sortedFolders.map(folder => {
        const folderItems = itemsByFolder.get(folder.id) || [];
        const isOpen = openFolders.has(folder.id);
        return (
          <div key={folder.id} className="bg-card/50 rounded-xl">
            <header className="p-3 cursor-pointer flex justify-between items-center" onClick={() => handleToggleFolder(folder.id)}>
              <div className="flex items-center gap-3">
                 <HeaderCheckbox itemIds={folderItems.map(i => i.id)} selectedIds={selectedIds} onToggleSelectAll={handleToggleSelectAll} />
                 <FolderIcon className="w-6 h-6 text-primary"/>
                 <h2 className="text-xl font-bold text-card-foreground">{folder.name} ({folderItems.length})</h2>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={(e) => { e.stopPropagation(); if(window.confirm(`Are you sure you want to delete the folder "${folder.name}"? This won't delete the cards inside.`)) onDeleteFolder(folder.id); }} className="p-2 text-muted-foreground hover:text-destructive"><TrashIcon className="w-4 h-4"/></button>
                <ChevronDownIcon className={`w-6 h-6 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </header>
            <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                      {folderItems.map(item => (
                        <CardItem key={item.id} item={item} isSelected={selectedIds.has(item.id)} onToggleSelect={handleToggleSelect} onStartEdit={onStartEdit} onDeleteWord={onDeleteWord} onDoubleClick={handleQuickStudy} />
                      ))}
                    </div>
                </div>
            </div>
          </div>
        )
      })}

      {ungroupedItems.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4 border-b pb-2">
            <HeaderCheckbox itemIds={ungroupedItems.map(i => i.id)} selectedIds={selectedIds} onToggleSelectAll={handleToggleSelectAll} />
            <h2 className="text-xl font-bold text-muted-foreground">Ungrouped Items ({ungroupedItems.length})</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {ungroupedItems.map(item => (
              <CardItem key={item.id} item={item} isSelected={selectedIds.has(item.id)} onToggleSelect={handleToggleSelect} onStartEdit={onStartEdit} onDeleteWord={onDeleteWord} onDoubleClick={handleQuickStudy}/>
            ))}
          </div>
        </div>
      )}

      {/* Quick Study Modal */}
      {quickStudyItem && (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
            onClick={handleCloseQuickStudy}
        >
            <div 
                className="w-full max-w-xl h-96 p-4"
                onClick={(e) => { e.stopPropagation(); setIsQuickStudyFlipped(f => !f); }}
            >
                <Flashcard item={quickStudyItem} isFlipped={isQuickStudyFlipped} />
            </div>
        </div>
      )}
    </div>
  );
};

export default BrowseDeck;