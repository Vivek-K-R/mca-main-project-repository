import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow import keras
from keras import layers



# Set dataset path
DATASET_PATH = "D:\Campaigns\PersonalQuests\Main Project\OCR ML\sentence"
IMAGE_PATH = os.path.join(DATASET_PATH, "D:\Campaigns\PersonalQuests\Main Project\OCR ML\sentence\dataset")
LABELS_FILE = os.path.join(DATASET_PATH, "D:\Campaigns\PersonalQuests\Main Project\OCR ML\sentence\metadata\sentences.txt")



# Read label file
def load_labels(labels_file):
    labels = {}
    with open(labels_file, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split("\t")  # Ensure tab-separated values
            if len(parts) == 2:
                image_name, text = parts
                labels[image_name] = text
    return labels

# Load the labels
labels_dict = load_labels(LABELS_FILE)



IMG_WIDTH, IMG_HEIGHT = 128, 32  # Resize images to uniform size

def preprocess_image(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)  # Read in grayscale
    img = cv2.resize(img, (IMG_WIDTH, IMG_HEIGHT))  # Resize
    img = img / 255.0  # Normalize pixel values (0 to 1)
    img = np.expand_dims(img, axis=-1)  # Add channel dimension
    return img

# Prepare dataset (X = images, Y = text labels)
X = []
Y = []
for image_name, text in labels_dict.items():
    image_path = os.path.join(IMAGE_PATH, image_name)
    if os.path.exists(image_path):
        X.append(preprocess_image(image_path))
        Y.append(text)  # Keep text as label

X = np.array(X)  # Convert to NumPy array


from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Tokenize text labels
tokenizer = Tokenizer(char_level=True)  # Character-based tokenization
tokenizer.fit_on_texts(Y)

# Convert text to sequences
Y_sequences = tokenizer.texts_to_sequences(Y)

# Pad sequences to the same length
MAX_LABEL_LEN = max(len(seq) for seq in Y_sequences)  # Get longest text
Y_padded = pad_sequences(Y_sequences, maxlen=MAX_LABEL_LEN, padding='post')
