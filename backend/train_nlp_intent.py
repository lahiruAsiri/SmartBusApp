import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
import joblib
import os

MODEL_DIR = 'models'
MODEL_PATH = os.path.join(MODEL_DIR, 'nlp_intent_model.pkl')

def ensure_model_dir():
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)

DATASET_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dataset', 'nlp_dataset.csv'))

def train_nlp_model():
    print(f"Training NLP Intent Classifier from {DATASET_PATH}...")
    
    if not os.path.exists(DATASET_PATH):
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        return
        
    df = pd.read_csv(DATASET_PATH)
    df = df.dropna() # Safety check for empty rows
    
    X = df['text']
    y = df['intent']
    
    # Create an NLP Pipeline:
    # 1. TF-IDF to convert text to numerical vectors
    # 2. Logistic Regression to classify the vectors
    model = make_pipeline(
        TfidfVectorizer(ngram_range=(1, 2), lowercase=True),
        LogisticRegression(random_state=42, class_weight='balanced')
    )
    
    model.fit(X, y)
    score = model.score(X, y)
    
    print(f"Training Accuracy: {score:.2f}")
    
    # Test it
    test_phrases = ["eta for 177 please", "will I get a seat tomorrow?", "hi"]
    print("\nTesting Model:")
    for phrase in test_phrases:
        intent = model.predict([phrase])[0]
        prob = max(model.predict_proba([phrase])[0])
        print(f"  '{phrase}' -> {intent} ({prob:.2f} confidence)")

    ensure_model_dir()
    joblib.dump(model, MODEL_PATH)
    print(f"\nModel saved successfully to {MODEL_PATH}")

if __name__ == "__main__":
    train_nlp_model()
