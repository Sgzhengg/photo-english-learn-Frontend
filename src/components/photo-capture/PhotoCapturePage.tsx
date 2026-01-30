// =============================================================================
// PhotoEnglish - Photo Capture Page
// =============================================================================

import { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { PhotoCaptureResult } from '@/sections/photo-capture/components/PhotoCaptureResult';
import type { Photo } from '@/sections/photo-capture/types';

// Mock data for demonstration
const mockPhotos: Photo[] = [
  {
    id: 'photo-001',
    userId: 'mock-user-001',
    imageUrl: '/sample-images/coffee-shop.jpg',
    thumbnailUrl: '/sample-images/coffee-shop-thumb.jpg',
    capturedAt: new Date().toISOString(),
    location: '咖啡厅',
    status: 'completed',
    recognizedWords: [
      {
        id: 'word-001',
        word: 'laptop',
        phonetic: '/ˈlæptɒp/',
        definition: '笔记本电脑',
        pronunciationUrl: '/audio/laptop.mp3',
        isSaved: false,
        positionInSentence: 3,
      },
      {
        id: 'word-002',
        word: 'coffee',
        phonetic: '/ˈkɒfi/',
        definition: '咖啡',
        pronunciationUrl: '/audio/coffee.mp3',
        isSaved: false,
        positionInSentence: 6,
      },
      {
        id: 'word-003',
        word: 'cup',
        phonetic: '/kʌp/',
        definition: '杯子',
        pronunciationUrl: '/audio/cup.mp3',
        isSaved: false,
        positionInSentence: 7,
      },
      {
        id: 'word-004',
        word: 'menu',
        phonetic: '/ˈmenjuː/',
        definition: '菜单',
        pronunciationUrl: '/audio/menu.mp3',
        isSaved: false,
        positionInSentence: -1,
      },
    ],
    sceneDescription: 'A person is working on their laptop while enjoying a fresh cup of coffee.',
    sceneTranslation: '一个人正在用笔记本电脑工作，同时享受着一杯新鲜冲泡的咖啡。',
  },
];

export function PhotoCapturePage() {
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    const imageUrl = URL.createObjectURL(file);

    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Use mock data (in real app, would call OCR API)
    const mockPhoto = { ...mockPhotos[0] };
    mockPhoto.id = `photo-${Date.now()}`;
    mockPhoto.imageUrl = imageUrl;
    mockPhoto.thumbnailUrl = imageUrl;
    mockPhoto.capturedAt = new Date().toISOString();

    setCurrentPhoto(mockPhoto);
    setIsCapturing(false);
  };

  // Handle word pronunciation (Web Speech API)
  const handlePlayWordPronunciation = (wordId: string) => {
    const word = currentPhoto?.recognizedWords.find(w => w.id === wordId);
    if (!word) return;

    // Use Web Speech API
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Handle save word
  const handleSaveWord = async (wordId: string) => {
    if (!currentPhoto) return;

    // Update local state
    setCurrentPhoto({
      ...currentPhoto,
      recognizedWords: currentPhoto.recognizedWords.map(word =>
        word.id === wordId ? { ...word, isSaved: true } : word
      ),
    });
  };

  // Handle unsave word
  const handleUnsaveWord = async (wordId: string) => {
    if (!currentPhoto) return;

    // Update local state
    setCurrentPhoto({
      ...currentPhoto,
      recognizedWords: currentPhoto.recognizedWords.map(word =>
        word.id === wordId ? { ...word, isSaved: false } : word
      ),
    });
  };

  // Handle play scene (TTS with word highlighting)
  const handlePlayScene = () => {
    if (!currentPhoto) return;

    const words = currentPhoto.sceneDescription.split(' ');
    const sentence = currentPhoto.sceneDescription;
    let currentIndex = 0;
    setIsPlaying(true);
    setCurrentWordIndex(0);

    // Calculate average word duration based on sentence length
    const avgWordDuration = Math.max(300, 60000 / (words.length * 2));

    // Highlight words while speaking the complete sentence
    const highlightNextWord = () => {
      if (currentIndex >= words.length) {
        setTimeout(() => {
          setIsPlaying(false);
          setCurrentWordIndex(0);
        }, 500);
        return;
      }

      setCurrentWordIndex(currentIndex);
      currentIndex++;
      setTimeout(highlightNextWord, avgWordDuration);
    };

    // Speak the complete sentence naturally
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentWordIndex(0);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setCurrentWordIndex(0);
    };

    window.speechSynthesis.speak(utterance);
    highlightNextWord();
  };

  // Handle pause scene
  const handlePauseScene = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  // Handle stop scene
  const handleStopScene = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentWordIndex(0);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Content */}
      {!currentPhoto ? (
        // Empty state - camera interface
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center">
            {/* Camera icon with pulse animation */}
            <div className="mb-6 relative inline-flex">
              <div className="absolute inset-0 rounded-full bg-indigo-400 opacity-20 animate-ping"></div>
              <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-8 shadow-2xl">
                <Camera className="w-16 h-16 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              拍照识别单词
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xs mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              拍摄包含英文的图片，AI 将自动识别单词并显示释义
            </p>

            {/* Capture button */}
            <button
              onClick={handleCapture}
              disabled={isCapturing}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold px-8 py-4 rounded-full shadow-lg disabled:cursor-not-allowed transition-all"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {isCapturing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  识别中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  选择图片
                </span>
              )}
            </button>

            {/* Tips */}
            <div className="mt-12 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl max-w-sm mx-auto">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                💡 小贴士
              </h3>
              <ul className="text-xs text-slate-600 dark:text-slate-400 text-left space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                <li>• 拍摄包含英文单词的图片</li>
                <li>• 确保文字清晰可见</li>
                <li>• 避免模糊或反光</li>
                <li>• 一次可识别多个单词</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        // Show recognition result
        <PhotoCaptureResult
          currentPhoto={currentPhoto}
          isCapturing={isCapturing}
          currentWordIndex={currentWordIndex}
          isPlaying={isPlaying}
          onCapture={handleCapture}
          onPlayWordPronunciation={handlePlayWordPronunciation}
          onSaveWord={handleSaveWord}
          onUnsaveWord={handleUnsaveWord}
          onPlayScene={handlePlayScene}
          onPauseScene={handlePauseScene}
          onStopScene={handleStopScene}
        />
      )}
    </div>
  );
}
