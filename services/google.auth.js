import 'dotenv/config';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import Users from '../models/Users.js';

const {
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GOOGLE_AUTH_CALLBACK,
	USER_PASSWORD_SECRET,
} = process.env;

const setupGoogleAuth = () => {
	passport.use(
		new GoogleStrategy(
			{
				clientID: GOOGLE_CLIENT_ID,
				clientSecret: GOOGLE_CLIENT_SECRET,
				callbackURL: GOOGLE_AUTH_CALLBACK,
			},
			async (accessToken, refreshToken, profile, done) => {
				try {
					let user = await Users.findOne({
						where: { email: profile.emails[0].value },
					});

					if (!user) {
						user = await createUser(profile);
					}

					const payload = { id: user.id, email: user.email };
					const token = Users.createToken(payload);

					return done(null, { user, token });
				} catch (error) {
					return done(error);
				}
			}
		)
	);

	passport.serializeUser((user, done) => {
		done(null, user.id);
	});

	passport.deserializeUser(async (id, done) => {
		const user = await Users.findByPk(id);
		done(null, user);
	});
};

const createUser = async profile => {
	return await Users.create({
		firstName: profile.name.givenName,
		lastName: profile.name.familyName,
		email: profile.emails[0].value,
		password: USER_PASSWORD_SECRET,
		dateOfBirth: '01.01.2000',
		status: 'active',
	});
};

const setupAuthRoutes = app => {
	app.get(
		'/auth/google',
		passport.authenticate('google', { scope: ['profile', 'email'] })
	);

	app.get('/auth/google/callback', (req, res, next) => {
		passport.authenticate('google', async (err, { user, token }) => {
			if (err || !user) {
				console.error('Authentication error:', err);
				return res.redirect('/');
			}

			req.logIn(user, err => {
				if (err) {
					console.error('Login error:', err);
					return next(err);
				}

				res.cookie('authorization', token, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					maxAge: 30 * 24 * 60 * 60 * 1000,
				});

				return res.redirect('/profile');
			});
		})(req, res, next);
	});

	app.get('/profile', (req, res) => {
		if (!req.isAuthenticated()) {
			return res.redirect('/');
		}
		res.send(
			`<h1>Hello, ${req.user.firstName} ${req.user.lastName}</h1><a href="/logout">Logout</a>`
		);
	});

	app.get('/logout', async (req, res, next) => {
		try {
			await new Promise((resolve, reject) => {
				req.logout(err => {
					if (err) return reject(err);
					resolve();
				});
			});

			res.clearCookie('authorization');
			res.redirect('/');
		} catch (err) {
			next(err);
		}
	});
};

export { setupGoogleAuth, setupAuthRoutes };
