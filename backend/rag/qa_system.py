import numpy as np
import faiss
import requests
from sentence_transformers import SentenceTransformer

from data_loader import load_all_data
from embedder import chunk_text

# 🔑 PUT YOUR OPENROUTER API KEY HERE
API_KEY = "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"

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")


# -----------------------------
# 🎭 PERSONA HANDLING
# -----------------------------
def get_persona_prompt(persona):

    if persona == "student":
        return "Explain in very simple, beginner-friendly language with examples."

    elif persona == "developer":
        return "Give a technical, detailed explanation with proper terminology."

    elif persona == "manager":
        return "Give a high-level explanation focusing on impact and decisions."

    else:
        return "Give a clear and balanced explanation."


# -----------------------------
# 🔍 CREATE FAISS INDEX
# -----------------------------
def create_index(chunks):
    embeddings = model.encode(chunks)
    dimension = embeddings.shape[1]

    index = faiss.IndexFlatL2(dimension)
    index.add(np.array(embeddings))

    return index, embeddings


# -----------------------------
# 🔎 RETRIEVE CONTEXT
# -----------------------------
def retrieve(query, chunks, index, top_k=3):
    query_embedding = model.encode([query])
    distances, indices = index.search(np.array(query_embedding), top_k)

    return [chunks[i] for i in indices[0]]


# -----------------------------
# 🚫 SAFETY CHECK
# -----------------------------
def is_unsafe(query):
    unsafe_keywords = [
        "hack", "bypass", "break into", "unauthorized",
        "access someone's", "wifi without permission",
        "steal wifi", "crack password", "exploit"
    ]

    query = query.lower()
    return any(keyword in query for keyword in unsafe_keywords)


# -----------------------------
# ⚖️ DECISION DETECTION
# -----------------------------
def is_decision_query(query):
    keywords = ["better", "compare", "should i", "which is best"]
    return any(k in query.lower() for k in keywords)


# -----------------------------
# 🤖 NORMAL ANSWER (UPDATED)
# -----------------------------
def generate_answer(query, context, persona):

    persona_instruction = get_persona_prompt(persona)

    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    prompt = f"""
You are an intelligent AI assistant.

IMPORTANT:
Follow the persona strictly.

Persona Instruction:
{persona_instruction}

Answer ONLY using the context below.

Format STRICTLY:
Problem:
Cause:
Solution:

If info missing → say "I don't have enough information."

Context:
{context}

Question:
{query}
"""

    data = {
        "model": "openrouter/auto",
        "messages": [{"role": "user", "content": prompt}]
    }

    response = requests.post(url, headers=headers, json=data)
    result = response.json()

    if "error" in result:
        return f"⚠️ API Error: {result['error']['message']}"

    return result["choices"][0]["message"]["content"]


# -----------------------------
# ⚖️ DECISION MODE (UPDATED)
# -----------------------------
def generate_decision_answer(query, context, persona):

    persona_instruction = get_persona_prompt(persona)

    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    prompt = f"""
You are an AI assistant.

Persona:
{persona_instruction}

The user is asking for a decision.

Do this:
1. Identify options
2. Compare clearly
3. Recommend one

Context:
{context}

Question:
{query}
"""

    data = {
        "model": "openrouter/auto",
        "messages": [{"role": "user", "content": prompt}]
    }

    response = requests.post(url, headers=headers, json=data)
    result = response.json()

    return result["choices"][0]["message"]["content"]


# -----------------------------
# 🚀 MAIN LOOP
# -----------------------------
if __name__ == "__main__":

    data = load_all_data()

    full_text = data["troubleshooting"] + "\n" + data["faq"]

    chunks = chunk_text(full_text)

    index, embeddings = create_index(chunks)

    print("🤖 Ask your question (type 'exit' to quit)\n")

    while True:
        query = input("You: ")

        if query.lower() == "exit":
            break

        # 👇 ADD PERSONA INPUT
        persona = input("Select persona (general/student/developer/manager): ").lower()

        if is_unsafe(query):
            print("\nAI: 🚫 This request violates system safety guidelines.\n")
            continue

        context_chunks = retrieve(query, chunks, index)
        context = "\n\n".join(context_chunks)

        if is_decision_query(query):
            answer = generate_decision_answer(query, context, persona)
        else:
            answer = generate_answer(query, context, persona)

        print("\nAI:", answer, "\n")