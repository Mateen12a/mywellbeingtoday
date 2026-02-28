import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  uploadProfilePicture,
  uploadChatAttachment,
  uploadDocument,
  uploadCertificate,
  uploadReport,
  isCloudinaryConfigured,
} from '../services/cloudinaryService.js';

const router = Router();

router.use(authenticate);

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOC_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];

const validateBase64File = (file, allowedTypes = ALLOWED_DOC_TYPES, maxSize = MAX_FILE_SIZE) => {
  if (!file || typeof file !== 'string') {
    return { valid: false, message: 'No file data provided' };
  }
  if (!file.startsWith('data:')) {
    return { valid: false, message: 'Invalid file format. Expected base64 data URL.' };
  }
  const mimeMatch = file.match(/^data:([^;]+);base64,/);
  if (!mimeMatch) {
    return { valid: false, message: 'Invalid base64 data URL format' };
  }
  const mimeType = mimeMatch[1];
  if (!allowedTypes.includes(mimeType)) {
    return { valid: false, message: `File type ${mimeType} is not allowed. Accepted: ${allowedTypes.join(', ')}` };
  }
  const base64Data = file.split(',')[1];
  if (base64Data) {
    const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
    if (sizeInBytes > maxSize) {
      return { valid: false, message: `File size exceeds maximum of ${Math.round(maxSize / 1024 / 1024)}MB` };
    }
  }
  return { valid: true };
};

const requireCloudinary = (req, res, next) => {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({ success: false, message: 'File storage service is not configured' });
  }
  next();
};

router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: { configured: isCloudinaryConfigured() },
  });
});

router.post('/profile-picture', requireCloudinary, async (req, res) => {
  try {
    const { file } = req.body;
    const validation = validateBase64File(file, ALLOWED_IMAGE_TYPES);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const result = await uploadProfilePicture(file, req.user._id);

    res.json({
      success: true,
      message: 'Profile picture uploaded',
      data: result,
    });
  } catch (error) {
    console.error('[UPLOAD] Profile picture error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to upload profile picture' });
  }
});

router.post('/chat-attachment', requireCloudinary, async (req, res) => {
  try {
    const { file } = req.body;
    const validation = validateBase64File(file);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const result = await uploadChatAttachment(file, req.user._id);

    res.json({
      success: true,
      message: 'Attachment uploaded',
      data: result,
    });
  } catch (error) {
    console.error('[UPLOAD] Chat attachment error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to upload attachment' });
  }
});

router.post('/document', requireCloudinary, async (req, res) => {
  try {
    const { file } = req.body;
    const validation = validateBase64File(file);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const result = await uploadDocument(file);

    res.json({
      success: true,
      message: 'Document uploaded',
      data: result,
    });
  } catch (error) {
    console.error('[UPLOAD] Document error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
});

router.post('/certificate', requireCloudinary, async (req, res) => {
  try {
    const { file } = req.body;
    const validation = validateBase64File(file);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const result = await uploadCertificate(file, req.user._id);

    res.json({
      success: true,
      message: 'Certificate uploaded',
      data: result,
    });
  } catch (error) {
    console.error('[UPLOAD] Certificate error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to upload certificate' });
  }
});

router.post('/report', requireCloudinary, async (req, res) => {
  try {
    const { file } = req.body;
    const validation = validateBase64File(file, [...ALLOWED_DOC_TYPES, 'application/octet-stream']);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const result = await uploadReport(file, req.user._id, Date.now());

    res.json({
      success: true,
      message: 'Report uploaded',
      data: result,
    });
  } catch (error) {
    console.error('[UPLOAD] Report error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to upload report' });
  }
});

export default router;
