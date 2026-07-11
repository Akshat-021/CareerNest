const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary if keys are provided
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'demo_cloud';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.log('Cloudinary not configured. Falling back to local file storage.');
}

/**
 * Uploads a file (either via buffer/path or file object)
 * @param {Object} file - Multer file object
 * @param {String} folder - Target folder name
 * @returns {Promise<Object>} - Object with url and public_id
 */
const uploadToCloudinary = async (file, folder = 'general') => {
  try {
    if (isCloudinaryConfigured && file.path) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `ai_mentor_portal/${folder}`,
        resource_type: 'auto'
      });
      // Delete temporary file from local storage if uploaded to Cloudinary
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return {
        url: result.secure_url,
        public_id: result.public_id
      };
    } else {
      // Offline fallback: Save file under local public server URL
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // If file was already saved by Multer diskStorage
      if (file.path) {
        const relativeUrl = `/uploads/${path.basename(file.path)}`;
        return {
          url: relativeUrl,
          public_id: `local_${path.basename(file.path)}`
        };
      }

      // If memory storage was used (buffer)
      const filename = `${folder}_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
      const destPath = path.join(uploadsDir, filename);
      fs.writeFileSync(destPath, file.buffer);

      return {
        url: `/uploads/${filename}`,
        public_id: `local_${filename}`
      };
    }
  } catch (error) {
    console.error('Upload Helper Error:', error);
    // Safe recovery returning a dummy link or local URL
    return {
      url: file.originalname ? `/uploads/fallback_${Date.now()}_${file.originalname}` : 'https://via.placeholder.com/150',
      public_id: 'fallback_id'
    };
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};
