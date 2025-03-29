import Notification from '../models/Notification.js';

export default {
	async markNotificationAsRead(req, res) {
		try {
			const { notificationId } = req.params;

			if (!notificationId) {
				return res.status(400).json({ message: 'Notification ID is required' });
			}

			const notification = await Notification.findByPk(notificationId);

			if (!notification) {
				return res.status(404).json({ message: 'Notification not found' });
			}

			notification.isRead = true;
			await notification.save();

			res.status(200).json({ message: 'Notification marked as read' });
		} catch (error) {
			res
				.status(500)
				.json({ message: 'Internal server error', error: error.message });
		}
	},
	async getUnreadNotifications(req, res) {
		try {
			const userId = req.user.id;

			const notifications = await Notification.findAll({
				where: { userId, isRead: false },
				order: [['createdAt', 'DESC']],
			});

			res.status(200).json({ notifications });
		} catch (error) {
			res
				.status(500)
				.json({ message: 'Internal server error', error: error.message });
		}
	},
};
