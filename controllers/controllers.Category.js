import Users from '../models/Users.js'
import Category from '../models/Categories.js'

export default {
    getAllCategories: async (req, res) => {
        try {
            const userId = req.user.id;

            if (!userId) {
                return res.status(401).json({
                    message: 'Unauthorized: User is not authenticated',
                });
            }

            const user = await Users.findByPk(userId);
            if (!user) {
                return res.status(404).send({
                    message: 'User not found',
                })
            }

            const categories = await Category.findAll()
            return res.status(200).json({
                categories,

            });
        }catch(err) {
            console.error('Error in getAllCategories:', err);
            return res.status(500).json({
                message: 'Internal Server Error',
                error: err.message
            })
        }
    }
}