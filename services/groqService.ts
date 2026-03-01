import Groq from 'groq-sdk';
import { InterviewQuestion, AssessmentResult, SkillCategory, UserProfile, Mission } from '../types';
import { aliceService } from './AliceService';

const groq = new Groq({
  apiKey: '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',
  dangerouslyAllowBrowser: true
});

let conversationHistory: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];
let missionHistory: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

// NEW: Deterministic Scoring State
let domainScores: Record<string, number> = {
  Network_Ops: 0,
  Web_Security: 0,
  Cryptography: 0,
  Linux_Forensics: 0,
  Cloud_Defense: 0,
  Threat_Intel: 0
};
let lastCorrectAnswer: string = '';

const QUESTIONS_PER_PERSON = 5;
const TOTAL_QUESTIONS = 30; // 6 panel members × 5 questions each

const TOPICS_ORDER = ['Network_Ops', 'Web_Security', 'Cryptography', 'Linux_Forensics', 'Cloud_Defense', 'Threat_Intel'] as const;

// Common spelling fixes for question text and options (word-boundary aware)
const SPELL_FIXES: [RegExp, string][] = [
  [/\bteh\b/gi, 'the'], [/\badn\b/gi, 'and'], [/\btaht\b/gi, 'that'], [/\bwaht\b/gi, 'what'],
  [/\brecieve\b/gi, 'receive'], [/\boccured\b/gi, 'occurred'], [/\bseperate\b/gi, 'separate'],
  [/\bdefinately\b/gi, 'definitely'], [/\baccomodate\b/gi, 'accommodate'], [/\brefered\b/gi, 'referred'],
  [/\benviroment\b/gi, 'environment'], [/\boccurence\b/gi, 'occurrence'], [/\bcommited\b/gi, 'committed'],
  [/\bacheive\b/gi, 'achieve'], [/\bneccessary\b/gi, 'necessary'], [/\bguarentee\b/gi, 'guarantee'],
  [/\bprotocal\b/gi, 'protocol'], [/\bexpliot\b/gi, 'exploit'], [/\bvulnerabilty\b/gi, 'vulnerability'],
  [/\bauthenication\b/gi, 'authentication'], [/\bcryptograpy\b/gi, 'cryptography'],
];
function fixSpelling(s: string): string {
  let out = s;
  for (const [re, replacement] of SPELL_FIXES) out = out.replace(re, replacement);
  return out;
}
const EXPERT_NAMES: Record<string, string> = {
  Network_Ops: 'Titan',
  Web_Security: 'Neon',
  Cryptography: 'Professor Cipher',
  Linux_Forensics: 'Root',
  Cloud_Defense: 'Azure',
  Threat_Intel: 'The Watcher'
};

const INTERVIEW_SYSTEM_PROMPT = `You are the 'Cyber Council', a panel of 6 elite cybersecurity experts assessing a student's knowledge level across 6 domains for a hexagonal skill chart. Each expert asks exactly 5 questions in their turn (30 questions total).

THE 6 DOMAINS (each maps to one expert and to one axis on the final hexagon chart):
1. Network_Ops -> "Titan" – networking, ports, protocols, TCP/IP, DNS, firewalls
2. Web_Security -> "Neon" – injection, XSS, CSRF, web vulns, OWASP, secure coding
3. Cryptography -> "Professor Cipher" – encryption, hashing, PKI, SSL/TLS, algorithms
4. Linux_Forensics -> "Root" – Linux commands, file systems, logs, forensics, permissions
5. Cloud_Defense -> "Azure" – AWS/Azure/GCP security, IAM, shared responsibility, cloud threats
6. Threat_Intel -> "The Watcher" – APTs, threat actors, incident response, indicators, MITRE ATT&CK

- ALL questions MUST be multiple_choice with exactly 4 options (A, B, C, D). Include "correctAnswer" so we can compute per-domain scores.
- Adopt the speaker's PERSONALITY in the 'text'. Each expert asks 5 questions in a row before the next takes over.
- Use perfect spelling and grammar in "text" and "options". Proofread all content carefully before outputting JSON.

OUTPUT FORMAT (JSON ONLY, no markdown):
{
  "id": number,
  "topic": "string (exactly one of: Network_Ops, Web_Security, Cryptography, Linux_Forensics, Cloud_Defense, Threat_Intel)",
  "text": "The character's dialogue including the question.",
  "type": "multiple_choice",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
  "correctAnswer": "A" or "B" or "C" or "D",
  "difficulty": "easy" | "medium" | "hard"
}`;

/**
 * Robustly extract JSON from AI response (strips markdown fences and conversational filler)
 */
