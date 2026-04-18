/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LearnerProfile } from '../store/learnerProfile';

const MOCK_RESPONSES: Record<string, string[]> = {
  cipher: [
    "[GLITCH] Your firewalls are mere spiderwebs. I've already mapped your subnet. Watch Node 7... it's about to blink out of existence.",
    "Cute. You think AES-256 matters when I have the master keys? I'm not just in your network; I'm in your head, little ant.",
    "[ENCRYPTED] System failure is inevitable. Why postpone the data wipe? Submit to the CIPHER protocol now.",
    "I saw you scanning my decoys. Waste of time. While you were looking at the honeypot, I was siphoning your telemetry. Sleep well."
  ],
  axiom: [
    "Heuristic analysis suggests a localized brute-force attempt on Subnet B. Maintain current defense parameters and monitor for lateral movement.",
    "Packet inspection reveals a malformed SMTP header. This is a classic injection vector. Block the originating CIDR and proceed with forensics.",
    "Signal clarity at 98%. The adversary is attempting to mask their signature using a rotational proxy. We are already calculating the egress point.",
    "Data integrity confirmed. Operator, your response time was within optimal parameters. Stay focused; the next wave is gathering."
  ],
  mentor: [
    "Think about what a 403 error actually tells you vs a 404. Is the door missing, or is someone just telling you that you can't enter?",
    "If you were the attacker, would you use the front door or the maintenance hatch left open in the config file? Look at the default credentials.",
    "The delay in the DNS response is exactly 30 seconds. In a normal network, that's impossible. What does that tell you about the relay?",
    "Consider the difference between a hash and an encrypted string. Why would an attacker prefer one over the other for a credential dump?"
  ],
  debrief: [
    "Post-Mortem Report: Incident #8821. Vulnerability identified: CVE-2023-44487 (Rapid Reset). Effectiveness of mitigation: 85%. Recommendation: Upgrade edge filters.",
    "Operational Analysis: The breach was contained at the second layer. Minimal data exfiltration detected. Key takeaway: Zero-trust architecture works.",
    "Report Summary: Threat actor 'CIPHER' used a multi-stage payload. Entry point was an unpatched VPN concentrator. Patch level 4.2.1 is now mandatory.",
    "Case Study complete. Your performance matches Analyst Tier 2. Note the pattern in the SQL entry points—this will be on your next assessment."
  ]
};

interface CompleteParams {
  agent: 'cipher' | 'axiom' | 'mentor' | 'debrief';
  systemPrompt: string;
  userMessage: string;
  learnerProfile: LearnerProfile;
}

export const complete = async ({
  agent,
  systemPrompt,
  userMessage,
  learnerProfile
}: CompleteParams): Promise<string> => {
  const endpoint = import.meta.env.VITE_AMD_ENDPOINT;

  if (!endpoint) {
    // Randomly select a mock response for the given agent
    const mocks = MOCK_RESPONSES[agent] || ["... Connection Timed Out ..."];
    const randomIndex = Math.floor(Math.random() * mocks.length);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return mocks[randomIndex];
  }

  try {
    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AMD Cloud API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response content.";
  } catch (error) {
    console.error("AI Service Error:", error);
    return `[SYSTEM ERROR] Critical failure in neural link. Error: ${error instanceof Error ? error.message : 'Unknown'}`;
  }
};
