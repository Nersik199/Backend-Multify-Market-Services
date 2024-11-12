import Cards from "../models/Cards.js";

export default {
    async create(req, res) {
        try {
            const {
                name,
                size,
                price,
                description,
                brandName,
                quantity
            } = req.body;

            const { id } = req.user;
            
            const cards = await Cards.create({
                name,
                size,
                price,
                description,
                brandName,
                quantity,
                userId: id,
            });

            res.status(201).json({
                message: 'Cards created successfully',
                cards
            })

        } catch (e) {
            res.status(500).json({
                message: 'Internal server error',
                error: e.message,
            });
        }
    },

    async getCards(req, res) {
        try {

            const page = +req.query.page;
            const limit = +req.query.limit;

            const total = Cards.count()
            const offset = (page - 1) * limit;
            const maxPageCount = Math.ceil(total / limit);


            if (page > maxPageCount) {
                res.status(404).json({
                    message: 'Cards does not found.',
                    cards: []
                });

                return;
            }

            const cards = await Cards.findAll({
                order: [['id', 'DESC']],
                limit,
                offset
            });

            res.status(200).json({
                message: 'Cards list',
                cards
            })
        } catch (e) {
            res.status(500).json({
                message: 'Internal server error',
                error: e.message,
            })
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    message: 'Id is required'
                });
                return;
            }

            const cards = await Cards.findByPk(id);

            if (!cards) {
                res.status(404).json({
                    message: 'Cards Id not found.',
                })
                return;
            }

            await cards.destroy();

            res.status(200).json({
                message: 'Cards deleted successfully.'
            });

        } catch (e) {
            res.status(500).json({
                message: 'Internal server error',
                error: e.message,
            })
        }
    }
}