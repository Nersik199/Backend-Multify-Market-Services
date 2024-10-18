import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';

const { CLOUD_NAME, API_SECRET_MULTER, API_KEY } = process.env;

cloudinary.config({
	cloud_name: CLOUD_NAME,
	api_key: API_KEY,
	api_secret: API_SECRET_MULTER,
});

function uploadFilePath(folder) {
	const storage = new CloudinaryStorage({
		cloudinary: cloudinary,
		params: {
			folder: folder,
			allowed_formats: ['png', 'jpg', 'jpeg'],
			public_id: (req, file) => {
				const ext = path.extname(file.originalname).toLowerCase();
				const name = `${new Date().toISOString()}-${file.originalname
					.toLowerCase()
					.replace(/\s+/g, '')
					.trim()}`.replace(ext, '');
				return `${name}`;
			},
		},
	});

	return { storage };
}
export default folder => {
	const { storage } = uploadFilePath(folder);
	return multer({ storage });
};
