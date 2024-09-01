const router = require("express").Router();
const path = require('path');

const logger = require('../utilities/logger.js');
const {insertUser, insertGivenUser, getUserByDiscordId} = require('../database/sqlite.js');
const {use_given} = require('../configuration/config')
const {exchangeCode, getDiscordIdentifyScopeUnsafe} = require("../utilities/discordhelper");

router.get('/callback', async (req, res) => {
    logger.info(`GET /callback. Got callback with code: ${req.query.code}`);

    if (!req.query.state) {
        res.sendFile(path.join(__dirname, '..', 'public', 'html', 'error.html'));
        return;
    }
    const base64Userid = req.query.state;
    const userid = Buffer.from(base64Userid, 'base64').toString('utf8');

    const tokenData = await exchangeCode(req.query.code);
    if (!tokenData) {
        logger.error("Unable to get token");
        res.sendFile(path.join(__dirname, '..', 'public', 'html', 'error.html'));
        return;
    }

    const userObject = await getDiscordIdentifyScopeUnsafe(tokenData['access_token']);
    if (!userObject) {
        logger.error("Unable to get identify scope");
        res.sendFile(path.join(__dirname, '..', 'public', 'html', 'error.html'));
        return;
    }

    const fetched = await getUserByDiscordId(userObject.user.id);
    if (fetched) {
        res.sendFile(path.join(__dirname, '..', 'public', 'html', 'error.html'));
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
        res.sendFile(path.join(__dirname, '..', 'public', 'html', 'success.html'));
        return;
    }

    res.sendFile(path.join(__dirname, '..', 'public', 'html', 'error.html'));
});

module.exports = router;