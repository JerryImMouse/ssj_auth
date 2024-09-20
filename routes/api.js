const router = require("express").Router();
const database = require("../database/sqlite");
const logger = require("../utilities/logger");
const {discordLinkTemplate, clientId, redirectUri, use_caching, cache_size, use_given_table, checkGuild, guildId,
    deletionAllowed
} = require("../configuration/config");
const dHelper = require("../utilities/discordhelper");
const {validateToken} = require("../utilities/tokenutils");
const CacheManager = require("../utilities/cache_managing");
const {setGivenTo, getGivenBySS14Id, setGivenToZeroAll, setGivenDiscordTo, getGivenByDiscordId, getUserByDiscordId,
    getUserBySS14Id, deleteGivenByDiscordId, deleteGivenBySS14Uid, deleteUserBySS14Uid, deleteUserByDiscordId } = require('../database/sqlite');
const {checkInGuild} = require("../utilities/discordhelper");

const userCache = new CacheManager(cache_size);

router.use(validateToken);

router.get("/check", async (req, res) => {
    if (!req.query.userid)
        return res.status(400).json({ error: "No user id provided" });

    if (use_caching) {
        const user = userCache.get(req.query.userid);
        if (user != null) {
            logger.info(`Found user cache for ${req.query.userid}`);
            const { id, access_token, refresh_token, ...safeUser } = user;
            return res.status(200).json(safeUser);
        }
    }

    try
    {
        const user = await database.getUserBySS14Id(req.query.userid);
        if (!user) {
            return res.status(404).json({ error: "No user found" });
        }
        if (checkGuild && !await checkInGuild(req.query.userid, guildId)) {
            return res.status(405).json({ error: "User is not in our guild"});
        }

        if (use_caching)
            userCache.set(req.query.userid, user);
        const { id, access_token, refresh_token, ...safeUser } = user;
        return res.status(200).json(safeUser);
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
    const base64Userid = Buffer.from(userid).toString('base64');
    const encodedUri = encodeURIComponent(redirectUri);

    const link = `${discordLinkTemplate}?client_id=${clientId}&response_type=code&redirect_uri=${encodedUri}&scope=identify+guilds+guilds.members.read&state=${base64Userid}`;

    return res.status(200).json({ link });
});

router.get('/roles', async (req, res) => {
    if (!req.query.userid)
        return res.status(400).json({ error: "No user ID provided" });

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

router.get('/user', async (req, res) => {
    if (!req.query.method)
        return res.status(400).json({error: "Method is not provided"});

    if (!req.query.id) {
        return res.status(400).json({ error: "No user ID provided" });
    }

    const uid = req.query.id;

    if (use_caching && req.query.method === 'ss14') {
        const user = userCache.get(uid);
        if (user != null) {
            logger.info(`Found user cache for ${uid}`);
            const { id, access_token, refresh_token, ...safeUser } = user;
            return res.status(200).json(safeUser);
        }
    }

    let user;

    switch (req.query.method) {
        case 'discord': {
            user = await getUserByDiscordId(uid);
            break;
        }
        case 'ss14': {
            user = await getUserBySS14Id(uid);
            if (use_caching)
                userCache.set(uid, user);
            break;
        }
        default:
            return res.status(400).json({error: "Invalid method passed"});
    }

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const {id, access_token, refresh_token, ...newUser} = user;

    return res.status(200).json(newUser);
})

router.post('/delete', async (req, res) => {
    if (!deletionAllowed)
        return res.status(405).json({error: "Deletion is not allowed in SSJ configuration"});

    if (!req.query.method)
        return res.status(400).json({error: "Method is not provided"});

    if (!req.query.id)
        return res.status(400).json({error: "Id is not provided"});

    const uid = req.query.id;
    const method = req.query.method;

    switch (method) {
        case "discord": {
            const usersDeletionResult = await deleteUserByDiscordId(uid);
            const givenDeletionResult = await deleteGivenByDiscordId(uid);
            if (!usersDeletionResult || !givenDeletionResult) {
                logger.error(`Unable to delete some of the records by DiscordId(${uid}): Users: ${usersDeletionResult} | Given: ${givenDeletionResult}`);
            }
            break;
        }
        case "ss14": {
            const usersDeletionResult = await deleteUserBySS14Uid(uid);
            const givenDeletionResult = await deleteGivenBySS14Uid(uid);
            if (!usersDeletionResult || !givenDeletionResult) {
                logger.error(`Unable to delete some of the records by SS14Uid(${uid}): Users: ${usersDeletionResult} | Given: ${givenDeletionResult}`);
            }
            break;
        }
    }

    return res.status(200).json({response: "OK"});
})

router.post('/given', async (req, res) => {
    if (!use_given_table)
        return res.status(405).send("Given table is turned off")

    if (!req.query.method) {
        return res.status(400).json({error: "Method is not provided"})
    }

    if (!req.query.id) {
        return res.status(400).json({ error: "No user ID provided" });
    }
    const uid = req.query.id;


    let given = 1;
    if (req.query.given) {
        given = req.query.given;
    }

    switch (req.query.method) {
        case 'discord': {
            await setGivenDiscordTo(uid, given);
            break;
        }
        case 'ss14': {
            await setGivenTo(uid, given);
            break;
        }
        default:
            return res.status(400).json({ error: "Invalid method provided" });
    }

    return res.status(200).send("SUCCESS");
})

router.get('/is_given', async (req, res) => {
    if (!use_given_table)
        return res.status(405).send("Given table is turned off")

    if (!req.query.method) {
        return res.status(400).json({error: "Method is not provided"})
    }

    if (!req.query.id) {
        return res.status(400).json({ error: "No user ID provided" });
    }
    const uid = req.query.id;

    let user;

    switch (req.query.method) {
        case 'discord': {
            user = await getGivenByDiscordId(uid);
            break;
        }
        case 'ss14': {
            user = await getGivenBySS14Id(uid);
            break;
        }
        default: {
            return res.status(400).json({ error: "Invalid method provided" });
        }
    }

    // this one shouldn't happen
    if (!user) {
        logger.error("There was an error retrieving given user. Returned 1 by default");
        res.status(200).send("Doubtful But Okay");
        return;
    }

    const status = user.is_given === 1 ? 200 : 204;
    res.status(status).send("SUCCESS");
})

router.post('/wipe_given', async (req, res) => {
    if (!use_given_table)
        return res.status(405).send("Given table is turned off")

    await setGivenToZeroAll();

    return res.status(200).send("SUCCESS");
})

module.exports = router;
