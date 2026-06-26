import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

class AssessmentAgent:
    def generate_questions(self, domain, rating):
        prompt = f"""
        You are a cybersecurity expert. Generate 5 technical assessment questions for a professional.
        Domain: {domain}
        Self-Rated Level: {rating}

        The questions should be challenging but fair. They must be open-ended (no multiple choice).
        Return ONLY a JSON array of strings:
        ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
        """
        response = model.generate_content(prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        return json.loads(text.strip())

    def evaluate_answers(self, domain, rating, questions, answers):
        prompt = f"""
        Evaluate these cybersecurity assessment answers.
        Domain: {domain}
        User's Self-Rating: {rating}

        Questions and Answers:
        {json.dumps(list(zip(questions, answers)))}

        Assign an initial CipherRank from 1 to 5:
        1: Novice (Basic concepts)
        2: Analyst (Foundational skills)
        3: Specialist (Intermediate expertise)
        4: Expert (Advanced mastery)
        5: Elite (World-class skill)

        Return ONLY a JSON object with:
        {{
            "rank": (1-5),
            "explanation": "A brief professional justification for this rank"
        }}
        """
        response = model.generate_content(prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        return json.loads(text.strip())

assessment_agent = AssessmentAgent()
