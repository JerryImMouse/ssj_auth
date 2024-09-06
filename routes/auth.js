const router = require("express").Router();
const path = require('path');

const logger = require('../utilities/logger.js');
const {insertUser, insertGivenUser, getUserByDiscordId} = require('../database/sqlite.js');
const {use_given} = require('../configuration/config')
const {exchangeCode, getDiscordIdentifyScopeUnsafe} = require("../utilities/discordhelper");

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

    const fetched = await getUserByDiscordId(userObject.user.id);
    if (fetched) {
        res.status(409).render('error', {title: "Server Error", errorText: "409 - Conflict", errorDesc: "You are already authorized, possibly with a different Discord account."});
        logger.info(`Declining already existed auth entry from ${userObject.user.id} | ${userid}`);
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

    if (use_given) {
        result1 = await insertGivenUser(userObject.user.id, userid, 0);
    }

    if (result && (!use_given || result1)) {
        res.status(200).sendFile(path.join(__dirname, '..', 'public', 'html', 'success.html'));
        return;
    }

    res.status(500).render('error', {title: "Server Error", errorText: "500 - Internal Server Error", errorDesc: "Reached probably unreachable code. Address the issue to developer"});
});

module.exports = router;