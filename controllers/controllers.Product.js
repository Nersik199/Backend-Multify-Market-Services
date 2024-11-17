import Products from '../models/Products.js'
import ProductCategories from "../models/ProductCategories.js";
import Photo from "../models/Photo.js";
import Stores from "../models/Stores.js";
import {Op} from "sequelize";

const calculatePagination = (page, limit, total) => {
    const maxPageCount = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    return { maxPageCount, offset };
};

const handleErrorResponse = (res, status, message, error = null) => {
    console.error(message, error);
    return res.status(status).json({ message, error: error?.message });
};

export default {
    async getProducts(req, res) {
        try {
            const total = await Products.count();
            const page = +req.query.page || 1;
            const limit = +req.query.limit || 10;

            const { maxPageCount, offset } = calculatePagination(page, limit, total);

            if (page > maxPageCount) {
                return res.status(404).json({ message: 'Product does not exist' });
            }

            const productsList = await Products.findAll({
                limit,
                offset,
                include: [
                    {
                        model: Photo,
                        as: 'productImage',
                        attributes: ['id', 'name'],
                    },
                    {
                        model: Stores,
                        as: 'store',
                        attributes: ['name'],
                    },
                ],
                order: [['createdAt', 'DESC']],
            });

            if (productsList.length === 0) {
                return res.status(404).json({ message: 'No products found' });
            }

            return res.status(200).json({
                message: 'Products retrieved successfully',
                products: productsList,
            });
        } catch (error) {
            return handleErrorResponse(res, 500, 'Error fetching products', error);
        }
    },

    async getProductsByCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const page = +req.query.page || 1;
            const limit = +req.query.limit || 10;

            const category = await ProductCategories.findOne({ where: { categoryId } });
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }

            const total = await ProductCategories.count({ where: { categoryId } });
            const { maxPageCount, offset } = calculatePagination(page, limit, total);

            if (page > maxPageCount) {
                return res.status(404).json({ message: 'Page not found' });
            }

            const productsList = await ProductCategories.findAll({
                where: { categoryId },
                limit,
                offset,
                attributes: ['categoryId'],
                include: [
                    {
                        model: Products,
                        include: [
                            {
                                model: Photo,
                                as: 'productImage',
                                attributes: ['path', 'id'],
                            },
                            {
                                model: Stores,
                                as: 'store',
                                attributes: ['name'],
                            },
                        ],
                    },
                ],
                order: [['createdAt', 'DESC']],
            });

            if (productsList.length === 0) {
                return res.status(404).json({ message: 'No products found for this category' });
            }

            return res.status(200).json({
                message: 'Products retrieved successfully',
                products: productsList,
            });
        } catch (error) {
            return handleErrorResponse(res, 500, 'Error fetching products by category', error);
        }
    },

    async getStoreAndProduct(req, res) {
        try {
            const { storeId } = req.params;
            const page = +req.query.page || 1;
            const limit = +req.query.limit || 10;

            const store = await Stores.findOne({ where: { id: storeId } });
            if (!store) {
                return res.status(404).json({ message: 'Store not found' });
            }

            const total = await Products.count({ where: { storeId } });
            const { maxPageCount, offset } = calculatePagination(page, limit, total);

            if (page > maxPageCount) {
                return res.status(404).json({ message: 'Page not found' });
            }

            const productsList = await Products.findAll({
                where: { storeId },
                limit,
                offset,
                include: [
                    {
                        model: Photo,
                        as: 'productImage',
                        attributes: ['id', 'name', 'path'],
                    },
                ],
                order: [['createdAt', 'DESC']],
            });

            return res.status(200).json({
                message: 'Products and store details retrieved successfully',
                store: { name: store.name, location: store.location },
                products: productsList,
            });
        } catch (error) {
            return handleErrorResponse(res, 500, 'Error fetching store and products', error);
        }
    },

    async searchProduct(req, res) {
        try {
            const { query } = req.query;
            const page = +req.query.page || 1;
            const limit = +req.query.limit || 10;

            if (!query) {
                return res.status(400).json({ message: 'Search query is required' });
            }

            const total = await Products.count({
                where: { name: { [Op.like]: `%${query}%` } },
            });

            const { maxPageCount, offset } = calculatePagination(page, limit, total);

            if (page > maxPageCount) {
                return res.status(404).json({ message: 'Page not found' });
            }

            const productsList = await Products.findAll({
                where: { name: { [Op.like]: `%${query}%` } },
                limit,
                offset,
                include: [
                    {
                        model: Photo,
                        as: 'productImage',
                        attributes: ['id', 'name', 'path'],
                    },
                    {
                        model: Stores,
                        as: 'store',
                        attributes: ['name'],
                    },
                ],
                order: [['createdAt', 'DESC']],
            });

            if (productsList.length === 0) {
                return res.status(404).json({ message: 'No products found matching your query' });
            }

            return res.status(200).json({
                message: 'Search results retrieved successfully',
                products: productsList,
            });
        } catch (error) {
            return handleErrorResponse(res, 500, 'Error searching products', error);
        }
    },
};
