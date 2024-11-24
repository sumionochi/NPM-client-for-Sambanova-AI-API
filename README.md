# Sambanova JavaScript/TypeScript Client

A JavaScript/TypeScript client for the Sambanova AI API. This package provides an easy way to interact with Sambanova's language and vision models.

## Installation

```bash
npm install sambanova-js
```

## Quick Start

```javascript
import { SambanovaClient } from 'sambanova-js';

// Initialize the client
const client = new SambanovaClient('YOUR_API_KEY');

// Text completion
async function textExample() {
  const response = await client.chat([
    { role: 'user', content: 'Hello!' }
  ], {
    model: 'Meta-Llama-3.2-3B-Instruct'
  });
  console.log(response.choices[0].message.content);
}

// Vision analysis
async function visionExample() {
  const response = await client.chat([
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        { type: 'image_url', image_url: { url: 'your_image_url_here' }}
      ]
    }
  ], {
    model: 'Llama-3.2-11B-Vision-Instruct'
  });
  console.log(response.choices[0].message.content);
}
```

## Features

- Support for all Sambanova language and vision models
- TypeScript support with full type definitions
- Error handling and automatic retries
- Streaming support
- Vision model integration

## Supported Models

### Vision Models
- `Llama-3.2-11B-Vision-Instruct`
- `Llama-3.2-90B-Vision-Instruct`

### Language Models
- `Meta-Llama-3.1-8B-Instruct`
- `Meta-Llama-3.1-70B-Instruct`
- `Meta-Llama-3.1-405B-Instruct`
- `Meta-Llama-3.2-1B-Instruct`
- `Meta-Llama-3.2-3B-Instruct`

## Advanced Usage

### Streaming

```javascript
(async () => {
  try {
    for await (const chunk of client.streamChat([
      { role: 'user', content: 'Tell me a story' }
    ])) {
      process.stdout.write(chunk.choices[0].message.content);
    }
  } catch (error) {
    console.error('Stream Chat Error:', error);
  }
})();
```

### Error Handling

```javascript
import { SambanovaClient, SambanovaError } from 'sambanova-js';

try {
  const response = await client.chat([
    { role: 'user', content: 'Hello' }
  ]);
  console.log(response.choices[0].message.content);
} catch (error) {
  if (error instanceof SambanovaError) {
    console.error(`API Error: ${error.message} (Code: ${error.code})`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Configuration Options

```javascript
const client = new SambanovaClient('YOUR_API_KEY', {
  baseUrl: 'https://api.sambanova.ai/v1',
  defaultModel: 'Meta-Llama-3.2-3B-Instruct',
  defaultRetryCount: 3,
  defaultRetryDelay: 1000
});
```

## License

[MIT](LICENSE)