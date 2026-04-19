/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export type Domain = 'web' | 'network' | 'malware' | 'social_engineering' | null;
export type SelfLevel = 'curious' | 'some_experience' | 'experienced' | null;
export type ActualLevel = 'beginner' | 'intermediate' | 'advanced' | null;

export interface LearnerProfile {
  userId: string;
  domain: Domain;
  selfAssessedLevel: SelfLevel;
  actualLevel: ActualLevel;
  skillMap: {
    phishing_analysis: number;
    header_forensics: number;
    cve_identification: number;
    network_analysis: number;
  };
  sessionHistory: string[];
  currentMission: string | null;
  xp: number;
}

type Action =
  | { type: 'SET_DOMAIN'; payload: Domain }
  | { type: 'SET_SELF_LEVEL'; payload: SelfLevel }
  | { type: 'SET_ACTUAL_LEVEL'; payload: ActualLevel }
  | { type: 'UPDATE_SKILL'; payload: { skill: keyof LearnerProfile['skillMap']; delta: number } }
  | { type: 'ADD_SESSION'; payload: string }
  | { type: 'SET_MISSION'; payload: string | null }
  | { type: 'ADD_XP'; payload: number };

const initialState: LearnerProfile = {
  userId: crypto.randomUUID(),
  domain: null,
  selfAssessedLevel: null,
  actualLevel: null,
  skillMap: {
    phishing_analysis: 0,
    header_forensics: 0,
    cve_identification: 0,
    network_analysis: 0,
  },
  sessionHistory: [],
  currentMission: null,
  xp: 0,
};

const LearnerProfileContext = createContext<{
  state: LearnerProfile;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

function learnerProfileReducer(state: LearnerProfile, action: Action): LearnerProfile {
  switch (action.type) {
    case 'SET_DOMAIN':
      return { ...state, domain: action.payload };
    case 'SET_SELF_LEVEL':
      return { ...state, selfAssessedLevel: action.payload };
    case 'SET_ACTUAL_LEVEL':
      // Intentionally independent from selfAssessedLevel
      return { ...state, actualLevel: action.payload };
    case 'UPDATE_SKILL':
      return {
        ...state,
        skillMap: {
          ...state.skillMap,
          [action.payload.skill]: state.skillMap[action.payload.skill] + action.payload.delta,
        },
      };
    case 'ADD_SESSION':
      return {
        ...state,
        sessionHistory: [...state.sessionHistory, action.payload],
      };
    case 'SET_MISSION':
      return { ...state, currentMission: action.payload };
    case 'ADD_XP':
      return { ...state, xp: state.xp + action.payload };
    default:
      return state;
  }
}

export const LearnerProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(learnerProfileReducer, initialState);
  return (
    <LearnerProfileContext.Provider value={{ state, dispatch }}>
      {children}
    </LearnerProfileContext.Provider>
  );
};

export const useLearnerProfile = () => {
  const context = useContext(LearnerProfileContext);
  if (context === undefined) {
    throw new Error('useLearnerProfile must be used within a LearnerProfileProvider');
  }
  return context;
};
