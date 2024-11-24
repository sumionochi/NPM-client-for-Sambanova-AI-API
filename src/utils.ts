import { ModelType, ChatMessage, SambanovaError } from './types';

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const isVisionModel = (model: ModelType): boolean => {
  return model.toLowerCase().includes('vision');
};

export const validateMessage = (message: ChatMessage, isVision: boolean) => {
  if (Array.isArray(message.content)) {
    if (!isVision) {
      throw new SambanovaError(
        'Array content is only supported for vision models',
        400,
        'INVALID_MESSAGE_FORMAT'
      );
    }
  } else if (isVision) {
    throw new SambanovaError(
      'Vision models require array content format',
      400,
      'INVALID_MESSAGE_FORMAT'
    );
  }
};