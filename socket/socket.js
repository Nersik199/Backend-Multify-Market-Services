import { Server } from 'socket.io';

const setupSocketIO = server => {
	const io = new Server(server, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
		},
	});

	global.io = io;

	io.on('connection', socket => {
		console.log('User connected:', socket.id);

		socket.on('register', userId => {
			socket.join(`user_${userId}`);
			console.log(`User ${userId} subscribed to notifications`);
		});

		socket.on('disconnect', () => {
			console.log('User disconnected:', socket.id);
		});
	});
};

export default setupSocketIO;
