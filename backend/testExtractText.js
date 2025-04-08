import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient();

async function testVision() {
  try {
    // ✅ Change "test-image.jpg" to the actual file name
    const filePath = "uploads/1741504351661-answerBiology.jpg";  

    // ✅ Send the file to Google Vision API for text detection
    const [result] = await client.textDetection(filePath);
    const extractedText = result.textAnnotations[0]?.description || "No text found.";

    console.log("✅ Extracted Text:\n", extractedText);
  } catch (error) {
    console.error("❌ Google Vision API Error:", error);
  }
}

testVision();
