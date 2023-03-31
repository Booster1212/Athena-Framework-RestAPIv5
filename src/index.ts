import * as APIConfig from './config';

import Database from '@stuyk/ezmongodb';

import express from 'express';
import session from 'express-session';

import passport from 'passport';
import DiscordStrategy from 'passport-discord';

import dotenv from 'dotenv';

dotenv.config();

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
            clientID: process.env.DISCORD_CLIENT_ID as string,
            clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
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

const app = express();

app.use(
    session({
        secret: 'someSecret',
        resave: false,
        saveUninitialized: false,
    }),
);

app.use(passport.initialize());
app.use(passport.session());

async function isAuthenticated(req: any, res: any, next: any) {
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

app.get('/api/protected', isAuthenticated, async (req: any, res: any) => {
    const user = req.user;
    res.send(`Welcome, ${user.username}#${user.discriminator}!`);
});

app.get('/api/protected/accounts', isAuthenticated, async (req: any, res: any) => {
    const accountCollection = await Database.fetchAllData('accounts');
    res.send(accountCollection);
});

app.get('/api/protected/characters', isAuthenticated, async (req: any, res: any) => {
    const characterCollection = await Database.fetchAllData('characters');
    res.send(characterCollection);
});

app.get('/api/protected/items', isAuthenticated, async (req: any, res: any) => {
    const itemCollection = await Database.fetchAllData('items');
    res.send(itemCollection);
});

app.get('/api/protected/vehicles', isAuthenticated, async (req: any, res: any) => {
    const vehicleCollection = await Database.fetchAllData('vehicles');
    res.send(vehicleCollection);
});

app.get('/auth', passport.authenticate('discord'));
app.get(
    '/auth/callback',
    passport.authenticate('discord', {
        successRedirect: '/api/protected',
        failureRedirect: '/',
    }),
);

app.listen(3000, async () => {
    const connectionAthenaDatabase = await Database.init(`mongodb://0.0.0.0:27017`, APIConfig.general.athenaDatabase, [
        APIConfig.general.collection,
    ]);
    
    console.log(`Athena Framework - Rest API Server listening on port 3000`);
    console.log(`Established Athena Database Connection? ${connectionAthenaDatabase}`);
});
