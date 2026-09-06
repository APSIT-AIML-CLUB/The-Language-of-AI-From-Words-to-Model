from textblob import TextBlob

print("===== Sentiment Analysis =====")

while True:
    text = input("\nEnter a sentence (or type 'exit'): ")

    if text.lower() == "exit":
        break

    blob = TextBlob(text)

    polarity = blob.sentiment.polarity

    print(f"\nPolarity Score : {polarity:.2f}")

    if polarity > 0:
        sentiment = "Positive 😊"
    elif polarity < 0:
        sentiment = "Negative 😞"
    else:
        sentiment = "Neutral 😐"

    print(f"Sentiment      : {sentiment}")