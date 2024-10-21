const router = require("express").Router();
const path = require('path');

const logger = require('../utilities/logger.js');
const {insertUser, insertGivenUser, getUserByDiscordId} = require('../database/sqlite.js');
const {use_given_table} = require('../configuration/config')
const {exchangeCode, getDiscordIdentifyScopeUnsafe} = require("../utilities/discordhelper");
const {getUserBySS14Id} = require("../database/sqlite");

router.get('/callback', async (req, res) => {
    logger.info(`GET /callback. Got callback with code: ${req.query.code}`);

    if (!req.query.state) {
        res.status(400).render('error', {title: "Client Error", errorText: "400 - Bad Request", errorDesc: "There was no state passed."});
        return;
    }
    const base64Userid = req.query.state;
    const userid = Buffer.from(base64Userid, 'base64').toString('utf8');

    const tokenData = await exchangeCode(req.query.code);
    if (!tokenData) {
        logger.error("Unable to get token");
        res.status(500).render('error', {title: "Server Error", errorText: "500 - Internal Server Error", errorDesc: "Unable to exchange code with discord."});
        return;
    }

    const userObject = await getDiscordIdentifyScopeUnsafe(tokenData['access_token']);
    if (!userObject) {
        logger.error("Unable to get identify scope");
        res.status(500).render('error', {title: "Server Error", errorText: "500 - Internal Server Error", errorDesc: "Unable to get identify scope from discord."});
        return;
    }

    try {
        const discordGot = await getUserByDiscordId(userObject.user.id);
        if (discordGot) {
            res.status(409).render('error', {title: "Client Error", errorText: "409 - Conflict", errorDesc: "You are already authorized, possibly with a different Discord account."});
            logger.warn(`Declining already existed auth entry from ${userObject.user.id} | ${userid}`);
            return;
        }

        const ss14Got = await getUserBySS14Id(userid);
        if (ss14Got) {
            res.status(409).render('error', {title: "Client Error", errorText: "409 - Conflict", errorDesc: "You are already authorized, possibly with a different SS14 Account.\n" +
                    "I dunno how this shit can possibly happen, this shit is shit and should be fixed by developer below."});
            logger.warn(`Declining already existed auth entry from ${userObject.user.id} | ${userid}`);
            return;
        }
    } catch (error) {
        logger.error(`Error fetching user by ID: ${error.message}`);
        res.status(500).render('error', {title: "Server Error", errorText: "500 - Internal Server Error", errorDesc: "Unable to check uniqueness."});
        return;
    }

    logger.info(`Successfully exchanged user object: ${JSON.stringify(userObject)}`);

    let result, result1;

    result = await insertUser(
        userObject.user.username, // discord_username
        userObject.user.id, // discord_id
        userid, // user_id
        tokenData['refresh_token'], // refresh_token
        tokenData['access_token'], // access_token
        new Date().toISOString()); // current date time
    logger.info(`Added new user with userid - ${userid}`);

    if (use_given_table) {
        result1 = await insertGivenUser(userObject.user.id, userid, 0);
    }

    if (result && (!use_given_table || result1)) {
        res.status(200).sendFile(path.join(__dirname, '..', 'public', 'html', 'success.html'));
        return;
    }

    res.status(500).render('error', {title: "Server Error", errorText: "500 - Internal Server Error", errorDesc: "Reached probably unreachable code. Address the issue to developer"});
});

module.exports = router;