const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const ytdlMp3 = require("ytdl-mp3");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Allow 1000 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Path to cookies file
const cookiesPath = path.join(__dirname, "cookies.json");

// Ensure the cookies.json file exists
if (!fs.existsSync(cookiesPath)) {
  fs.writeFileSync(cookiesPath, JSON.stringify({ cookies: "" }, null, 2));
}

// Test route
app.get("/", (req, res) => {
  res.json({ message: "API is working!" });
});

// Get video information
app.get("/api/info", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    const info = await ytdlMp3.getInfo(url, {
      requestOptions: {
        headers: {
          cookie: getCookies(), // Use cookies to bypass CAPTCHA
        },
      },
    });

    res.json({
      title: info.videoDetails.title,
      description: info.videoDetails.description,
      duration: info.videoDetails.lengthSeconds,
      thumbnail: info.videoDetails.thumbnails[0].url,
    });
  } catch (error) {
    console.error("Error fetching video info:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Download MP3
app.get("/api/download-mp3", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    // Validate URL
    if (!ytdlMp3.validateURL(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    const mp3FileName = `audio-${Date.now()}.mp3`;
    const tempFilePath = path.join(__dirname, "temp", mp3FileName);

    // Create temp directory if not exists
    if (!fs.existsSync(path.join(__dirname, "temp"))) {
      fs.mkdirSync(path.join(__dirname, "temp"));
    }

    // Download MP3
    ytdlMp3.download(url, tempFilePath, {
      quality: "highestaudio",
      requestOptions: {
        headers: {
          cookie: getCookies(), // Use cookies to bypass CAPTCHA
        },
      },
    })
      .then(() => {
        // Stream the file to the client
        res.download(tempFilePath, mp3FileName, (err) => {
          if (err) {
            console.error("Error sending file:", err.message);
            res.status(500).json({ error: "Failed to download MP3" });
          } else {
            // Delete temp file after successful download
            fs.unlinkSync(tempFilePath);
          }
        });
      })
      .catch((error) => {
        console.error("Error downloading MP3:", error.message);
        res.status(500).json({ error: "Failed to download MP3" });
      });
  } catch (error) {
    console.error("Error downloading MP3:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get cookies
function getCookies() {
  try {
    const cookiesData = JSON.parse(fs.readFileSync(cookiesPath, "utf8"));
    return cookiesData.cookies || "";
  } catch (err) {
    console.error("Error reading cookies file:", err.message);
    return "";
  }
}

// Helper function to update cookies
app.post("/api/update-cookies", (req, res) => {
  try {
    const { cookies } = req.body;

    if (!cookies) {
      return res.status(400).json({ error: "Cookies parameter is required" });
    }

    fs.writeFileSync(
      cookiesPath,
      JSON.stringify({ cookies }, null, 2),
      "utf8"
    );

    res.json({ message: "Cookies updated successfully" });
  } catch (err) {
    console.error("Error updating cookies:", err.message);
    res.status(500).json({ error: "Failed to update cookies" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
