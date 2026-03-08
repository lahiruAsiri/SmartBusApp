import joblib
import os

MODEL_PATH = 'models/nlp_intent_model.pkl'

def test_chat():
    print("\n-----------------------------------------------------------")
    print("🤖 SmartBus NLP Tester")
    print("Type any random phrase about busses, ETA, routes, or crowds.")
    print("Type 'exit' to quit.")
    print("-----------------------------------------------------------\n")

    if not os.path.exists(MODEL_PATH):
        print(f"ERROR: Model file {MODEL_PATH} not found. Train it first!")
        return

    # Load the trained pipeline (TF-IDF Vectorizer + Logistic Regression model)
    model = joblib.load(MODEL_PATH)
    
    while True:
        try:
            user_input = input("You: ")
            
            if user_input.strip().lower() in ['exit', 'quit']:
                print("Exiting. Goodbye!")
                break
                
            if not user_input.strip():
                continue
                
            # Use the pipeline to predict the intent and probability
            predicted_intent = model.predict([user_input])[0]
            probability = max(model.predict_proba([user_input])[0])
            
            # Print the result back to the user
            print(f"  --> Identified Intent: [{predicted_intent}] (Confidence: {probability*100:.1f}%)")
            
        except KeyboardInterrupt:
            print("\nExiting. Goodbye!")
            break

if __name__ == "__main__":
    test_chat()
