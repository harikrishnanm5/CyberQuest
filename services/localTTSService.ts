/**
 * localTTSService.ts
 * CPU-based Local TTS using the Web Speech API.
 * Provides zero-dependency speech synthesis for all interviewers.
 */

export interface LocalSpeechResult {
    audioUrl: string;
    durationMs: number;
}

// Persona Voice Mapping (System Voice Preferences)
const VOICE_PREFERENCES: Record<string, string[]> = {
    Network_Ops: ['David', 'Alex', 'Male', 'Google US English'], // Titan: Authoritative
    Web_Security: ['Zira', 'Samantha', 'Female', 'Google UK English Female'], // Neon: Energetic
    Cryptography: ['Mark', 'Neutral', 'Microsoft David'], // Cipher: Intellectual
    Linux_Forensics: ['Google US English', 'Alex', 'Male'], // Root: Technical
    Cloud_Defense: ['Google UK English Female', 'Samantha', 'Female'], // Azure: Professional
    Threat_Intel: ['Hazel', 'Callista', 'Female', 'Mystery'], // The Watcher: Calm/Mysterious
};

class LocalTTSService {
    private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
    private voices: SpeechSynthesisVoice[] = [];

    constructor() {
        if (this.synth) {
            this.synth.onvoiceschanged = () => {
                this.voices = this.synth!.getVoices();
                console.log(`[LocalTTS] ${this.voices.length} system voices available`);
            };
            this.voices = this.synth.getVoices();
        }
    }

    /**
     * Get local speech synthesis with persona mapping
     */
    async getSpeechLocal(text: string, topic?: string): Promise<LocalSpeechResult> {
        return new Promise((resolve, reject) => {
            if (!this.synth) {
                reject(new Error('Web Speech API not supported'));
                return;
            }

            this.synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            const voice = this.findBestPersonaVoice(topic);
            if (voice) utterance.voice = voice;

            utterance.rate = 1.05; // Slightly faster for modern feel
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            const words = text.split(/\s+/).length;
            const estimatedDuration = (words / 160) * 60 * 1000 + 800;

            this.synth.speak(utterance);

            resolve({
                audioUrl: 'local-speech',
                durationMs: estimatedDuration
            });
        });
    }

    private findBestPersonaVoice(topic?: string): SpeechSynthesisVoice | null {
        if (this.voices.length === 0) return null;

        const prefs = topic ? VOICE_PREFERENCES[topic] : [];
        if (!prefs || prefs.length === 0) return this.voices[0];

        // Try to match by preference list
        for (const pref of prefs) {
            const matched = this.voices.find(v =>
                v.name.toLowerCase().includes(pref.toLowerCase())
            );
            if (matched) return matched;
        }

        return this.voices[0];
    }

    stop() {
        if (this.synth) this.synth.cancel();
    }
}

export const localTTSService = new LocalTTSService();
export default localTTSService;
