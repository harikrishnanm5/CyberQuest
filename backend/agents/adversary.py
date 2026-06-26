import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def _get_client():
    """Lazy Groq client — only instantiate when actually needed."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY not set. Add it to D:/cipherops/.env — get one free at https://console.groq.com/keys"
        )
    return Groq(api_key=api_key)

class AgentAdversary:
    def generate_attack(self, user_rank, domain):
        prompt = f"""
        You are Agent 3 (Adversary). Generate a realistic cyber attack scenario.
        User Rank: {user_rank}
        Domain: {domain}

        Return ONLY a JSON object with:
        {{
            "attack_type": "e.g., SQL Injection, SSH Brute Force",
            "vulnerability": "e.g., CVE-2023-XXXXX or Misconfiguration",
            "description": "Detailed technical description of the attack",
            "difficulty": (1-5),
            "tools_involved": ["tool1", "tool2"]
        }}
        Use real CVE-style naming. Keep it technical and current.
        """
        client = _get_client()
        completion = client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)

adversary = AgentAdversary()
