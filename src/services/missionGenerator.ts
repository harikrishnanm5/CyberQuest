import * as aiService from './aiService';
import { SYSTEM_PROMPTS } from './prompts';

export interface GeneratedMission {
  targetOrgType: string;
  attackVector: string;
  objective: string;
  timeLimit: string;
  expectedCommands: string[];
  missionIdSuffix: string;
}

export const generateMission = async (domain: string, learnerProfile: any): Promise<GeneratedMission> => {
  try {
    const prompt = `Generate a cyber-security mission for a ${learnerProfile.actualLevel || 'beginner'} student in the ${domain} domain. 
    The mission should be realistic and educational.
    
    OUTPUT FORMAT: JSON only.
    {
      "targetOrgType": string (e.g., "Financial Services API"),
      "attackVector": string (e.g., "SQL Injection"),
      "objective": string (a short sentence),
      "timeLimit": string (format MM:SS),
      "expectedCommands": string[] (3-5 relevant terminal commands),
      "missionIdSuffix": string (a 3 digit number)
    }`;

    const response = await aiService.complete({
      agent: 'axiom',
      systemPrompt: SYSTEM_PROMPTS.axiom(learnerProfile),
      userMessage: prompt,
      learnerProfile
    });

    const cleanedJson = response.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);
    
    return {
      targetOrgType: parsed.targetOrgType || 'Unknown Sector',
      attackVector: parsed.attackVector || 'Unknown Vector',
      objective: parsed.objective || 'Neutralize the threat.',
      timeLimit: parsed.timeLimit || '10:00',
      expectedCommands: parsed.expectedCommands || ['nmap', 'ls', 'cat'],
      missionIdSuffix: parsed.missionIdSuffix || '999'
    };
  } catch (error) {
    console.error("Mission Generation Error:", error);
    // Fallback mission
    return {
      targetOrgType: 'Standard Corporate Network',
      attackVector: 'Suspicious Traffic detected',
      objective: 'Investigate the rogue connection and isolate the host.',
      timeLimit: '08:00',
      expectedCommands: ['nmap', 'tcpdump', 'iptables'],
      missionIdSuffix: '001'
    };
  }
};
