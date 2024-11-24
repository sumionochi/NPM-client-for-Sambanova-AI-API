# Sambanova JavaScript/TypeScript Client

A JavaScript/TypeScript client for the Sambanova AI API. This package provides an easy way to interact with Sambanova's language and vision models.

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) version 16 or higher
- A valid Sambanova API key

### Install the Package

```bash
npm install sambanova
```

---

## Connect with Me

- **GitHub:** [github.com/sumionochi](https://github.com/sumionochi/NPM-client-for-Sambanova-AI-API)
- **LinkedIn:** [aaditya-srivastava-connect](https://www.linkedin.com/in/aaditya-srivastava-connect/)
- **Instagram:** [mito.wins.uncensored](https://www.instagram.com/mito.wins.uncensored/)
- **Twitter (X):** [sumionochi](https://x.com/sumionochi)

---

## Quick Start

### Text Completion

```javascript
import { SambanovaClient } from 'sambanova';

// Initialize the client
const client = new SambanovaClient('YOUR_API_KEY');

// Text completion example
async function textExample() {
  const response = await client.chat([
    { role: 'user', content: 'Hello!' }
  ], {
    model: 'Meta-Llama-3.2-3B-Instruct'
  });
  console.log(response.choices[0].message.content);
}

textExample();
```

### Vision Analysis (Online Image URL)

```javascript
import { SambanovaClient } from 'sambanova';

// Initialize the client
const client = new SambanovaClient('YOUR_API_KEY');

// Vision analysis example
async function visionExample() {
  const response = await client.chat([
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        { type: 'image_url', image_url: { url: 'https://example.com/sample.jpg' }} // Online image URL
      ]
    }
  ], {
    model: 'Llama-3.2-11B-Vision-Instruct'
  });
  console.log(response.choices[0].message.content);
}

visionExample();
```

---

## Features

- Support for all Sambanova language and vision models.
- TypeScript support with full type definitions.
- Error handling and automatic retries.
- Streaming support for text and vision models.
- Vision model integration with **online image URLs** and **local file paths**.

---

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

---

## Vision Model Details

The vision models allow you to analyze and interpret images using Sambanova's advanced AI capabilities. They support both **online image URLs** and **local file paths**, automatically converting images to base64 format as needed.

### Key Features of Vision Models

- **Analyze Images:** Describe objects, scenes, or abstract concepts in an image.
- **Flexibility:** Use either online image URLs or local file paths.
- **Automatic Processing:** The client handles base64 conversion, simplifying integration.
- **Streaming Support:** Receive incremental responses for large images.

#### Online Image URL Example

```javascript
const response = await client.chat([
  {
    role: 'user',
    content: [
      { type: 'text', text: 'What is in this image?' },
      { type: 'image_url', image_url: { url: 'https://example.com/sample.jpg' }} // Online URL
    ]
  }
], {
  model: 'Llama-3.2-11B-Vision-Instruct'
});
console.log(response.choices[0].message.content);
```

#### Local Image File Example

```javascript
const response = await client.chat([
  {
    role: 'user',
    content: [
      { type: 'text', text: 'What is in this image?' },
      { type: 'image_url', image_url: { url: './path/to/image.jpg' }} // Local file path
    ]
  }
], {
  model: 'Llama-3.2-11B-Vision-Instruct'
});
console.log(response.choices[0].message.content);
```

---

## Advanced Usage

### Streaming

The Sambanova client supports streaming responses for both text and vision models. With streaming, you can receive incremental responses from the API as they are generated, reducing latency for the first output.

#### Text Streaming Example

```javascript
(async () => {
  try {
    console.log('Streaming Response:');
    for await (const chunk of client.streamChat([
      { role: 'user', content: 'Tell me a story about a brave knight.' }
    ], {
      model: 'Meta-Llama-3.1-8B-Instruct'
    })) {
      process.stdout.write(chunk.choices[0].message.content);
    }
  } catch (error) {
    console.error('Stream Chat Error:', error);
  }
})();
```

#### Vision Streaming Example

```javascript
(async () => {
  try {
    console.log('Streaming Vision Response:');
    for await (const chunk of client.streamChat([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'What do you see in this image?' },
          { type: 'image_url', image_url: { url: 'https://example.com/sample.jpg' }}
        ]
      }
    ], {
      model: 'Llama-3.2-11B-Vision-Instruct'
    })) {
      process.stdout.write(chunk.choices[0].message.content);
    }
  } catch (error) {
    console.error('Stream Vision Error:', error);
  }
})();
```

---

## Error Handling

```javascript
import { SambanovaClient, SambanovaError } from 'sambanova';

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

---

## Configuration Options

```javascript
const client = new SambanovaClient('YOUR_API_KEY', {
  baseUrl: 'https://api.sambanova.ai/v1',
  defaultModel: 'Meta-Llama-3.2-3B-Instruct',
  defaultRetryCount: 3,
  defaultRetryDelay: 1000
});
```

---

---

## Oneshot Example To Test All Features

### Note:

Add your Sambanova API key and add Local image file path. A test Online image file URL is already in place but you can replace as needed.

```javascript
import { SambanovaClient, ChatMessage, ModelType } from 'sambanova';

import path from 'path';

// Replace with your actual API key
const API_KEY = 'Your API Key';

async function testSambanova() {
  try {
    // Initialize the Sambanova client
    const client = new SambanovaClient(API_KEY);

    // Test 1: Text completion
    console.log('Starting text completion test...');
    const textMessages: ChatMessage[] = [
      { role: 'user', content: 'What is the capital of France?' }
    ];

    const textResponse = await client.chat(textMessages, {
      model: 'Meta-Llama-3.2-3B-Instruct' as ModelType 
    });

    console.log('Text Completion Response:');
    console.log(textResponse.choices[0].message.content);

    // Test 2: Vision analysis with an online image URL
    console.log('Starting vision analysis test with an online image URL...');
    const onlineImageMessages: ChatMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'What is in this image?' },
          {
            type: 'image_url',
            image_url: { url: 'https://picsum.photos/200/300' } // Online image URL
          }
        ]
      }
    ];

    const onlineImageResponse = await client.chat(onlineImageMessages, {
      model: 'Llama-3.2-11B-Vision-Instruct' as ModelType 
    });

    console.log('Vision Analysis (Online Image) Response:');
    console.log(onlineImageResponse.choices[0].message.content);

    //Test 3: Vision analysis with a local image file
    console.log('Starting vision analysis test with a local image file...');
    const localImagePath = path.resolve(__dirname, 'image.jpg'); // Replace with your local image path
    const localImageMessages: ChatMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'What is in this image?' },
          {
            type: 'image_url',
            image_url: { url: localImagePath } // Local image file
          }
        ]
      }
    ];

    const localImageResponse = await client.chat(localImageMessages, {
      model: 'Llama-3.2-11B-Vision-Instruct' as ModelType 
    });

    console.log('Vision Analysis (Local Image) Response:');
    console.log(localImageResponse.choices[0].message.content);

    // Test 4: Stream chat
    console.log('Starting text stream...');
    const textMessages2: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Tell me a story about a brave knight.' }
    ];

    console.log('Streamed Text Response:');
    for await (const chunk of client.streamChat(textMessages2, {
      model: 'Meta-Llama-3.1-8B-Instruct' as ModelType
    })) {
      process.stdout.write(chunk);
    }

    console.log('\nStarting image stream...');
    const imageMessages: ChatMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'What do you see in this image?' },
          { type: 'image_url', image_url: { url: 'https://picsum.photos/200/300' } }
        ]
      }
    ];

    console.log('Streamed Image Response:');
    for await (const chunk of client.streamChat(imageMessages, {
      model: 'Llama-3.2-11B-Vision-Instruct' as ModelType
    })) {
      process.stdout.write(chunk);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testSambanova();
```

---

## Changelog

### v1.0.5

- **Feature:** Added support for streaming responses for both text and vision models.
- **Improvement:** Automatic image URL-to-base64 conversion for vision models.
- **Documentation:** Expanded README with detailed examples and instructions.

### v1.0.3

- **Online Image URL Support:** Provide a direct image URL (e.g., https://example.com/image.jpg).
- **Local File Path Support:** Provide a local file path (e.g., ./path/to/image.jpg).
- The client automatically processes the image, converting it to base64 format before sending the request.

---

## License

MIT
```
