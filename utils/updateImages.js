import { v2 as cloudinary } from 'cloudinary';
import Photo from '../models/Photo.js';

async function updateImages(res, folder, files, imageId) {
	try {
		const ImgArr = imageId.split(',').map(id => id.trim());

		if (ImgArr.length > 0 && files && files.length > 0) {
			for (const id of ImgArr) {
				const oldImage = await Photo.findOne({ where: { id } });

				if (!oldImage) {
					for (const file of files) {
						await cloudinary.uploader.destroy(file.filename);
					}
					res.status(400).json({
						message: 'Images with the specified ID not found',
					});
					return;
				}

				const fileName = `${folder}/${oldImage.path
					.split('/')
					.pop()
					.split('.')
					.slice(0, -1)
					.join('.')}`;

				await cloudinary.uploader.destroy(fileName);

				for (const file of files) {
					await Photo.update({ path: file.path }, { where: { id } });
				}
			}
		}
	} catch (error) {
		console.error('Error updating images:', error);
	}
}

export default updateImages;
