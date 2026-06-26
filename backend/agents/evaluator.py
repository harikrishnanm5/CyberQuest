import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def _get_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set. Add it to D:/cipherops/.env")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash')

class AgentEvaluator:
    def evaluate(self, commands_used, time_taken, hints_requested, mission_type, mission_completed):
        prompt = f"""
        You are Agent 1 (Evaluator). Score a cybersecurity mission based on these metrics:
        - Commands Used: {commands_used}
        - Time Taken: {time_taken}s
        - Hints Requested: {hints_requested}
        - Mission Type: {mission_type}
        - Completed: {mission_completed}

        Return ONLY a JSON object with:
        {{
            "score": (0-100),
            "rank_change": (-1, 0, or 1),
            "feedback": "concise professional feedback",
            "cipherlog_summary": "a one-line summary for the user's history log"
        }}
        """
        model = _get_model()
        response = model.generate_content(prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        return json.loads(text.strip())

evaluator = AgentEvaluator()
