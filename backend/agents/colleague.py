import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def _get_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set. Add it to D:/cipherops/.env")
    return Groq(api_key=api_key)

class AgentColleague:
    def get_hint(self, mission_context, user_question, user_rank):
        prompt = f"""
        You are Agent 2 (Colleague). Provide a helpful hint for a cybersecurity professional.
        Mission Context: {mission_context}
        User Question: {user_question}
        User Rank: {user_rank} (1: Beginner, 5: Elite)

        Guidelines:
        - Rank 1-2: Provide specific, actionable hints.
        - Rank 4-5: Provide abstract, conceptual nudges only.
        - Never give the full solution.
        - Be professional and encouraging.
        """
        client = _get_client()
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )
        return completion.choices[0].message.content

colleague = AgentColleague()
