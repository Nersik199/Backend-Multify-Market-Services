import fs from 'fs/promises';
import { v2 as cloudinary } from 'cloudinary';
export default (schemas, target) => {
	return async (req, res, next) => {
		const { error } = schemas.validate(req[target], {
			abortEarly: false,
		});
		if (error) {
			if (req.file) {
				await cloudinary.uploader.destroy(req.file.filename);
			}
			if (req.files) {
				req.files.forEach(file => fs.unlink(file.path));
			}
			const fields = {};
			error.details.forEach(detail => {
				fields[detail.path[0]] = detail.message;
			});
			const hasErrors = Object.keys(fields).length > 0;
			if (hasErrors) {
				return res.status(422).json({
					message: 'Validation error',
					fields,
				});
			}
		}
		next();
	};
};
