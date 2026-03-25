import os

# Folder where your dataset is stored

DATA_FOLDER = "sample_data/"


def load_text_file(file_path):
    """Loads text from a file"""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def load_all_data():
    """Loads all dataset files"""
    
    data = {}

    # Load troubleshooting data
    troubleshooting_path = os.path.join(DATA_FOLDER, "troubleshooting.txt")
    data["troubleshooting"] = load_text_file(troubleshooting_path)

    # Load FAQ data
    faq_path = os.path.join(DATA_FOLDER, "faq.txt")
    data["faq"] = load_text_file(faq_path)

    # Load unsafe queries
    unsafe_path = os.path.join(DATA_FOLDER, "unsafe.txt")
    data["unsafe"] = load_text_file(unsafe_path)

    return data


if __name__ == "__main__":
    dataset = load_all_data()

    print("Data Loaded Successfully!\n")

    print("Troubleshooting Sample:\n", dataset["troubleshooting"][:200])
    print("\nFAQ Sample:\n", dataset["faq"][:200])
    print("\nUnsafe Queries:\n", dataset["unsafe"])