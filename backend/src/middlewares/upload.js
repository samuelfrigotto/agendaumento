const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo nao permitido. Use JPEG, PNG ou WebP.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024
  }
});

const processImage = async (buffer, banhistaId, prefix = 'img') => {
  const uploadPath = process.env.UPLOAD_PATH || './uploads';
  const banhistaDir = path.join(uploadPath, banhistaId);

  await fs.mkdir(banhistaDir, { recursive: true });

  const filename = `${prefix}_${Date.now()}.webp`;
  const filepath = path.join(banhistaDir, filename);

  await sharp(buffer)
    .resize(800, 800, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: 80 })
    .toFile(filepath);

  return `/uploads/${banhistaId}/${filename}`;
};

const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const relativePath = imageUrl.replace('/uploads/', '');
    const fullPath = path.join(uploadPath, relativePath);

    await fs.unlink(fullPath);
  } catch (error) {
    console.error('Erro ao deletar imagem:', error.message);
  }
};

module.exports = {
  upload,
  processImage,
  deleteImage
};
