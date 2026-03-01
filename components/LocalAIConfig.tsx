import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle, XCircle, RefreshCw, Settings, Activity, Clock, Database, Zap } from 'lucide-react';
import { 
  checkLocalAIStatus, 
  configureLocalAI, 
  getLocalAIConfig,
  LocalAIProvider,
  generateLocalResponse 
} from '../services/localAIService';
import { Button } from './Button';

interface UsageStats {
  tokensUsed: number;
  latency: number;
  dataTransferred: number;
  lastRequest: Date | null;
}

interface LocalAIConfigProps {
  onClose: () => void;
}

export const LocalAIConfig: React.FC<LocalAIConfigProps> = ({ onClose }) => {
  const [provider, setProvider] = useState<LocalAIProvider>('ollama');
  const [endpoint, setEndpoint] = useState('http://localhost:11434');
  const [model, setModel] = useState('llama3.2:3b');
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('disconnected');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  
  // Usage statistics
  const [usageStats, setUsageStats] = useState<UsageStats>({
    tokensUsed: 0,
    latency: 0,
    dataTransferred: 0,
    lastRequest: null,
  });
  
  // Session history
  const [sessionRequests, setSessionRequests] = useState<number>(0);

  // Load saved config and stats on mount
  useEffect(() => {
    const config = getLocalAIConfig();
    setProvider(config.provider as LocalAIProvider);
    setEndpoint(config.endpoint);
    setModel(config.model);
    
    // Load saved stats
    const savedStats = localStorage.getItem('localAIUsageStats');
    if (savedStats) {
      setUsageStats(JSON.parse(savedStats));
    }
    
    checkConnection();
  }, []);
  
  // Save stats when they change
  useEffect(() => {
    localStorage.setItem('localAIUsageStats', JSON.stringify(usageStats));
  }, [usageStats]);

  const checkConnection = async () => {
    setStatus('checking');
    setError('');
    
    const result = await checkLocalAIStatus(provider);
    
    if (result.available) {
      setStatus('connected');
      setAvailableModels(result.models || []);
    } else {
      setStatus('disconnected');
      setError(result.error || 'Could not connect to local AI');
      setAvailableModels([]);
    }
  };

  const handleSave = () => {
    configureLocalAI({
      provider,
      endpoint,
      model,
    });
    onClose();
  };

  const testAI = async () => {
    setIsTesting(true);
    setTestResponse('');
    const startTime = performance.now();
    
    try {
      const response = await generateLocalResponse(
        'Say "Local AI is working!" in a friendly way.',
        { provider, model }
      );
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
      const promptTokens = Math.ceil(50 / 4);
      const responseTokens = Math.ceil(response.length / 4);
      const totalTokens = promptTokens + responseTokens;
      
      // Estimate data transferred (JSON payload size)
      const dataSize = JSON.stringify({ prompt: 'test', response }).length;
      
      setTestResponse(response);
      
      // Update usage stats
      setUsageStats(prev => ({
        tokensUsed: prev.tokensUsed + totalTokens,
        latency,
        dataTransferred: prev.dataTransferred + dataSize,
        lastRequest: new Date(),
      }));
      
      setSessionRequests(prev => prev + 1);
    } catch (err) {
      setTestResponse(`Error: ${err instanceof Error ? err.message : 'Test failed'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Cpu className="text-cyber-primary" size={32} />
              Local AI Configuration
            </h1>
            <p className="text-gray-400 mt-2">
              Connect to AI models running on your computer
            </p>
          </div>
        </div>

        {/* Usage Statistics Card */}
        {status === 'connected' && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity size={20} className="text-cyber-primary" />
              Usage Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Tokens Used */}
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Database size={16} className="text-purple-400" />
                  <span className="text-xs text-gray-500">Tokens Used</span>
                </div>
                <div className="text-2xl font-bold text-purple-400">
                  {usageStats.tokensUsed.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">Total</div>
              </div>
              
              {/* Latency */}
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock size={16} className="text-cyber-secondary" />
                  <span className="text-xs text-gray-500">Last Latency</span>
                </div>
                <div className="text-2xl font-bold text-cyber-secondary">
                  {usageStats.latency > 0 ? `${usageStats.latency}ms` : '--'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Response time</div>
              </div>
              
              {/* Data Transferred */}
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap size={16} className="text-yellow-400" />
                  <span className="text-xs text-gray-500">Data Used</span>
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {(usageStats.dataTransferred / 1024).toFixed(1)}KB
                </div>
                <div className="text-xs text-gray-500 mt-1">Transferred</div>
              </div>
              
              {/* Session Requests */}
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Activity size={16} className="text-green-400" />
                  <span className="text-xs text-gray-500">Requests</span>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {sessionRequests}
                </div>
                <div className="text-xs text-gray-500 mt-1">This session</div>
              </div>
            </div>
            
            {/* Model Info */}
            <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Active Model:</span>
                <span className="font-mono text-cyber-primary">{model}</span>
              </div>
              {usageStats.lastRequest && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">Last Request:</span>
                  <span className="text-gray-300">
                    {new Date(usageStats.lastRequest).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className={`p-6 rounded-xl border mb-6 ${
          status === 'connected' 
            ? 'bg-green-900/20 border-green-500/30' 
            : status === 'checking'
            ? 'bg-yellow-900/20 border-yellow-500/30'
            : 'bg-red-900/20 border-red-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status === 'connected' ? (
                <CheckCircle className="text-green-400" size={24} />
              ) : status === 'checking' ? (
                <RefreshCw className="text-yellow-400 animate-spin" size={24} />
              ) : (
                <XCircle className="text-red-400" size={24} />
              )}
              <div>
                <div className="font-bold">
                  {status === 'connected' 
                    ? 'Connected to Local AI' 
                    : status === 'checking'
                    ? 'Checking connection...'
                    : 'Not Connected'}
                </div>
                <div className="text-sm text-gray-400">
                  {status === 'connected' 
                    ? `${availableModels.length} models available`
                    : error || 'Configure your local AI server'}
                </div>
              </div>
            </div>
            <button
              onClick={checkConnection}
              disabled={status === 'checking'}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              {status === 'checking' ? 'Checking...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings size={20} className="text-cyber-secondary" />
            Configuration
          </h2>

          {/* Provider Selection */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">AI Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {(['ollama', 'lmstudio', 'custom'] as LocalAIProvider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    provider === p
                      ? 'bg-cyber-primary text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {p === 'ollama' ? 'Ollama' : p === 'lmstudio' ? 'LM Studio' : 'Custom'}
                </button>
              ))}
            </div>
          </div>

          {/* Endpoint */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Endpoint URL</label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-cyber-primary"
            />
            <p className="text-xs text-gray-500 mt-1">
              {provider === 'ollama' && 'Default: http://localhost:11434'}
              {provider === 'lmstudio' && 'Default: http://localhost:1234'}
              {provider === 'custom' && 'Enter your custom endpoint'}
            </p>
          </div>

          {/* Model Selection */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Model</label>
            {availableModels.length > 0 ? (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-cyber-primary"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="llama3.2:3b"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-cyber-primary"
              />
            )}
          </div>

          {/* Quick Setup Guide */}
          <div className="bg-gray-800/50 rounded-lg p-4 text-sm">
            <div className="font-medium mb-2 text-cyber-primary">Quick Setup:</div>
            {provider === 'ollama' && (
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-cyber-secondary hover:underline">ollama.ai</a></li>
                <li>Run: <code className="bg-gray-900 px-2 py-0.5 rounded">ollama pull llama3.2:3b</code></li>
                <li>Start Ollama: <code className="bg-gray-900 px-2 py-0.5 rounded">ollama serve</code></li>
                <li>Click "Refresh" to verify connection</li>
              </ol>
            )}
            {provider === 'lmstudio' && (
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li>Install LM Studio from <a href="https://lmstudio.ai" target="_blank" rel="noopener noreferrer" className="text-cyber-secondary hover:underline">lmstudio.ai</a></li>
                <li>Download a model (e.g., Llama 3.2)</li>
                <li>Start the local server in LM Studio</li>
                <li>Click "Refresh" to verify connection</li>
              </ol>
            )}
            {provider === 'custom' && (
              <p className="text-gray-400">
                Enter your custom OpenAI-compatible endpoint URL and model name.
              </p>
            )}
          </div>
        </div>

        {/* Test Section */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Test Connection</h2>
          <Button
            onClick={testAI}
            isLoading={isTesting}
            disabled={status !== 'connected'}
            className="w-full mb-4"
          >
            {isTesting ? 'Testing...' : 'Send Test Message'}
          </Button>
          
          {testResponse && (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">AI Response:</div>
              <div className="text-gray-200">{testResponse}</div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="flex-1"
            disabled={status !== 'connected'}
          >
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LocalAIConfig;
