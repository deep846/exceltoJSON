const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT;

// Set up multer for file upload handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files to the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // File will be saved with timestamp-based filename
  },
});

const upload = multer({ storage: storage });

// Make sure the 'uploads' directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// API endpoint for uploading Excel file and converting it to JSON
app.post("/convert", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    // Read the Excel file
    const filePath = path.join(__dirname, "uploads", req.file.filename);
    const workbook = XLSX.readFile(filePath);

    // Extract data from the first sheet (you can change the sheet if needed)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet data to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Save the JSON data to a file (overwriting the existing file)
    const jsonFilePath = path.join(__dirname, "data.json");
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2)); // Pretty-print the JSON

    // Delete the uploaded file after processing
    fs.unlinkSync(filePath);

    // Send the JSON data as a response
    res.json(jsonData);
  } catch (error) {
    console.error("Error while converting the file: ", error);
    res.status(500).send("Error while processing the file.");
  }
});

app.get("/result", (req, res) => {
  const filepath = path.join(__dirname, "/data.json");
  res.sendFile(filepath);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
