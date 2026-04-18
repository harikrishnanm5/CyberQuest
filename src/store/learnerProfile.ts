/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LearnerProfile {
  level: 'ROOKIE' | 'ANALYST' | 'SPECIALIST';
  experience: number;
  skills: {
    forensics: number;
    phishing: number;
    malware: number;
    web: number;
  };
  domain: string;
  placement_note: string;
  strong_areas: string[];
}

export const initialProfile: LearnerProfile = {
  level: 'ROOKIE',
  experience: 0,
  skills: {
    forensics: 0,
    phishing: 0,
    malware: 0,
    web: 0,
  },
  domain: 'General Operations',
  placement_note: 'Initial diagnostics pending.',
  strong_areas: [],
};

// Simplified store stub
export const learnerProfile = initialProfile;
