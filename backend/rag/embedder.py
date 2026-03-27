from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from data_loader import load_all_data

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")


def chunk_text(text, chunk_size=200):
    """Split text into small chunks"""
    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)

    return chunks


def create_embeddings(chunks):
    """Convert text chunks into embeddings"""
    embeddings = model.encode(chunks)
    return embeddings


def store_in_faiss(embeddings):
    """Store embeddings in FAISS index"""
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    return index


if __name__ == "__main__":
    data = load_all_data()

    # Combine all useful data
    full_text = data["troubleshooting"] + "\n" + data["faq"]

    # Step 1: Chunk
    chunks = chunk_text(full_text)
    print(f"Created {len(chunks)} chunks")

    # Step 2: Embeddings
    embeddings = create_embeddings(chunks)
    print("Embeddings created")

    # Step 3: Store in FAISS
    index = store_in_faiss(np.array(embeddings))
    print("Stored in FAISS index")

    print("\nYour RAG base is ready!")