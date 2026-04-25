/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LearnerProfile } from '../store/learnerProfile';
import { queryThreats } from './ragService';

// --- STRICT AGENT CONTRACTS (JSON) ---

const MOCK_JSON_RESPONSES: Record<string, string[]> = {
  cipher: [
    JSON.stringify({ 
      attack_message: "Your perimeter is breached. I've siphoned the core telemetry.", 
      hint_keyword: "nmap", 
      taunt: "Is that the best your firewall can do?" 
    }),
    JSON.stringify({ 
      attack_message: "Shadow protocols activated. Your Node 7 is a ghost.", 
      hint_keyword: "wireshark", 
      taunt: "I am the ghost in your machine." 
    })
  ],
  axiom: [
    JSON.stringify({ 
      mission_title: "Operation Winter Shield", 
      objective: "Neutralize the rogue BGP node.", 
      commands: ["nmap", "tcpdump"], 
      difficulty: "Intermediate" 
    })
  ],
  mentor: [
    JSON.stringify({ 
      hint: "Look at the default credentials mapping.", 
      follow_up_question: "What's the risk of using admin/admin?", 
      revealed_answer: false 
    })
  ],
  debrief: [
    JSON.stringify({ 
      correct: true, 
      explanation: "Excellent packet analysis. You caught the exploit in transit.", 
      cve_ref: "CVE-2023-1234", 
      xp_awarded: 150 
    })
  ]
};

interface CompleteParams {
  agent: 'cipher' | 'axiom' | 'mentor' | 'debrief';
  systemPrompt: string;
  userMessage: string;
  learnerProfile: LearnerProfile;
}

/**
 * Validates the agent's output schema to prevent hallucinations.
 * Throws an error if required fields are missing or if constraints are violated.
 */
const validateAgentSchema = (agent: string, parsed: any) => {
  if (!parsed || typeof parsed !== 'object') throw new Error("Invalid JSON output format.");

  switch (agent) {
    case 'cipher':
      if (!parsed.attack_message || !parsed.hint_keyword || !parsed.taunt) {
        throw new Error("CIPHER contract violation: Missing required fields.");
      }
      break;
    case 'axiom':
      if (!parsed.mission_title || !parsed.objective || !Array.isArray(parsed.commands) || !parsed.difficulty) {
        throw new Error("AXIOM contract violation: Missing or invalid fields.");
      }
      break;
    case 'mentor':
      if (!parsed.hint || !parsed.follow_up_question || parsed.revealed_answer !== false) {
        throw new Error("Mentor contract violation: Schema must reject revealed_answer = true.");
      }
      break;
    case 'debrief':
      if (typeof parsed.correct !== 'boolean' || !parsed.explanation || !parsed.cve_ref || typeof parsed.xp_awarded !== 'number') {
        throw new Error("Debrief contract violation: Invalid field types.");
      }
      break;
  }
};

export const complete = async ({
  agent,
  systemPrompt,
  userMessage,
  learnerProfile
}: CompleteParams): Promise<string> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  // --- 1. PREPARE AGENT-SPECIFIC PARAMETERS ---
  
  const temperatureMap = {
    cipher: 0.9,
    axiom: 0.7,
    mentor: 0.6,
    debrief: 0.5
  };

  const jsonInstructions = `\nOUTPUT RULES: You MUST output valid JSON exactly matching this schema: 
  ${agent === 'cipher' ? '{ "attack_message": string, "hint_keyword": string, "taunt": string }' :
    agent === 'axiom' ? '{ "mission_title": string, "objective": string, "commands": string[], "difficulty": string }' :
    agent === 'mentor' ? '{ "hint": string, "follow_up_question": string, "revealed_answer": false }' :
    '{ "correct": boolean, "explanation": string, "cve_ref": string, "xp_awarded": number }'
  }\nNo conversational filler. Return only the JSON object.`;

  let finalSystemPrompt = systemPrompt + jsonInstructions;

  // --- 2. INJECT RAG CONTEXT (CIPHER AND DEBRIEF) ---

  if (agent === 'cipher' || agent === 'debrief') {
    const domain = learnerProfile?.domain || 'general';
    const level = learnerProfile?.level || 'beginner';
    const ragContext = await queryThreats(domain, level);
    finalSystemPrompt = ragContext + finalSystemPrompt;
  }

  // --- 3. MOCK FALLBACK ---

  if (!apiKey) {
    const mocks = MOCK_JSON_RESPONSES[agent] || [JSON.stringify({ error: "No mock data" })];
    const randomIndex = Math.floor(Math.random() * mocks.length);
    await new Promise(resolve => setTimeout(resolve, 800));
    return mocks[randomIndex];
  }

  // --- 4. LIVE INFERENCE ---

  try {
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: temperatureMap[agent],
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("AI Service Internal Error:", error);
    return JSON.stringify({ error: "Critical failure", details: error instanceof Error ? error.message : 'Unknown error' });
  }
};