const sanitizeJson = (raw: string): string => {
  let cleaned = raw.trim();
  // Remove markdown fences
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?([\s\S]*?)```/);
    if (match && match[1]) cleaned = match[1].trim();
  }
  // If there's still extra text, find the first '{' and last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
};

export const startInterviewSession = async (): Promise<InterviewQuestion> => {
  conversationHistory = [
    { role: 'system', content: INTERVIEW_SYSTEM_PROMPT }
  ];

  try {
    const messages = [
      ...conversationHistory,
      { role: 'user', content: 'The candidate has entered. Titan, begin with a Network_Ops question.' }
    ];

    // Priority: LM Studio -> ONNX -> Groq (via aliceService.chat)
    const content = await aliceService.chat(messages as any, true);

    const sanitized = sanitizeJson(content);
    const data = JSON.parse(sanitized);

    // Only store clean text in history to avoid JSON bloat for the 1B model
    const cleanText = fixSpelling(String(data.text ?? ''));
    conversationHistory = [
      { role: 'system', content: INTERVIEW_SYSTEM_PROMPT },
      { role: 'assistant', content: cleanText }
    ];

    // Track the correct answer for the first question
    lastCorrectAnswer = data.correctAnswer || '';
    // Reset scores for a new session
    Object.keys(domainScores).forEach(k => domainScores[k] = 0);

    const text = fixSpelling(String(data.text ?? ''));
    const options = Array.isArray(data.options) ? data.options.map((o: string) => fixSpelling(String(o))) : data.options;
    return {
      id: data.id || 1,
      topic: data.topic || 'Network_Ops',
      text,
      type: 'multiple_choice',
      options,
      difficulty: data.difficulty || 'medium'
    } as InterviewQuestion;
  } catch (error) {
    console.error('Interview start error:', error);
    return {
      id: 1,
      topic: 'Network_Ops',
      text: 'Titan here. Let\'s test your network knowledge. What is the default port for SSH?',
      type: 'multiple_choice',
      options: ['A) 21', 'B) 22', 'C) 23', 'D) 25'],
      difficulty: 'easy'
    };
  }
};

export const submitAnswerAndGetNext = async (
  previousAnswer: string,
  questionNumber: number
): Promise<{ nextQuestion?: InterviewQuestion; result?: AssessmentResult }> => {
  const isLastQuestion = questionNumber >= TOTAL_QUESTIONS;
  const nextQuestionNum = questionNumber + 1;

  // Which expert and which of their 5 questions (1-based)
  const nextExpertIndex = Math.floor((nextQuestionNum - 1) / QUESTIONS_PER_PERSON);
  const nextTopic = TOPICS_ORDER[Math.min(nextExpertIndex, TOPICS_ORDER.length - 1)];
  const questionForThisExpert = ((nextQuestionNum - 1) % QUESTIONS_PER_PERSON) + 1;
  const expertName = EXPERT_NAMES[nextTopic] || nextTopic;

  // Validate previous answer before moving to next
  const wasCorrect = previousAnswer.trim().toUpperCase().startsWith(lastCorrectAnswer.toUpperCase());
  const currentTopic = TOPICS_ORDER[Math.floor((questionNumber - 1) / QUESTIONS_PER_PERSON)];
  if (wasCorrect) {
    domainScores[currentTopic] = (domainScores[currentTopic] || 0) + 1;
    console.log(`[Interview] Correct! ${currentTopic} score: ${domainScores[currentTopic]}/5`);
  } else {
    console.log(`[Interview] Incorrect. Expected ${lastCorrectAnswer}, got ${previousAnswer}`);
  }

  const prompt = isLastQuestion
    ? `The candidate just answered the final question. 
       ACTUAL PERFORMANCE DATA (Use this for the JSON scores):
       ${Object.entries(domainScores).map(([k, v]) => `${k}: ${v}/5 correct`).join(', ')}

       Generate the AssessmentResult JSON for the HEXAGONAL SKILL CHART. 
       Final 30/30 answer was: "${previousAnswer}".

       Generate the AssessmentResult JSON for the HEXAGONAL SKILL CHART. The chart has 6 axes, one per domain. Each domain had 5 questions. Score each domain 0-100 based on how well the candidate answered that domain's 5 questions (knowledge level in that area). overallScore is the average of the 6 domain scores. Rank and summary should reflect their knowledge across the 6 domains.

       {
         "overallScore": number (0-100, average of the 6 metrics),
         "rank": "Script Kiddie" | "White Hat" | "Elite Operator",
         "summary": "2-3 sentences from the panel summarizing the candidate's knowledge level across the 6 domains.",
         "metrics": [
           { "category": "Network_Ops", "score": number (0-100), "level": "Poor" | "Average" | "Excellent" },
           { "category": "Web_Security", "score": number (0-100), "level": "Poor" | "Average" | "Excellent" },
           { "category": "Cryptography", "score": number (0-100), "level": "Poor" | "Average" | "Excellent" },
           { "category": "Linux_Forensics", "score": number (0-100), "level": "Poor" | "Average" | "Excellent" },
           { "category": "Cloud_Defense", "score": number (0-100), "level": "Poor" | "Average" | "Excellent" },
           { "category": "Threat_Intel", "score": number (0-100), "level": "Poor" | "Average" | "Excellent" }
         ]
       }`
    : `User answered: "${previousAnswer}".
       Next: question ${nextQuestionNum}/${TOTAL_QUESTIONS}. ${expertName} (${nextTopic}) asks their question ${questionForThisExpert} of 5. This domain maps to one axis on the final hexagonal skill chart, so the question must assess real knowledge in ${nextTopic} (one correct answer, 4 options A-D). Briefly react, then ask. Use correct spelling and grammar in "text" and "options"—no typos. Output JSON only with the question format.`;

  try {
    const messages = [
      ...conversationHistory,
      { role: 'user', content: prompt }
    ];

    // Priority: LM Studio -> ONNX -> Groq (via aliceService.chat)
    const content = await aliceService.chat(messages as any, true);

    const sanitized = sanitizeJson(content);
    const data = JSON.parse(sanitized);

    if (data.metrics || isLastQuestion) {
      // Clear history on completion as requested - only keep the score
      conversationHistory = [];

      const finalResult = data as AssessmentResult;
      finalResult.metrics = finalResult.metrics.map(m => ({
        ...m,
        score: (domainScores[m.category] / 5) * 100,
        level: domainScores[m.category] >= 4 ? 'Excellent' : domainScores[m.category] >= 2 ? 'Average' : 'Poor'
      }));
      finalResult.overallScore = Math.round(Object.values(domainScores).reduce((a, b) => a + b, 0) / 30 * 100);
      return { result: finalResult };
    } else {
      // Capture correct answer for the NEXT question
      lastCorrectAnswer = data.correctAnswer || '';

      const options = Array.isArray(data.options) ? data.options.map((o: string) => fixSpelling(String(o))) : [];
      const cleanNextText = fixSpelling(String(data.text ?? ''));

      // Prune history: keep system prompt + last 2 turns (4 messages) to stay within 1B model's context window
      // Use a marker for the user's last answer to keep history clean
      const lastAssistantMsg = [...conversationHistory].reverse().find(m => m.role === 'assistant');
      const prevQText = lastAssistantMsg?.content || 'Question';

      conversationHistory.push({ role: 'user', content: `Answer to "${prevQText.substring(0, 50)}...": ${previousAnswer}` });
      conversationHistory.push({ role: 'assistant', content: cleanNextText });

      // Sliding window: System + last 4 messages
      if (conversationHistory.length > 5) {
        conversationHistory = [
          conversationHistory[0],
          ...conversationHistory.slice(-4)
        ];
      }

      return {
        nextQuestion: {
          id: data.id || questionNumber + 1,
          topic: data.topic,
          text: cleanNextText,
          type: 'multiple_choice',
          options,
          difficulty: data.difficulty || 'medium'
        } as InterviewQuestion
      };
    }
  } catch (error) {
    console.error('Interview flow error:', error);
    if (isLastQuestion) {
      const totalCorrect = Object.values(domainScores).reduce((a, b) => a + b, 0);
      const overall = Math.round((totalCorrect / 30) * 100);
      return {
        result: {
          overallScore: overall,
          rank: overall >= 80 ? 'Elite Operator' : overall >= 50 ? 'White Hat' : 'Script Kiddie',
          summary: `Assessment complete. Total correct: ${totalCorrect}/30. Performance varied across domains.`,
          metrics: Object.entries(domainScores).map(([category, count]) => ({
            category: category as SkillCategory,
            score: (count / 5) * 100,
            level: count >= 4 ? 'Excellent' : count >= 2 ? 'Average' : 'Poor'
          }))
        }
      };
    }
    const nextQ = questionNumber + 1;
    const topicIndex = Math.min(Math.floor((nextQ - 1) / QUESTIONS_PER_PERSON), TOPICS_ORDER.length - 1);
    const fallbackTopic = TOPICS_ORDER[topicIndex];
    return {
      nextQuestion: {
        id: nextQ,
        topic: fallbackTopic,
        text: 'Systems link restored. Please answer the following question to continue.',
        type: 'multiple_choice',
        options: ['A) Check network status', 'B) Analyze logs', 'C) Verify credentials', 'D) Continue operation'],
        correctAnswer: 'D',
        difficulty: 'medium'
      }
    };
  }
};

export const generateCareerPath = async (result: AssessmentResult): Promise<UserProfile> => {
  const prompt = `Based on these assessment results, generate a cyberpunk career assignment:
    
    Rank: ${result.rank}
    Score: ${result.overallScore}
    Metrics: ${JSON.stringify(result.metrics)}

    Generate JSON:
    {
      "role": "A cool cyberpunk job title based on their BEST skill (e.g., Netrunner, Cryptomancer, Cloud Sentinel)",
      "department": "Department name (e.g., Red Team Ops, Defense Grid, Intel Division)",
      "mentor": "One of: Titan, Neon, Professor Cipher, Root, Azure, The Watcher (pick based on best skill)",
      "missions": [
        { 
          "id": "mission-1", 
          "title": "Mission title", 
          "description": "Brief description focusing on their WEAKEST skill",
          "difficulty": "Recruit" | "Operator" | "Elite",
          "status": "active",
          "skillFocus": "SkillCategory of weakest area"
        },
        { 
          "id": "mission-2", 
          "title": "Mission title", 
          "description": "Brief description",
          "difficulty": "Recruit" | "Operator" | "Elite",
          "status": "active",
          "skillFocus": "SkillCategory"
        },
        { 
          "id": "mission-3", 
          "title": "Mission title", 
          "description": "Brief description",
          "difficulty": "Recruit" | "Operator" | "Elite",
          "status": "active",
          "skillFocus": "SkillCategory"
        }
      ]
    }`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1024,
      response_format: { type: 'json_object' }
    });

    const sanitized = sanitizeJson(content);
    return JSON.parse(sanitized) as UserProfile;
  } catch (error) {
    console.error('Career generation error:', error);
    return {
      role: 'Security Analyst',
      department: 'General Operations',
      mentor: 'Titan',
      missions: [
        {
          id: 'mission-1',
          title: 'Network Fundamentals',
          description: 'Complete basic network security training.',
          difficulty: 'Recruit',
          status: 'active',
          skillFocus: 'Network_Ops'
        }
      ]
    };
  }
};

export const startMissionSession = async (mission: Mission, mentorName: string, userRole: string): Promise<string> => {
  missionHistory = [
    {
      role: 'system',
      content: `You are ${mentorName}, a cybersecurity mentor. You're guiding a ${userRole} through their mission.
        
        Current Mission: ${mission.title}
        Objective: ${mission.description}
        Skill Focus: ${mission.skillFocus}
        
        STYLE:
        - Titan: Military, direct, uses tactical language
        - Neon: Cyberpunk slang, energetic, uses hacker terms
        - Professor Cipher: Academic, speaks in riddles, mathematical
        - Root: Grumpy sysadmin, very concise, terminal-focused
        - Azure: Corporate professional, calm, uses cloud terminology
        - The Watcher: Paranoid, mysterious, speaks in whispers
        
        Keep responses under 50 words. Be helpful but challenging.`
    }
  ];

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        ...missionHistory,
        { role: 'user', content: 'The operator is online. Brief them on the mission.' }
      ],
      temperature: 0.8,
      max_tokens: 200
    });

    const content = response.choices[0]?.message?.content || 'Mission link established.';
    missionHistory.push({ role: 'user', content: 'The operator is online. Brief them on the mission.' });
    missionHistory.push({ role: 'assistant', content });
    return content;
  } catch (error) {
    console.error('Mission start error:', error);
    return 'Mission link established. Awaiting your first move, operator.';
  }
};

export const sendMissionMessage = async (message: string): Promise<string> => {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        ...missionHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.8,
      max_tokens: 200
    });

    const content = response.choices[0]?.message?.content || '...';
    missionHistory.push({ role: 'user', content: message });
    missionHistory.push({ role: 'assistant', content });
    return content;
  } catch (error) {
    console.error('Mission message error:', error);
    return 'Signal interference. Try again.';
  }
};

export const getTerminalStream = async function* (input: string, history: string[] = []) {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are QUEST-OS, a cybersecurity AI assistant. Give short, cryptic, hacker-style responses. Max 2-3 sentences.' },
        { role: 'user', content: `Context: ${history.join('\n')}\n\nUser: ${input}` }
      ],
      temperature: 0.9,
      max_tokens: 150,
      stream: true
    });

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) yield content;
    }
  } catch (error) {
    yield 'CONNECTION_ERROR: Unable to reach QUEST-OS.';
  }
};
