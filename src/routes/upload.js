const express = require('express');
const multer = require('multer');
const cloudinary = require('../../src/utils/cloudinary');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (error, result) => {
        if (error) return res.status(500).json({ error });
        res.status(200).json({ url: result.secure_url });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err });
  }
});

module.exports = router;
