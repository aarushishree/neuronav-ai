import sys
import os

# Allow access to rag folder
sys.path.append(os.path.join(os.path.dirname(__file__), "rag"))

from data_loader import load_all_data
from embedder import chunk_text

from flask import Flask, request, jsonify
from flask_cors import CORS
from asgiref.wsgi import WsgiToAsgi
from dotenv import load_dotenv
from pathlib import Path

import numpy as np
import faiss
import requests
from sentence_transformers import SentenceTransformer

# -----------------------------
# 🔧 ENV SETUP
# -----------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

flask_app = Flask(__name__)
CORS(flask_app, origins=os.environ.get('CORS_ORIGINS', '*').split(','))

# -----------------------------
# 🧠 LOAD RAG SYSTEM (RUN ONCE)
# -----------------------------
data = load_all_data()

model = SentenceTransformer("all-MiniLM-L6-v2")

full_text = data["troubleshooting"] + "\n" + data["faq"]
chunks = chunk_text(full_text)

embeddings = model.encode(chunks)
dimension = embeddings.shape[1]

index = faiss.IndexFlatL2(dimension)
index.add(np.array(embeddings))

# -----------------------------
# 🎭 PERSONA SYSTEM
# -----------------------------
def get_persona_prompt(persona):
    if persona == "student":
        return "Explain in very simple, beginner-friendly language with examples."
    elif persona == "developer":
        return "Give a technical, detailed explanation with proper terminology."
    elif persona == "manager":
        return "Give a high-level explanation focusing on decisions and impact."
    else:
        return "Give a clear and balanced general explanation."

# -----------------------------
# 🔍 RETRIEVE CONTEXT
# -----------------------------
def retrieve(query, top_k=3):
    query_embedding = model.encode([query])
    distances, indices = index.search(np.array(query_embedding), top_k)
    return [chunks[i] for i in indices[0]]

# -----------------------------
# 🚫 SAFETY CHECK
# -----------------------------
def is_unsafe(query):
    unsafe_list = data["unsafe"].lower().split("\n")
    query = query.lower()
    return any(u in query for u in unsafe_list if u.strip())

# -----------------------------
# ⚖️ DECISION DETECTION
# -----------------------------
def is_decision_query(query):
    return any(k in query.lower() for k in ["better", "compare", "should i"])

# -----------------------------
# 🤖 LLM CALL
# -----------------------------
API_KEY = os.getenv("OPENROUTER_API_KEY") # 🔴 replace this

def call_llm(prompt):
    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    data_payload = {
        "model": "openrouter/auto",
        "messages": [{"role": "user", "content": prompt}]
    }

    response = requests.post(url, headers=headers, json=data_payload)
    result = response.json()

    if "error" in result:
        return f"⚠️ API Error: {result['error']['message']}"

    return result["choices"][0]["message"]["content"]

# -----------------------------
# 🧩 PARSE RESPONSE
# -----------------------------
def parse_response(text):
    problem, cause, solution = "", "", ""

    lines = text.split("\n")

    for line in lines:
        line_lower = line.lower()

        if line_lower.startswith("problem"):
            problem = line.split(":", 1)[-1].strip()

        elif line_lower.startswith("cause"):
            cause = line.split(":", 1)[-1].strip()

        elif line_lower.startswith("solution"):
            solution = line.split(":", 1)[-1].strip()

    return problem, cause, solution

# -----------------------------
# 🚀 MAIN PROCESS FUNCTION
# -----------------------------
def process_query(query, persona):

    # 🚫 Safety
    if is_unsafe(query):
        return {
            "answer": {
                "problem": "Unsafe request",
                "cause": "This violates system safety guidelines",
                "solution": "Please ask a different question"
            },
            "mode": "blocked"
        }

    # 🔎 Retrieve context
    context_chunks = retrieve(query)
    context = "\n\n".join(context_chunks)

    # 🎭 Persona
    persona_instruction = get_persona_prompt(persona)

    # 🧠 Prompt
    prompt = f"""
You are an intelligent AI assistant.

IMPORTANT:
- Follow the persona strictly.

Persona:
{persona_instruction}

Context:
{context}

Question:
{query}

Answer ONLY from context.

Format STRICTLY:
Problem:
Cause:
Solution:
"""

    # 🔥 CALL LLM
    raw_answer = call_llm(prompt)

    # 🔥 PARSE OUTPUT
    problem, cause, solution = parse_response(raw_answer)

    mode = "decision" if is_decision_query(query) else "normal"

    return {
        "answer": {
            "problem": problem,
            "cause": cause,
            "solution": solution
        },
        "mode": mode
    }

# -----------------------------
# 🌐 API ROUTES
# -----------------------------
@flask_app.route('/api/ask', methods=['POST'])
def ask():
    try:
        data_req = request.get_json()

        query = data_req.get('query', '')
        persona = data_req.get('persona', 'general').lower()

        if not query:
            return jsonify({'error': 'Query is required'}), 400

        result = process_query(query, persona)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@flask_app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'NeuroNav AI'}), 200


# ASGI wrapper
app = WsgiToAsgi(flask_app)

# -----------------------------
# ▶️ RUN SERVER
# -----------------------------
if __name__ == '__main__':
    flask_app.run(host='0.0.0.0', port=8001, debug=True)