import Products from '../models/Products.js'
import Users from '../models/Users.js'
import ProductCategories from "../models/ProductCategories.js";
import {Op,Sequelize} from 'sequelize';

export default {
    async getProducts(req, res) {
        try {
            const total = await Products.count()

            let page = +req.query.page;
            let limit = +req.query.limit;
            let offset = (page - 1) * limit;


            const maxPageCount = Math.ceil(total / limit);

            if (page > maxPageCount) {
                res.status(404).json({
                    message: 'Product does not exist',
                });
                return
            }


            const productsList = await Products.findAll({
                limit,
                offset,
                include: [
                    {
                        model: Users,
                    }
                ],
                order: [
                    ['createdAt', 'Desc']
                ],
            });

            if (productsList.length === 0) {
                return res.status(404).json({
                    message: 'No products found'
                });
            }

            res.status(200).json(
                {
                    message: 'Products retrieved successfully',
                    products: productsList
                });

        } catch (error) {
            console.error('Error fetching products:', error);
            return res.status(500).json({
                message: 'An error occurred while retrieving products',
                error: error.message
            });
        }
    },
}