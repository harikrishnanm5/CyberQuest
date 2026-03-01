/**
 * Local AI Service - Connects to locally running AI models
 * Supports Ollama, LM Studio, and other local inference servers
 */

import { InterviewQuestion, AssessmentResult, SkillCategory } from '../types';
import hardwareProfile from './hardwareProfile.json';

// recommended model from hardware detection script
const RECOMMENDED_MODEL = hardwareProfile.model;

// Configuration for local AI endpoints
const LOCAL_AI_CONFIG = {
  // Default Ollama endpoint (most common)
  OLLAMA: {
    baseUrl: 'http://localhost:11434',
    defaultModel: 'llama-3.2-3b-instruct',
    availableModels: ['llama-3.2-3b-instruct', 'meta-llama-3.1-8b-instruct'],
  },
  // LM Studio endpoint
  LM_STUDIO: {
    baseUrl: 'http://127.0.0.1:1234',
    defaultModel: 'llama-3.2-3b',
  },
  // Custom endpoint (user configurable)
  CUSTOM: {
    baseUrl: localStorage.getItem('localAIEndpoint') || 'http://localhost:11434',
    defaultModel: localStorage.getItem('localAIModel') || 'llama3.2:3b',
  },
};

// Type for local AI provider
export type LocalAIProvider = 'ollama' | 'lmstudio' | 'custom';

// Get current provider configuration
const getProviderConfig = (provider: LocalAIProvider = 'ollama') => {
  switch (provider) {
    case 'ollama':
      return LOCAL_AI_CONFIG.OLLAMA;
    case 'lmstudio':
      return LOCAL_AI_CONFIG.LM_STUDIO;
    case 'custom':
      return LOCAL_AI_CONFIG.CUSTOM;
    default:
      return LOCAL_AI_CONFIG.OLLAMA;
  }
};

/**
 * Check if local AI service is available
 */
