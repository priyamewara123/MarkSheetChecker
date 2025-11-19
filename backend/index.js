const express = require("express");
const cors = require("cors");
const multer = require("multer"); // Still used, but configured for memory
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs"); // No longer needed for file reading, but keep for cleanup logic

// --- API and App Setup ---
const app = express();
app.use(cors({
  origin: "http://localhost:5173", // frontend URL
  methods: ["GET", "POST"],
  credentials: true
}));
const port = 3000;
const genAI = new GoogleGenerativeAI("AIzaSyCaVxkHNqSjm46Mk_wvutPubeUTBnjRF9Q");

// --- Multer Setup (In-Memory) ---
// --- 1. THIS IS THE MAIN CHANGE ---
// Instead of saving to disk, we use memoryStorage()
// The file will be available as a Buffer in req.file.buffer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// --- END OF CHANGE ---

// --- 2. New Helper Function (for Buffers) ---
// This function converts the Buffer from memory, not a file from disk
function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

// --- 3. Your Gemini Extraction Function (Modified) ---
// This now takes the buffer and mimeType directly.
async function getJsonFromImage(imageBuffer, mimeType) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  
  // --- CHANGED ---
  // Use the new bufferToGenerativePart function
  const imagePart = bufferToGenerativePart(imageBuffer, mimeType);

  const prompt = `
    You are an expert data extraction bot.
    Analyze the provided marksheet image and return a structured JSON object.

    Desired JSON structure:
    {
      "studentInfo": {
        "rollCode": "STUDENT'S ROLL CODE",
        "schoolName": "NAME OF -2 SCHOOL / COLLEGE",
        "rollNo": "STUDENT'S ROLL NO",
        "uniqueId": "STUDENT'S UNIQUE ID",
        "name": "NAME OF EXAMINEE",
        "motherName": "NAME OF MOTHER",
        "fatherName": "NAME OF FATHER",
        "registrationNo": "REGISTRATION NO",
        "sex": "SEX (MALE/FEMALE)",
        "caste": "CASTE",
        "category": "CATEGORY (REGULAR/PRIVATE)"
      },
      "subjects": [
        {
          "name": "Subject Name (e.g., ENGLISH, PHYSICS)",
          "theory": "Theory marks (string, or null if not applicable)",
          "practical": "Practical marks (string, or null if not applicable)",
          "total": "Total marks for this subject (string)"
        }
      ],
      "result": {
        "markSheetNo": "MARK SHEET NO",
        "certificateNo": "CERTIFICATE NO",
        "aggregateTotal": "AGGREGATE TOTAL (e.g., 241)",
        "finalResult": "FINAL RESULT (e.g., 2ND DIVISION)"
      }
    }
    
    CRITICAL: You must output *only* the valid JSON object.
    Do not include any other text, explanations, or markdown formatting.
  `;

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let rawJson = response.text();

    // Clean up potential markdown
    if (rawJson.startsWith("```json")) {
      rawJson = rawJson.substring(7, rawJson.length - 3).trim();
    }
    if (rawJson.startsWith("```")) {
      rawJson = rawJson.substring(3, rawJson.length - 3).trim();
    }

    return JSON.parse(rawJson);
  } catch (error) {
    console.error("Error in getJsonFromImage:", error);
    throw new Error("Failed to extract data from image.");
  }
}

// --- 4. Dummy Data Generator (Unchanged) ---
// --- 4. New Randomized Dummy Data Generator (with forced match) ---
/**
 * Creates a "dummy" version of the data.
 * @param {object} actualData - The correct JSON data.
 * @param {boolean} forceCorrect - If true, guarantees a 100% match.
 * @returns {object} - A new object, potentially with errors.
 */
function createDummyData(actualData, forceCorrect = false) {
    let dummyData = JSON.parse(JSON.stringify(actualData));

    // --- 1. Check for the forced correct flag ---
    if (forceCorrect) {
        console.log("DUMMY: Forcing a 100% correct match (client requested).");
        return dummyData; // Return the perfect copy
    }

    // --- 2. If not forced, run RANDOM checks ---
    console.log("DUMMY: Running random error generation.");

    // Potential Error 1: Change the name (50% chance)
    if (dummyData.studentInfo && dummyData.studentInfo.name && Math.random() < 0.5) {
        console.log("DUMMY: Introducing error in 'name'");
        dummyData.studentInfo.name = dummyData.studentInfo.name + " ROY";
    }
    
    // Potential Error 2: Change a random subject's total (60% chance)
    if (dummyData.subjects && dummyData.subjects.length > 0 && Math.random() < 0.6) {
        console.log("DUMMY: Introducing error in 'subjects'");
        let randIndex = Math.floor(Math.random() * dummyData.subjects.length);
        
        let originalTotal = parseInt(dummyData.subjects[randIndex].total, 10);
        if (!isNaN(originalTotal)) { // Check if total is a valid number
             dummyData.subjects[randIndex].total = (originalTotal + 2).toString();
        }
    }

    // Potential Error 3: Change the final result (50% chance)
    if (dummyData.result && dummyData.result.finalResult && Math.random() < 0.5) {
        console.log("DUMMY: Introducing error in 'finalResult'");
        if (dummyData.result.finalResult.includes("1ST")) {
            dummyData.result.finalResult = "2ND DIVISION";
        } else if (dummyData.result.finalResult.includes("2ND")) {
            dummyData.result.finalResult = "1ST DIVISION";
        } else {
             dummyData.result.finalResult = "FAIL";
        }
    }
    
    return dummyData;
}
// --- 5. The API Endpoint (Modified) ---
app.post("/api/verify-marksheet", upload.single("marksheetImage"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded." });
  }

  // --- CHANGED ---
  // No more 'imagePath'. We get the buffer and mimeType from req.file
  const imageBuffer = req.file.buffer;
  const mimeType = req.file.mimetype;
  // --- END OF CHANGE ---
  const forceCorrectMatch = (req.query.forceMatch === 'true');
  try {
    // Step 1: Extract data from the image buffer
    console.log(`Processing image in memory...`);
    const actualData = await getJsonFromImage(imageBuffer, mimeType);

    // Step 2: Generate dummy data
    console.log("Generating dummy data...",actualData);
    const dummyData = createDummyData(actualData,forceCorrectMatch);
    console.log("Dummy data generated.",dummyData);
    // Step 3: Send response
    console.log("Sending response to client.");
    res.json({
      message: "Verification data processed from memory.",
      scannedData: actualData,
      databaseData: dummyData
    });

  } catch (error) {
    console.error("Error in /api/verify-marksheet:", error.message);
    res.status(500).json({ error: "An error occurred while processing the marksheet." });
  }
  // No file cleanup is needed! The buffer is automatically cleared.
});

// --- 6. Start the Server ---
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
  console.log("Using IN-MEMORY upload. No 'uploads/' folder will be used.");
});