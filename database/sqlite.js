const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utilities/logger.js');

const dbPath = path.resolve(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Could not connect to database', err);
    } else {
        logger.info('Connected to sqlite database');
    }
});

const dbInit = () => {
    createUsersTable();
};

const createUsersTable = () => {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS "users" (
            "id" INTEGER NOT NULL UNIQUE,
            "discord_name" TEXT NOT NULL,
            "discord_id" TEXT NOT NULL UNIQUE,
            "ss14_userid" TEXT NOT NULL,
            "refresh_token" TEXT NOT NULL UNIQUE,
            "access_token" TEXT NOT NULL UNIQUE,
            "last_refreshed_time" TEXT NOT NULL,
            PRIMARY KEY("id" AUTOINCREMENT)
        );
    `;

    db.run(createTableSQL, (err) => {
        if (err) {
            logger.error(`Error creating users table: ${err.message}`);
            return;
        }

        logger.info('Users table created successfully.')
    });
};

const insertUser = async (discord_name, discord_id, ss14_userid, refresh_token, access_token, last_refreshed_time) => {
    const insertSQL = `
        INSERT INTO users (discord_name, discord_id, ss14_userid, refresh_token, access_token, last_refreshed_time)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    return new Promise((resolve, reject) => {
        db.run(insertSQL, [discord_name, discord_id, ss14_userid, refresh_token, access_token, last_refreshed_time], (err) => {
            if (err) {
                logger.error(`Error caught while inserting user into the table: ${err.message}`);
                resolve(false);
            }

            logger.info('New user inserted successfully.');
            resolve(true);
        });
    });
};

const getUserById = async (id) => {
    const selectSQL = `SELECT * FROM users WHERE id = ?`;
    return new Promise((resolve, reject) => {
        db.get(selectSQL, [id], (err, row) => {
            if (err) {
                logger.error(`Error caught while selecting user from the table: ${err.message}`);
                reject(err);
            } else {
                logger.info('Successfully retrieved user from database');
                resolve(row);
            }
        });
    });
};

const getUserByDiscordId = async (discordId) => {
    const selectSQL = `SELECT * FROM users WHERE discord_id = ?`;
    return new Promise((resolve, reject) => {
        db.get(selectSQL, [discordId], (err, row) => {
            if (err) {
                logger.error(`Error caught while selecting user from the table: ${err.message}`);
                reject(err);
            } else {
                logger.info('Successfully retrieved user from database');
                resolve(row);
            }
        });
    });
}

const getUserBySS14Id = async (ss14_userid) => {
    const selectSQL = `SELECT * FROM users WHERE ss14_userid = ?`;
    return new Promise((resolve, reject) => {
        db.get(selectSQL, [ss14_userid], (err, row) => {
            if (err) {
                logger.error(`Error caught while selecting user from the table: ${err.message}`);
                reject(err);
            } else {
                logger.info('Successfully retrieved user from database');
                resolve(row);
            }
        });
    });
}

const updateUserById = async (id, discord_name, discord_id, ss14_userid, refresh_token, access_token, last_refreshed_time) => {
    const updateSQL = `
        UPDATE users
        SET discord_name = ?, discord_id = ?, ss14_userid = ?, refresh_token = ?, access_token = ?, last_refreshed_time = ?
        WHERE id = ?
    `;
    await db.run(updateSQL, [discord_name, discord_id, ss14_userid, refresh_token, access_token, last_refreshed_time, id], (err) => {
        if (err) {
            logger.error(`Error caught while updating user in the table: ${err.message}`);
            return;
        }
        logger.info('Successfully updated user in database');
    })
};

const updateUserByDiscordId = async (id, discord_name, discord_id, ss14_userid, refresh_token, access_token, last_refreshed_time) => {
    const updateSQL = `
        UPDATE users
        SET discord_name = ?, ss14_userid = ?, refresh_token = ?, access_token = ?, last_refreshed_time = ?
        WHERE discord_id = ?
    `;
    await db.run(updateSQL, [discord_name, ss14_userid, refresh_token, access_token, last_refreshed_time, discord_id], (err) => {
        if (err) {
            logger.error(`Error caught while updating user in the table: ${err.message}`);
            return;
        }
        logger.info('Successfully updated user in database');
    })
};

const deleteUser = async (id) => {
    const deleteSQL = `DELETE FROM users WHERE id = ?`;
    await db.run(deleteSQL, [id], (err) => {
        if (err) {
            logger.error(`Caught error while deleting user from database: ${err.message}`);
            return;
        }

        logger.info("Successfully deleted user from database");
    });
};

module.exports = {
    dbInit,
    insertUser,
    deleteUser,
    updateUserById,
    updateUserByDiscordId,
    getUserById,
    getUserByDiscordId,
    getUserBySS14Id
}