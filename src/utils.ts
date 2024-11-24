import { ModelType, ChatMessage, SambanovaError } from './types';
import fs from 'fs';
import axios from 'axios';

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

export const getBase64Image = async (pathOrUrl: string): Promise<string> => {
  try {
    if (pathOrUrl.startsWith('http')) {
      const response = await axios.get(pathOrUrl, { responseType: 'arraybuffer' });
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      const mimeType = response.headers['content-type']; 
      return `data:${mimeType};base64,${base64Image}`;
    } else {
      const image = fs.readFileSync(pathOrUrl);
      const base64Image = image.toString('base64');
      const mimeType = 'image/jpeg'; 
      return `data:${mimeType};base64,${base64Image}`;
    }
  } catch (error) {
    throw new Error(`Failed to process image: ${pathOrUrl}. Error: ${error}`);
  }
};