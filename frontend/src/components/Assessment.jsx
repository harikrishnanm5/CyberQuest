import React, { useState } from 'react';
import { Shield, CheckCircle, ArrowRight, LoaderCircle } from 'lucide-react';
import { apiPost } from '../api';

const Assessment = ({ onComplete }) => {
  const [step, setStep] = useState('domain'); // 'domain' -> 'questions' -> 'result'
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    domain: 'Network Security',
    rating: 'Beginner',
  });
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const domains = ['Network Security', 'Web App Security', 'Malware Analysis', 'Cloud Security', 'General'];
  const ratings = ['Beginner', 'Intermediate', 'Advanced'];

  const startAssessment = async () => {
    setLoading(true);
    try {
      const data = await apiPost('/api/assessment/questions', {
        domain: formData.domain,
        rating: formData.rating,
      });
      setQuestions(data.questions);
      setStep('questions');
    } catch (e) {
      alert('Error fetching questions: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswers = async () => {
    setLoading(true);
    try {
      const data = await apiPost('/api/assessment/evaluate', {
        domain: formData.domain,
        rating: formData.rating,
        questions,
        answers: Object.values(answers),
      });
      setResult(data);
      setStep('result');
    } catch (e) {
      alert('Error evaluating answers: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'domain') {
    return (
      <div className="min-h-screen bg-cipher-bg flex items-center justify-center p-4 font-mono">
        <div className="max-w-md w-full bg-cipher-dark-panel border border-cipher-accent p-8 rounded-lg shadow-[0_0_30px_rgba(233,69,96,0.2)]">
          <div className="flex justify-center mb-6">
            <Shield className="text-cipher-accent" size={64} />
          </div>
          <h1 className="text-2xl text-white text-center font-bold mb-2">SENTRY_AUTH</h1>
          <p className="text-gray-400 text-center mb-8 text-sm">Welcome to CipherOps. Please complete the initial skill assessment to be assigned a Rank.</p>

          <div className="space-y-6">
            <div>
              <label className="block text-xs text-gray-500 mb-2 uppercase tracking-widest">Specialization Domain</label>
              <select
                className="w-full bg-black border border-gray-700 p-3 text-white rounded outline-none focus:border-cipher-accent transition-colors"
                value={formData.domain}
                onChange={(e) => setFormData({...formData, domain: e.target.value})}
              >
                {domains.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2 uppercase tracking-widest">Self-Rating</label>
              <div className="grid grid-cols-3 gap-2">
                {ratings.map(r => (
                  <button
                    key={r}
                    onClick={() => setFormData({...formData, rating: r})}
                    className={`p-2 text-xs rounded border transition-all ${formData.rating === r ? 'bg-cipher-accent border-cipher-accent text-white' : 'bg-black border-gray-700 text-gray-400'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={startAssessment}
              disabled={loading}
              className="w-full bg-cipher-accent hover:bg-red-600 text-white p-3 rounded font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(233,69,96,0.4)]"
            >
              {loading ? <LoaderCircle className="animate-spin" size={18} /> : 'BEGIN ASSESSMENT'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'questions') {
    return (
      <div className="min-h-screen bg-cipher-bg p-8 font-mono">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl text-cipher-accent font-bold">SKILL_VALIDATION // {formData.domain.toUpperCase()}</h1>
            <div className="text-gray-500 text-xs uppercase tracking-tighter">Clearance Level: Pending</div>
          </div>

          <div className="space-y-8">
            {questions.map((q, i) => (
              <div key={i} className="bg-cipher-dark-panel border border-gray-700 p-6 rounded-lg">
                <div className="text-gray-400 text-sm mb-4">
                  <span className="text-cipher-accent mr-2">0{i+1}.</span> {q}
                </div>
                <textarea
                  className="w-full bg-black border border-gray-700 p-3 text-white rounded outline-none focus:border-cipher-accent transition-colors h-32 resize-none"
                  placeholder="Enter technical explanation..."
                  value={answers[i] || ''}
                  onChange={(e) => setAnswers({...answers, [i]: e.target.value})}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={submitAnswers}
              disabled={loading}
              className="bg-cipher-accent hover:bg-red-600 text-white px-8 py-3 rounded font-bold transition-all flex items-center gap-2"
            >
              {loading ? <LoaderCircle className="animate-spin" size={18} /> : 'SUBMIT FOR EVALUATION'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cipher-bg flex items-center justify-center p-4 font-mono">
      <div className="max-w-md w-full bg-cipher-dark-panel border border-cipher-accent p-8 rounded-lg text-center shadow-[0_0_30px_rgba(233,69,96,0.2)]">
        <div className="flex justify-center mb-6">
          <CheckCircle className="text-cipher-green" size={64} />
        </div>
        <h1 className="text-2xl text-white font-bold mb-2">ASSESSMENT_COMPLETE</h1>
        <div className="text-gray-400 mb-8">Evaluation processed by Agent 1.</div>

        <div className="bg-black border border-gray-700 p-6 rounded-lg mb-8">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Assigned CipherRank</div>
          <div className="text-6xl font-bold text-cipher-accent mb-4">{result?.rank}</div>
          <div className="text-gray-300 italic text-sm">"{result?.explanation}"</div>
        </div>

        <button
          onClick={() => onComplete(result?.rank)}
          className="w-full bg-cipher-accent hover:bg-red-600 text-white p-3 rounded font-bold transition-all"
        >
          ENTER CIPHER_OS
        </button>
      </div>
    </div>
  );
};

export default Assessment;
