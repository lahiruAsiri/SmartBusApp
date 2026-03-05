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

# Synthetic Training Data for Intents
# In a real app, this would be a much larger dataset of user queries.
TRAINING_DATA = [
    # CROWD
    ("Will the bus be crowded?", "predict_crowd"),
    ("Is route 177 full right now?", "predict_crowd"),
    ("How many people are on the bus?", "predict_crowd"),
    ("Will 177 be crowded tmrw 9am?", "predict_crowd"),
    ("Can I get a seat on the next bus?", "predict_crowd"),
    ("Is it packed at 5pm?", "predict_crowd"),
    ("What is the crowd level?", "predict_crowd"),
    
    # ETA / TIME
    ("Predict ETA for 177", "predict_eta"),
    ("When is the next bus arriving?", "predict_eta"),
    ("How long until route 177 reaches me?", "predict_eta"),
    ("Is the bus delayed?", "predict_eta"),
    ("What time will the bus arrive at Malabe?", "predict_eta"),
    ("Show me the ETA", "predict_eta"),
    ("How many minutes left?", "predict_eta"),
    
    # ROUTE / FIND
    ("Find bus to Malabe", "find_route"),
    ("Which bus goes to Kaduwela?", "find_route"),
    ("I need to go to Colombo", "find_route"),
    ("How do I get to the hospital?", "find_route"),
    ("Show me directions to Malabe", "find_route"),
    
    # GREETING / GENERAL
    ("Hello", "greeting"),
    ("Hi there", "greeting"),
    ("Who are you?", "greeting"),
    ("Help me", "greeting"),
    ("Good morning", "greeting"),
    ("Sup", "greeting")
]

def train_nlp_model():
    print("Training NLP Intent Classifier...")
    df = pd.DataFrame(TRAINING_DATA, columns=['text', 'intent'])
    
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
