/**
 * data/index.ts — 统一数据加载层
 */

import type {
  Question, SpecialQuestion, PersonalityType, NormalType,
  DimensionMeta, DimExplanations, TypeImages, DimensionKey,
} from '../types';

import _questions from './questions.json';
import _specialQuestions from './special-questions.json';
import _typeLibrary from './type-library.json';
import _typeImages from './type-images.json';
import _normalTypes from './normal-types.json';
import _dimExplanations from './dim-explanations.json';
import _dimensionMeta from './dimension-meta.json';
import _dimensionOrder from './dimension-order.json';

export const questions = _questions as unknown as Question[];
export const specialQuestions = _specialQuestions as unknown as SpecialQuestion[];
export const typeLibrary = _typeLibrary as Record<string, PersonalityType>;
export const typeImages = _typeImages as TypeImages;
export const normalTypes = _normalTypes as NormalType[];
export const dimExplanations = _dimExplanations as DimExplanations;
export const dimensionMeta = _dimensionMeta as Record<DimensionKey, DimensionMeta>;
export const dimensionOrder = _dimensionOrder as DimensionKey[];
