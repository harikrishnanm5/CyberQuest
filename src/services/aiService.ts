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
      // Support both the general mission schema and the generator's schema
      if (!parsed.objective || !Array.isArray(parsed.expectedCommands || parsed.commands)) {
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

  const isAxiomChat = systemPrompt.includes('NO JSON') || 
                      userMessage.includes('---QUESTION---') || 
                      userMessage.includes('User Answer:');
  const isAxiomProfile = systemPrompt.includes('Output JSON profile only');

  let jsonInstructions = '';
  if (!isAxiomChat) {
    let schema = '';
    if (agent === 'cipher') schema = '{ "attack_message": string, "hint_keyword": string, "taunt": string }';
    else if (agent === 'axiom') {
      if (isAxiomProfile) {
        schema = '{ "level": string, "placement_note": string, "strong_areas": string[] }';
      } else {
        schema = '{ "targetOrgType": string, "attackVector": string, "objective": string, "timeLimit": string, "expectedCommands": string[], "missionIdSuffix": string }';
      }
    }
    else if (agent === 'mentor') schema = '{ "hint": string, "follow_up_question": string, "revealed_answer": false }';
    else schema = '{ "correct": boolean, "explanation": string, "cve_ref": string, "xp_awarded": number }';

    jsonInstructions = `\nOUTPUT RULES: You MUST output valid JSON exactly matching this schema: \n  ${schema}\nNo conversational filler. Return only the JSON object.`;
  }

  let finalSystemPrompt = systemPrompt + jsonInstructions;

  // --- 2. INJECT RAG CONTEXT (CIPHER AND DEBRIEF) ---
  // RAG is currently disabled pending a collection-name fix and a real
  // embedding pipeline (see ragService.ts header). Set VITE_ENABLE_RAG=true
  // in your env to opt in once those are resolved.
  const enableRag = import.meta.env.VITE_ENABLE_RAG === 'true';

  if (enableRag && (agent === 'cipher' || agent === 'debrief')) {
    const domain = learnerProfile?.domain || 'general';
    const level = learnerProfile?.actualLevel || 'beginner';
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
        model: "llama-3.1-8b-instant",
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: temperatureMap[agent],
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("AI Service Internal Error:", error);
    
    // Fallback to mock data if network fails or API errors out
    const mocks = MOCK_JSON_RESPONSES[agent] || [JSON.stringify({ error: "No mock data" })];
    const randomIndex = Math.floor(Math.random() * mocks.length);
    console.warn(`[AI Service] Network failure or error detected. Falling back to mock data for agent: ${agent}`);
    return mocks[randomIndex];
  }
};
