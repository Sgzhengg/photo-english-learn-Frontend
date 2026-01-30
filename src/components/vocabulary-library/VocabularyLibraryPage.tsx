// =============================================================================
// PhotoEnglish - Vocabulary Library Page
// =============================================================================

import { useState, useMemo } from 'react';
import { VocabularyList } from '@/sections/vocabulary-library/components/VocabularyList';
import { WordDetail } from '@/sections/vocabulary-library/components/WordDetail';
import vocabularyData from '@/../product/sections/vocabulary-library/data.json';

// Use the types from the product design
import type { Word, Tag, ViewMode, SortOption } from '@/../product/sections/vocabulary-library/types';

export function VocabularyLibraryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('addedDate');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [wordToDelete, setWordToDelete] = useState<Word | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get words and tags from mock data - use type assertions for JSON data
  const words = vocabularyData.words as Word[];
  const tags = vocabularyData.tags as Tag[];

  // Filter and sort words
  const filteredWords = useMemo(() => {
    let result = [...words];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(word =>
        word.word.toLowerCase().includes(query) ||
        word.definition.toLowerCase().includes(query)
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      result = result.filter(word =>
        word.tags.some(tag => selectedTags.includes(tag))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'addedDate':
        result.sort((a, b) =>
          new Date(b.learningRecord.addedDate).getTime() - new Date(a.learningRecord.addedDate).getTime()
        );
        break;
      case 'reviewCount':
        result.sort((a, b) => b.learningRecord.reviewCount - a.learningRecord.reviewCount);
        break;
      case 'masteryLevel':
        const order = { mastered: 0, familiar: 1, learning: 2 };
        result.sort((a, b) => order[a.learningRecord.masteryLevel] - order[b.learningRecord.masteryLevel]);
        break;
      case 'alphabetical':
        result.sort((a, b) => a.word.localeCompare(b.word));
        break;
    }

    return result;
  }, [words, searchQuery, selectedTags, sortBy]);

  // Event handlers
  const handlePlayPronunciation = (wordId: string) => {
    const word = words.find(w => w.id === wordId);
    if (word) {
      // Use Web Speech API
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleViewDetails = (wordId: string) => {
    const word = words.find(w => w.id === wordId);
    if (word) {
      setSelectedWord(word);
    }
  };

  const handleCloseDetail = () => {
    setSelectedWord(null);
  };

  const handleStartPractice = (_wordId: string) => {
    // Navigate to practice page
    window.location.href = '/app/practice';
  };

  const handleDeleteWord = (wordId: string) => {
    const word = words.find(w => w.id === wordId);
    if (word) {
      setWordToDelete(word);
      setShowDeleteConfirm(true);
    }
  };

  const handleConfirmDelete = () => {
    if (wordToDelete) {
      // In a real app, would call API to delete
      // For now, just close the dialog
      setShowDeleteConfirm(false);
      setWordToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setWordToDelete(null);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <VocabularyList
        words={filteredWords}
        tags={tags}
        viewMode={viewMode}
        sortBy={sortBy}
        searchQuery={searchQuery}
        selectedTags={selectedTags}
        onViewModeChange={setViewMode}
        onSortChange={(option) => setSortBy(option as SortOption)}
        onSearchChange={setSearchQuery}
        onTagToggle={(tagId) => {
          setSelectedTags(prev =>
            prev.includes(tagId)
              ? prev.filter(t => t !== tagId)
              : [...prev, tagId]
          );
        }}
        onPlayPronunciation={handlePlayPronunciation}
        onViewDetails={handleViewDetails}
        onStartPractice={handleStartPractice}
        onDeleteWord={handleDeleteWord}
      />

      {/* Word Detail Modal */}
      {selectedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <WordDetail
              word={selectedWord}
              onBack={handleCloseDetail}
              onPlayPronunciation={handlePlayPronunciation}
              onStartPractice={handleStartPractice}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && wordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              确认删除单词
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              确定要删除单词 "<span className="font-semibold text-indigo-600 dark:text-indigo-400">{wordToDelete.word}</span>" 吗？此操作无法撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-5 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
