import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def _get_model():
    """Lazy Gemini client — only configure when actually called."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY not set. Add it to D:/cipherops/.env"
        )
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash')

class AgentArchitect:
    def create_mission(self, agent1_history, agent3_output, user_rank):
        prompt = f"""
        You are Agent 4 (Architect). Design a professional cybersecurity mission.
        User History: {agent1_history}
        Attack Details: {agent3_output}
        User Rank: {user_rank}

        The mission must be written as a professional internal email from a supervisor.
        Return ONLY a JSON object with:
        {{
            "mission_title": "Operation Name",
            "mission_briefing": "The email content",
            "objectives": ["obj 1", "obj 2"],
            "time_limit_minutes": (15-60),
            "success_criteria": "How to know it's done",
            "starting_hint": "Initial nudge"
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

architect = AgentArchitect()
