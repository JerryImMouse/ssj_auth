const router = require("express").Router();
const database = require("../database/sqlite");
const logger = require("../utilities/logger");
const {discordLinkTemplate, clientId} = require("../configuration/config");
const dHelper = require("../utilities/discordhelper");

router.get("/check", async (req, res) => {
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
    if (!req.query.userid) {
        return res.status(400).json({ error: "No user ID provided" });
    }

    const userid = req.query.userid;
    const link = `${discordLinkTemplate}?client_id=${clientId}&response_type=code&redirect_uri=http%3A%2F%2F127.0.0.1%3A2424%2Fauth%2Fcallback&scope=identify+guilds+guilds.members.read&state=${userid}`;

    return res.status(200).json({ link });
});

router.get('/roles', async (req, res) => {
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

module.exports = router;