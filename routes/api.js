const router = require("express").Router();
const database = require("../database/sqlite");
const logger = require("../utilities/logger");
const {discordLinkTemplate, clientId, redirectUri} = require("../configuration/config");
const dHelper = require("../utilities/discordhelper");
const {checkAccess} = require("../utilities/tokenutils");
const path = require("path");
const {setGivenTo, getGivenBySS14Id, setGivenToZeroAll} = require("../database/sqlite");

router.get("/check", async (req, res) => {
    if (!req.query.api_token)
        return res.status(401).sendFile(path.join(__dirname, '..', 'public', 'html', 'unauthorized.html'));

    if (!checkAccess(req.query.api_token))
        return res.status(401).sendFile(path.join(__dirname, '..', 'public', 'html', 'unauthorized.html'));

    if (!req.query.userid) {
        return res.status(400).json({ error: "No user id provided" });
    }

    try
    {
        const user = await database.getUserBySS14Id(req.query.userid);
        if (!user) {
            return res.status(404).json({ error: "No user found" });
        }

        return res.status(200).json(user);
    }
    catch (error)
    {
        logger.error(`Unexpected error: ${error.message}`);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// generate auth link
router.get('/link', async (req, res) => {
    if (!req.query.api_token)
        return res.status(401).sendFile(path.join(__dirname, '..', 'public', 'html', 'unauthorized.html'));

    if (!checkAccess(req.query.api_token))
        return res.status(401).sendFile(path.join(__dirname, '..', 'public', 'html', 'unauthorized.html'));

    if (!req.query.userid) {
        return res.status(400).json({ error: "No user ID provided" });
    }

    const userid = req.query.userid;
    const base64Userid = Buffer.from(userid).toString('base64');
    const encodedUri = encodeURIComponent(redirectUri);

    const link = `${discordLinkTemplate}?client_id=${clientId}&response_type=code&redirect_uri=${encodedUri}&scope=identify+guilds+guilds.members.read&state=${base64Userid}`;

    return res.status(200).json({ link });
});

router.get('/roles', async (req, res) => {
    if (!req.query.api_token)
        return res.status(401).sendFile(path.join(__dirname, '..', 'public', 'html', 'unauthorized.html'));

    if (!checkAccess(req.query.api_token))
        return res.status(401).sendFile(path.join(__dirname, '..', 'public', 'html', 'unauthorized.html'));

    if (!req.query.userid) {
        return res.status(400).json({ error: "No user ID provided" });
    }

    if (!req.query.guildid) {
        return res.status(400).json({error: 'No guild ID provided'});
    }

    const userid = req.query.userid;
    const guildid = req.query.guildid;
    logger.info(`GET /roles for user ${userid} roles`);

    try {
        const rolesJson = await dHelper.getGuildMemberRoles(userid, guildid);

        if (rolesJson && Array.isArray(rolesJson.roles)) {
            logger.info(`Successfully retrieved roles: ${rolesJson.roles}`);
            return res.status(200).json({ roles: rolesJson.roles });
        } else {
            logger.error('Roles property not found or not an array');
            return res.status(500).json({ error: 'Failed to retrieve roles' });
        }
    } catch (error) {
        logger.error(`Error retrieving roles: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.post('/given', async (req, res) => {
    if (!req.query.api_token)
        return res.status(401).sendFile(path.join(__dirname, '..', 'public', 'html', 'unauthorized.html'));

    if (!checkAccess(req.query.api_token))
        return res.status(401).sendFile(path.join(__dirname, '..', 'public', 'html', 'unauthorized.html'));

    if (!req.query.userid) {
        return res.status(400).json({ error: "No user ID provided" });
    }
    let given = 1;
    if (req.query.given) {
        given = req.query.given;
    }

    const user_id = req.query.userid;

    await setGivenTo(user_id, given);

    return res.status(200).send("SUCCESS");
})

router.get('/is_given', async (req, res) => {
    if (!req.query.api_token)
        return res.status(401).sendFile(path.join(__dirname, '..', 'public', 'html', 'unauthorized.html'));

    if (!checkAccess(req.query.api_token))
        return res.status(401).sendFile(path.join(__dirname, '..', 'public', 'html', 'unauthorized.html'));

    if (!req.query.userid) {
        return res.status(400).json({ error: "No user ID provided" });
    }

    const user_id = req.query.userid;

    const user = await getGivenBySS14Id(user_id);

    var status = user.is_given === 1 ? 200 : 204;
    res.status(status).send("SUCCESS");
})

router.post('/wipe_given', async (req, res) => {
    if (!req.query.api_token)
        return res.status(401).sendFile(path.join(__dirname, '..', 'public', 'html', 'unauthorized.html'));

    if (!checkAccess(req.query.api_token))
        return res.status(401).sendFile(path.join(__dirname, '..', 'public', 'html', 'unauthorized.html'));

    await setGivenToZeroAll();

    return res.status(200).send("SUCCESS");
})

module.exports = router;