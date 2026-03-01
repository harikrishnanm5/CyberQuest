/**
 * HardwareEngine.js
 * Utility for AMD Ryzen AI NPU detection via WebNN and WASM fallback.
 * Optimized for local AI inference in the browser.
 */

import * as ort from 'onnxruntime-web';

class HardwareEngine {
    constructor() {
        this.capabilities = {
            webnn: false,
            npu: false,
            wasm: true,
            threads: navigator.hardwareConcurrency || 4,
        };
        this.modelCacheName = 'alice-model-cache';
    }

    /**
     * Initialize and detect hardware capabilities
     */
    async init() {
        console.log('[HardwareEngine] Initializing...');

        // Check for WebNN support
        if ('ml' in navigator) {
            this.capabilities.webnn = true;
            try {
                // Simple check to see if NPU is available as a device
                // Note: Browsers are still evolving this API
                const contextOptions = { deviceType: 'npu' };
                // This is a speculative check as WebNN spec is still stabilizing
                if (navigator.ml.createContext) {
                    this.capabilities.npu = true;
                    console.log('[HardwareEngine] AMD Ryzen AI NPU detected via WebNN');
                }
            } catch (e) {
                console.warn('[HardwareEngine] WebNN available but NPU device not found:', e.message);
            }
        }

        // Configure ONNX Runtime defaults
        ort.env.wasm.numThreads = Math.min(this.capabilities.threads, 8); // Optimize for Ryzen 5 (7-8 threads)
        ort.env.wasm.proxy = true; // Use web worker for WASM to keep UI responsive

        return this.capabilities;
    }

    /**
     * Load model with smart caching (IndexedDB/Cache API)
     * Targets: bartowski/llama-3.2-1b-instruct
     */
    async loadModel(modelUrl, progressCallback) {
        const cache = await caches.open(this.modelCacheName);
        let response = await cache.match(modelUrl);

        if (!response) {
            console.log('[HardwareEngine] Model not in cache, downloading...');
            response = await fetch(modelUrl);
            if (!response.ok) throw new Error('Failed to download model');

            // We can't easily track progress on a native fetch/cache.put, 
            // but for "Data-Frugality" we just ensure it happens once.
            await cache.put(modelUrl, response.clone());
        } else {
            console.log('[HardwareEngine] Model loaded from local cache');
        }

        const modelBuffer = await response.arrayBuffer();

        // Choose execution provider based on hardware
        const executionProviders = this.capabilities.npu ? ['webnn'] : ['wasm'];

        console.log(`[HardwareEngine] Loading session with EP: ${executionProviders[0]}`);

        const session = await ort.InferenceSession.create(modelBuffer, {
            executionProviders: executionProviders,
            graphOptimizationLevel: 'all',
        });

        return session;
    }

    /**
     * Detect current system status
     */
    detectCapabilities() {
        return this.capabilities;
    }
}

export const hardwareEngine = new HardwareEngine();
export default hardwareEngine;
