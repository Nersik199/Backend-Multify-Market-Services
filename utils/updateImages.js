import { v2 as cloudinary } from 'cloudinary';
import Photo from '../models/Photo.js';

async function updateImages(folder, files, imageId) {
	try {
		const ImgArr = Array.isArray(imageId)
			? imageId
			: imageId.split(',').map(id => id.trim());
		const fileArr = Array.isArray(files) ? files : [files];

		let notFoundImages = [];

		for (let i = 0; i < ImgArr.length; i++) {
			const id = ImgArr[i];
			const file = fileArr[i] || fileArr[0];

			const oldImage = await Photo.findOne({ where: { id } });

			if (!oldImage) {
				notFoundImages.push(id);
				continue;
			}

			const fileName = `${folder}/${oldImage.path
				.split('/')
				.pop()
				.split('.')
				.slice(0, -1)
				.join('.')}`;
			await cloudinary.uploader.destroy(fileName);
			await Photo.update({ path: file.path }, { where: { id } });
		}

		if (notFoundImages.length) {
			return {
				success: false,
				message: `Images not found: ${notFoundImages.join(', ')}`,
			};
		}

		return { success: true, message: 'Images updated successfully' };
	} catch (error) {
		console.error('Error updating images:', error);
		return { success: false, message: 'Error updating images' };
	}
}

export default updateImages;