export const checkLocalAIStatus = async (provider: LocalAIProvider = 'ollama'): Promise<{
  available: boolean;
  models?: string[];
  error?: string;
}> => {
  const config = getProviderConfig(provider);

  try {
    if (provider === 'ollama') {
      // Check Ollama availability
      const response = await fetch(`${config.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Ollama not responding: ${response.status}`);
      }

      const data = await response.json();
      const models = data.models?.map((m: any) => m.name) || [];

      return {
        available: true,
        models,
      };
    } else if (provider === 'lmstudio') {
      // LM Studio check - try multiple endpoints
      try {
        // Try the models endpoint first
        const response = await fetch(`${config.baseUrl}/v1/models`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          const models = data.data?.map((m: any) => m.id) || [];
          return {
            available: true,
            models: models.length > 0 ? models : [config.defaultModel],
          };
        }
      } catch (e) {
        // If models endpoint fails, try a simple chat completion to verify
        console.log('Models endpoint failed, trying chat completion...');
      }

      // Fallback: try a simple completion to verify server is running
      try {
        const testResponse = await fetch(`${config.baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.defaultModel,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5,
          }),
        });

        if (testResponse.ok) {
          return {
            available: true,
            models: [config.defaultModel],
          };
        }
      } catch (e) {
        throw new Error('LM Studio not responding. Make sure the server is running.');
      }

      throw new Error('LM Studio not responding');
    } else {
      // Generic check for custom endpoints
      const response = await fetch(`${config.baseUrl}/v1/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Service not responding: ${response.status}`);
      }

      const data = await response.json();
      const models = data.data?.map((m: any) => m.id) || [];

      return {
        available: true,
        models,
      };
    }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Generate a response from local AI
 */
export const generateLocalResponse = async (
  prompt: string,
  options: {
    provider?: LocalAIProvider;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}
): Promise<string> => {
  const {
    provider = 'ollama',
    model,
    temperature = 0.3, // Lower default for more factual responses
    maxTokens = 2048,
    systemPrompt,
  } = options;

  const config = getProviderConfig(provider);
  const selectedModel = model || config.defaultModel;

  // Format prompt for better results with smaller models
  const formattedPrompt = systemPrompt
    ? `<|system|>${systemPrompt}</|system|>
<|user|>${prompt}</|user|>
<|assistant|>`
    : prompt;

  try {
    if (provider === 'ollama') {
      // Ollama API format
      const response = await fetch(`${config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: formattedPrompt,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens,
            top_p: 0.9, // Nucleus sampling - reduces hallucination
            top_k: 40, // Limits token selection
            repeat_penalty: 1.1, // Reduces repetition
            stop: ['<|user|>', '<|system|>', '</|assistant|>'], // Stop sequences
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const data = await response.json();
      return data.response || '';

    } else {
      // OpenAI-compatible format (LM Studio, etc.)
      const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    }
  } catch (error) {
    console.error('Local AI Error:', error);
    throw error;
  }
};

/**
 * Stream response from local AI (for real-time chat)
 */
export const streamLocalResponse = async (
  prompt: string,
  onChunk: (chunk: string) => void,
  options: {
    provider?: LocalAIProvider;
    model?: string;
    temperature?: number;
    systemPrompt?: string;
  } = {}
): Promise<void> => {
  const {
    provider = 'ollama',
    model,
    temperature = 0.7,
    systemPrompt,
  } = options;

  const config = getProviderConfig(provider);
  const selectedModel = model || config.defaultModel;

  try {
    if (provider === 'ollama') {
      const response = await fetch(`${config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
          stream: true,
          options: { temperature },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                onChunk(data.response);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } else {
      // OpenAI-compatible streaming
      const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          temperature,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Local AI Streaming Error:', error);
    throw error;
  }
};

/**
 * Get interview question from local AI
 */
export const getLocalInterviewQuestion = async (
  topic: SkillCategory,
  questionNumber: number,
  previousQAs: { question: string; answer: string; correct: boolean }[] = []
): Promise<InterviewQuestion> => {
  const systemPrompt = `You are an expert cybersecurity interviewer. Generate a multiple-choice question about ${topic.replace('_', ' ')}.

CRITICAL INSTRUCTIONS TO PREVENT HALLUCINATION:
1. Only ask questions about REAL, WELL-ESTABLISHED cybersecurity concepts
2. Use ACTUAL tool names, protocols, and standards (e.g., nmap, Wireshark, TCP/IP, AES, RSA)
3. NEVER invent fictional tools, protocols, or acronyms
4. Keep questions grounded in real-world cybersecurity practices
5. If unsure, stick to common industry standards and tools

The question should be:
- Relevant to ${topic.replace('_', ' ')}
- At appropriate difficulty level
- Have 4 options with only one correct answer
- Based on REAL cybersecurity knowledge

Respond in this exact JSON format:
{
  "text": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Exact text of correct option",
  "explanation": "Brief explanation of the answer"
}`;

  const prompt = `Generate question ${questionNumber}/5 for ${topic.replace('_', ' ')} assessment.${previousQAs.length > 0
    ? `\n\nPrevious Q&A in this topic:\n${previousQAs.map(qa => `Q: ${qa.question}\nA: ${qa.answer} (${qa.correct ? 'correct' : 'incorrect'})`).join('\n')}`
    : ''
    }`;

  const response = await generateLocalResponse(prompt, {
    provider: 'ollama',
    model: 'llama3.2:3b',
    systemPrompt,
    temperature: 0.8,
  });

  try {
    // Extract JSON from response (handle cases where model adds extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      id: questionNumber,
      text: parsed.text,
      options: parsed.options,
      topic,
      type: 'multiple_choice',
      difficulty: questionNumber <= 2 ? 'easy' : questionNumber <= 4 ? 'medium' : 'hard',
    };
  } catch (error) {
    console.error('Failed to parse question:', error);
    // Return a fallback question
    return getFallbackQuestion(topic, questionNumber);
  }
};

/**
 * Get fallback question if AI fails
 */
const getFallbackQuestion = (topic: SkillCategory, questionNumber: number = 1): InterviewQuestion => {
  const fallbacks: Record<SkillCategory, InterviewQuestion> = {
    Network_Ops: {
      id: questionNumber,
      text: 'Which protocol is used to securely transfer files over a network?',
      options: ['FTP', 'SFTP', 'HTTP', 'Telnet'],
      topic: 'Network_Ops',
      type: 'multiple_choice',
      difficulty: 'medium',
    },
    Web_Security: {
      id: questionNumber,
      text: 'What does XSS stand for in web security?',
      options: ['XML Style Sheet', 'Cross-Site Scripting', 'Extended Server Side', 'X-Security Standard'],
      topic: 'Web_Security',
      type: 'multiple_choice',
      difficulty: 'medium',
    },
    Cryptography: {
      id: questionNumber,
      text: 'Which encryption algorithm is asymmetric?',
      options: ['AES', 'DES', 'RSA', 'Blowfish'],
      topic: 'Cryptography',
      type: 'multiple_choice',
      difficulty: 'medium',
    },
    Linux_Forensics: {
      id: questionNumber,
      text: 'Which Linux command shows running processes?',
      options: ['ls', 'ps', 'cd', 'mkdir'],
      topic: 'Linux_Forensics',
      type: 'multiple_choice',
      difficulty: 'easy',
    },
    Cloud_Defense: {
      id: questionNumber,
      text: 'What does IAM stand for in cloud security?',
      options: ['Internet Access Management', 'Identity and Access Management', 'Internal Audit Module', 'Integrated Application Monitor'],
      topic: 'Cloud_Defense',
      type: 'multiple_choice',
      difficulty: 'medium',
    },
    Threat_Intel: {
      id: questionNumber,
      text: 'What is an IOC in threat intelligence?',
      options: ['International Operations Center', 'Indicator of Compromise', 'Internal Operating Code', 'Internet Outage Control'],
      topic: 'Threat_Intel',
      type: 'multiple_choice',
      difficulty: 'medium',
    },
  };

  return fallbacks[topic];
};

/**
 * Configure local AI endpoint
 */
export const configureLocalAI = (config: {
  endpoint?: string;
  model?: string;
  provider?: LocalAIProvider;
}) => {
  if (config.endpoint) {
    localStorage.setItem('localAIEndpoint', config.endpoint);
  }
  if (config.model) {
    localStorage.setItem('localAIModel', config.model);
  }
  if (config.provider) {
    localStorage.setItem('localAIProvider', config.provider);
  }
};

/**
 * Get current local AI configuration
 * Defaults to LM Studio settings for automatic connection
 */
export const getLocalAIConfig = () => {
  return {
    endpoint: localStorage.getItem('localAIEndpoint') || 'http://127.0.0.1:1234',
    model: localStorage.getItem('localAIModel') || 'llama-3.2-3b',
    provider: (localStorage.getItem('localAIProvider') as LocalAIProvider) || 'lmstudio',
  };
};

/**
 * Auto-detect and connect to local AI on startup
 * Tries LM Studio first, then falls back to Ollama
 */
export const autoDetectLocalAI = async (): Promise<{
  connected: boolean;
  provider: LocalAIProvider;
  model: string;
  endpoint: string;
  recommendedModel: string;
}> => {
  // Check if current system's recommended model is specifically available
  const checkModelAvailability = (availableModels: string[], recommended: string) => {
    // Normalize names for comparison (e.g. "llama-3.2-3b" vs "llama3.2:3b")
    const normalize = (name: string) => name.toLowerCase().replace(/[:\-_]/g, '');
    const normalizedRec = normalize(recommended);
    return availableModels.find(m => normalize(m) === normalizedRec) || null;
  };

  // Try LM Studio first (most common setup)
  const lmStudioResult = await checkLocalAIStatus('lmstudio');
  if (lmStudioResult.available) {
    const availableModels = lmStudioResult.models || [];
    const bestModel = checkModelAvailability(availableModels, RECOMMENDED_MODEL) || availableModels[0] || 'llama-3.2-3b-instruct';

    configureLocalAI({
      provider: 'lmstudio',
      endpoint: 'http://127.0.0.1:1234',
      model: bestModel,
    });
    return {
      connected: true,
      provider: 'lmstudio',
      model: bestModel,
      endpoint: 'http://127.0.0.1:1234',
      recommendedModel: RECOMMENDED_MODEL
    };
  }

  // Try Ollama as fallback
  const ollamaResult = await checkLocalAIStatus('ollama');
  if (ollamaResult.available) {
    const availableModels = ollamaResult.models || [];
    const bestModel = checkModelAvailability(availableModels, RECOMMENDED_MODEL) || availableModels[0] || 'llama3.2:3b';

    configureLocalAI({
      provider: 'ollama',
      endpoint: 'http://localhost:11434',
      model: bestModel,
    });
    return {
      connected: true,
      provider: 'ollama',
      model: bestModel,
      endpoint: 'http://localhost:11434',
      recommendedModel: RECOMMENDED_MODEL
    };
  }

  // No local AI found, use defaults
  return {
    connected: false,
    provider: 'lmstudio',
    model: 'llama-3.2-3b-instruct',
    endpoint: 'http://127.0.0.1:1234',
    recommendedModel: RECOMMENDED_MODEL
  };
};

export default {
  checkLocalAIStatus,
  generateLocalResponse,
  streamLocalResponse,
  getLocalInterviewQuestion,
  configureLocalAI,
  getLocalAIConfig,
};
