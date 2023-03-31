import Database from '@stuyk/ezmongodb';
import { isAuthenticated } from '..';
import express, { Request, Response } from 'express';
import passport from 'passport';
import { Account } from '@AthenaServer/interface/iAccount';
import { Character } from '@AthenaShared/interfaces/character';
import { BaseItem } from '@AthenaShared/interfaces/item';
import { OwnedVehicle } from '@AthenaShared/interfaces/vehicleOwned';

const router = express.Router();

router.get('/api/protected/accounts', isAuthenticated, async (req: Request, res: Response) => {
    return res.send(await Database.fetchAllData<Account>('accounts'));
});

router.get('/api/protected/characters', isAuthenticated, async (req: Request, res: Response) => {
    return res.send(await Database.fetchAllData<Character>('characters'));
});

router.get('/api/protected/items', isAuthenticated, async (req: Request, res: Response) => {
    return res.send(await Database.fetchAllData<BaseItem>('items'));
});

router.get('/api/protected/vehicles', isAuthenticated, async (req: Request, res: Response) => {
    return res.send(await Database.fetchAllData<OwnedVehicle>('vehicles'));
});

router.get('/api/welcome', async (req: any, res: Response) => {
    const user = req.user;
    res.send(
        `You have authenticated yourself successfully! Check the Database 'api-users' to retrieve your axios accessToken.`,
    );
});

router.get('/auth', passport.authenticate('discord'));

router.get(
    '/auth/callback',
    passport.authenticate('discord', {
        successRedirect: '/api/welcome',
        failureRedirect: '/',
    }),
);

export default router;
