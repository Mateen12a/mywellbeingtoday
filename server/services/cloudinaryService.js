import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isConfigured = () => {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
};

export const uploadToCloudinary = async (fileData, options = {}) => {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const {
    folder = 'mywellbeingtoday',
    resourceType = 'auto',
    transformation = null,
    publicId = null,
  } = options;

  const uploadOptions = {
    folder,
    resource_type: resourceType,
    overwrite: true,
  };

  if (publicId) {
    uploadOptions.public_id = publicId;
  }

  if (transformation) {
    uploadOptions.transformation = transformation;
  }

  const result = await cloudinary.uploader.upload(fileData, uploadOptions);

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    resourceType: result.resource_type,
  };
};

export const uploadProfilePicture = async (fileData, userId) => {
  return uploadToCloudinary(fileData, {
    folder: 'mywellbeingtoday/profiles',
    publicId: `profile_${userId}`,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
};

export const uploadChatAttachment = async (fileData, userId) => {
  return uploadToCloudinary(fileData, {
    folder: 'mywellbeingtoday/chat',
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
};

export const uploadDocument = async (fileData, options = {}) => {
  const { folder = 'mywellbeingtoday/documents', publicId = null } = options;
  return uploadToCloudinary(fileData, {
    folder,
    resourceType: 'auto',
    publicId,
  });
};

export const uploadCertificate = async (fileData, userId) => {
  return uploadToCloudinary(fileData, {
    folder: 'mywellbeingtoday/certificates',
    resourceType: 'auto',
  });
};

export const uploadReport = async (fileData, userId, reportId) => {
  return uploadToCloudinary(fileData, {
    folder: 'mywellbeingtoday/reports',
    publicId: `report_${userId}_${reportId}`,
    resourceType: 'raw',
  });
};

export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured');
  }
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  return result;
};

export { isConfigured as isCloudinaryConfigured };
export default cloudinary;
