import Notification from '../models/Notification.js';

function sendReviewReplyNotification(userId, reply, seller, product) {
	if (global.io) {
		global.io.to(`user_${userId}`).emit('review_reply', {
			message: 'The seller has replied to your review!',
			reply,
			seller: {
				id: seller.id,
				name: `${seller.firstName} ${seller.lastName}`,
				email: seller.email,
			},
			product,
		});

		Notification.create({
			userId,
			message: reply,
			productId: product.id,
			productName: product.name,
			productImage: product.path,
		})
			.then(() => {
				console.log('Notification successfully created');
			})
			.catch(err => {
				console.error('Error creating notification:', err);
			});
	} else {
		console.error('Socket.io is not initialized');
	}
}

export default sendReviewReplyNotification;
