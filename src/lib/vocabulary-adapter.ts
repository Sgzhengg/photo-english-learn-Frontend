// =============================================================================
// PhotoEnglish - Vocabulary Data Adapter
// =============================================================================

/**
 * 适配器模块：将后端API响应转换为前端数据格式
 */

import type { UserWordResponse } from '@/types/api';
import type { Word } from '@/../product/sections/vocabulary-library/types';

/**
 * 将后端 UserWordResponse 转换为前端 Word 类型
 *
 * @param userWord 后端API返回的用户生词数据
 * @returns 前端使用的Word对象
 */
export function adaptUserWordToWord(userWord: UserWordResponse): Word {
  const baseWord = userWord.word;

  return {
    id: String(userWord.id), // 使用 UserWord.id（用于删除）
    word: baseWord?.english_word || '',
    phonetic: baseWord?.phonetic_us || '',
    definition: baseWord?.chinese_meaning || '',
    partOfSpeech: 'n.',
    examples: baseWord?.example_sentence && baseWord?.example_translation
      ? [{
          sentence: baseWord.example_sentence,
          translation: baseWord.example_translation,
          fromPhoto: userWord.scene_id ? String(userWord.scene_id) : null,
        }]
      : [],
    pronunciationUrl: baseWord?.audio_url || '',
    sourcePhoto: baseWord?.image_url
      ? {
          id: `photo-${userWord.scene_id || 'unknown'}`,
          thumbnailUrl: baseWord.image_url,
          location: '识别场景',
          capturedAt: userWord.created_at,
        }
      : undefined,
    learningRecord: {
      addedDate: userWord.created_at,
      reviewCount: 0, // 后端暂未提供
      masteryLevel: 'learning',
      lastReviewDate: userWord.created_at,
    },
    tags: userWord.tag ? [userWord.tag.tag_name] : [],
  };
}

/**
 * 将后端 UserWordResponse 列表转换为前端 Word 列表
 *
 * @param userWords 后端API返回的用户生词列表
 * @returns 前端使用的Word对象数组
 */
export function adaptUserWordsToWords(userWords: UserWordResponse[]): Word[] {
  return userWords.map(adaptUserWordToWord);
}
