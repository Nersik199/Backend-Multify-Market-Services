import Category from '../models/Categories.js';
import Photo from '../models/Photo.js';

export default {
	getAllCategories: async (req, res) => {
		try {
			const { page = 1, limit = 10 } = req.query;
			const offset = (page - 1) * limit;
			const total = await Category.count();
			const maxPageCount = Math.ceil(total / offset);

			if (page > maxPageCount) {
				return res.status(404).json({
					message: 'Page not found',
				});
			}
			const categories = await Category.findAll(
				{
					include: [
						{
							model: Photo,
							as: 'categoryImage',
							attributes: ['path', 'id'],
						},
					],
					limit: +limit,
					offset: +offset,
				},
				{
					order: [['name', 'ASC']],
				}
			);
			return res.status(200).json({
				message: 'Categories fetched successfully',
				total,
				default: 'limit=5 page=1',
				categories,
			});
		} catch (err) {
			console.error('Error in getAllCategories:', err);
			return res.status(500).json({
				message: 'Internal Server Error',
				error: err.message,
			});
		}
	},
};
