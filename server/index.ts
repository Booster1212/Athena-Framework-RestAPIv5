import * as APIConfig from './config';

import Database from '@stuyk/ezmongodb';

import express from 'express';
import session from 'express-session';

import passport from 'passport';
import DiscordStrategy from 'passport-discord';

import { Request, Response, NextFunction } from 'express';

import routes from './config/routes';
import './axiosExample';

const app = express();
interface User {
    accessToken: string;
    refreshToken: string;
    profile: {
        username: string;
        discriminator: string;
    };
}

passport.use(
    new DiscordStrategy(
        {
            clientID: APIConfig.general.DISCORD_CLIENT_ID,
            clientSecret: APIConfig.general.DISCORD_CLIENT_SECRET,
            callbackURL: APIConfig.general.callbackURL,
            scope: ['identify', 'email'],
        },
        async (accessToken: any, refreshToken: any, profile: any, cb: any) => {
            const userData = {
                accessToken: accessToken,
                refreshToken: refreshToken,
                profile: profile,
            };

            const existingUser = await Database.fetchData('profile.id', profile.id, APIConfig.general.collection);
            if (!existingUser) {
                await Database.insertData(userData, APIConfig.general.collection, false);
            }

            return cb(null, userData);
        },
    ),
);

passport.serializeUser((user: any, done: any) => {
    done(null, user);
});

passport.deserializeUser(async (user: any, done: any) => {
    const userData = await Database.fetchData('accessToken', user.accessToken, APIConfig.general.collection);
    if (!userData) {
        console.log(`Could not fetch userdata.`);
        return done(null, false);
    }

    return done(null, userData);
});

app.use(
    session({
        secret: 'someSecret',
        resave: false,
        saveUninitialized: false,
    }),
);
app.use('/', routes);

app.use(passport.initialize());
app.use(passport.session());

export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    const userData = await Database.fetchData<User>('accessToken', token, APIConfig.general.collection);
    if (userData) {
        req.user = userData.profile;
        return next();
    } else {
        return res.status(401).send('Unauthorized');
    }
}

app.listen(9970, async () => {
    console.log(`Athena Framework - Rest API Server listening on port 9970`);
    console.log(`Registered Routes:`);
    app._router.stack.forEach((middleware: any) => {
        if (middleware.route) {
            console.log(`${Object.keys(middleware.route.methods)} - ${middleware.route.path}`);
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                console.log(`${Object.keys(handler.route.methods)} - ${handler.route.path}`);
            });
        }
    });
});
