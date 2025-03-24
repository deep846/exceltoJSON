const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); // Import the CORS package

// Initialize the express app
const app = express();
const port = process.env.PORT || 3004;

// Enable CORS for all origins (any domain can access the API)
app.use(cors()); // This will allow all origins

// Configure Multer to handle file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // Store uploaded files in the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Ensure unique filenames
  },
});
const upload = multer({ storage: storage });

// Function to extract and parse JSON from log message
function extractJson(logData) {
  try {
    const jsonStart = logData.indexOf("{");
    const jsonEnd = logData.lastIndexOf("}") + 1;
    const jsonStr = logData.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonStr); // Parse and return the JSON object
  } catch (error) {
    console.error("Error parsing log data:", error);
    return null;
  }
}

// API endpoint to upload the Excel file and return the parsed JSON
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const filePath = path.join(__dirname, "uploads", req.file.filename);

  // Read the uploaded Excel file
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Get the first sheet
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet data to JSON format
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Read rows as an array of arrays
    const jsonData = [];

    // Iterate over each row and process the log data
    rows.forEach((row, index) => {
      const logData = row[0]; // Assuming the log data is in the first column

      // Extract JSON from the log data
      const parsedJson = extractJson(logData);

      if (parsedJson) {
        jsonData.push(parsedJson); // Add the parsed JSON to the result array
      }
    });

    // Save the parsed JSON data to a local file (output_data.json)
    const outputFilePath = path.join(__dirname, "output_data.json");
    fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 4));

    console.log(`Data has been saved to ${outputFilePath}`);

    // Respond with the parsed JSON data
    res.json(jsonData);

    // Clean up the uploaded file after processing
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("Error reading or processing the file:", error);
    res.status(500).send("Error processing the file.");
  }
});

// making get request for json file
app.get("/result", (req, res) => {
  const filepath = path.join(__dirname + "/output_data.json");
  res.sendFile(filepath);
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
