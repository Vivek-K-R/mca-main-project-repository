import os
import io
from tkinter import filedialog
import google.generativeai as genai
from google.cloud import vision

# 🔹 Set API Keys
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "profound-maker-423514-f5-f7bf7697bdf8.json"  # Replace with your Vision API JSON file
GEMINI_API_KEY = "AIzaSyAIYq5nvKjqynQ7P7cyypCEGXBr5rDl2DY"  # Replace with your Gemini API Key

# 🔹 Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

def select_image():
    """Opens a file dialog to select an image."""
    file_path = filedialog.askopenfilename(
        title="Select an Image File",
        filetypes=[("Image Files", "*.jpg *.png *.jpeg *.bmp")]
    )
    return file_path

def extract_text_from_image(image_path):
    """Extracts text from an image using Google Vision API."""
    client = vision.ImageAnnotatorClient()

    with io.open(image_path, "rb") as image_file:
        content = image_file.read()

    image = vision.Image(content=content)
    response = client.text_detection(image=image)

    if response.text_annotations:
        return response.text_annotations[0].description
    return "No text detected."

def summarize_text_gemini(text):
    """Summarizes extracted text using Google Gemini API."""
    model = genai.GenerativeModel("gemini-1.5-flash")  # ✅ Corrected (Use an actual model object)
    response = model.generate_content(f"Summarize this text with important points that matter. Also separate the content if there exist any separation like question number:\n\n{text}")
    
    if response and hasattr(response, "text"):  # ✅ Check if response has text attribute
        return response.text
    return "Summary not generated."

if __name__ == "__main__":
    # 🔹 Open file dialog to select an image
    image_path = select_image()

    if not image_path:
        print("❌ No file selected. Exiting.")
    else:
        print(f"\n🔹 Processing: {image_path}")
        
        # 🔹 Extract text from image
        extracted_text = extract_text_from_image(image_path)
        print("\nExtracted Text:\n", extracted_text)

        # 🔹 Summarize text using Gemini API
        summarized_text = summarize_text_gemini(extracted_text)
        print("\n🔹 Summarized Text:\n", summarized_text)
