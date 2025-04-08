from flask import Flask, request, jsonify
import os
import io
from google.cloud import vision
import google.generativeai as genai
from flask_cors import CORS  # Enable frontend-backend communication

app = Flask(__name__)
CORS(app)  # Allow React to communicate with Flask

# Set API Keys
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "profound-maker-423514-f5-f7bf7697bdf8.json"
GEMINI_API_KEY = "AIzaSyAIYq5nvKjqynQ7P7cyypCEGXBr5rDl2DY"
genai.configure(api_key=GEMINI_API_KEY)

def extract_text_from_image(image_file):
    """Extracts text from an uploaded image using Google Vision API."""
    client = vision.ImageAnnotatorClient()
    content = image_file.read()
    image = vision.Image(content=content)
    response = client.text_detection(image=image)
    
    if response.text_annotations:
        return response.text_annotations[0].description
    return "No text detected."

def summarize_text_gemini(text):
    """Summarizes extracted text using Google Gemini API."""
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(
        f"""
        Summarize this text with important points.
        If there are different sections like questions, maintain formatting.
        
        Example:
        - **Question 1:** Summary of the answer.
        - **Question 2:** Summary of the answer.
        
        Text:
        {text}
        """
    )
    
    if response and hasattr(response, "text"):
        return response.text.replace("\n", "<br>")  # Convert to HTML format
    return "Summary not generated."

@app.route("/upload", methods=["POST"])
def upload_file():
    """Handles image upload, performs OCR, and summarizes text."""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Extract text from image
    extracted_text = extract_text_from_image(file)

    # Summarize the extracted text
    summarized_text = summarize_text_gemini(extracted_text)

    return jsonify({"summary": summarized_text})

if __name__ == "__main__":
    app.run(debug=True)
