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

const dbInit = (use_given = false) => {
    createUsersTable();
    if (use_given)
        createGivenTable();
    createIndexes();
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

const createGivenTable = () => {
    const createGivenSQL = `
        CREATE TABLE IF NOT EXISTS "given" (
            "id" INTEGER NOT NULL UNIQUE,
            "discord_id" TEXT NOT NULL UNIQUE,
            "ss14_user_id" TEXT NOT NULL UNIQUE CHECK(is_given IN (0, 1)),
            "is_given" INTEGER NOT NULL CHECK(is_given IN (0, 1)),
            PRIMARY KEY("id" AUTOINCREMENT)
        );
    `;

    db.run(createGivenSQL, (err) => {
        if (err) {
            logger.error(`Error creating given table ${err.message}`);
            return;
        }
        logger.info('Given table created successfully');
    })
};

const createIndexes = () => {
    const createSS14UserIdIndexSQL = `
  CREATE UNIQUE INDEX IF NOT EXISTS "IX_users_ss14_userid" 
  ON "users" ("ss14_userid");
`;

    db.run(createSS14UserIdIndexSQL, (err) => {
        if (err) {
            logger.error(`Error creating index on table: ${err.message}`);
            return;
        }
        logger.info(`Indexes created successfully`);
    })
}

const insertUser = async (discord_name, discord_id, ss14_userid, refresh_token, access_token, last_refreshed_time) => {
    const insertSQL = `
        INSERT INTO users (discord_name, discord_id, ss14_userid, refresh_token, access_token, last_refreshed_time)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    return new Promise((resolve, reject) => {
        db.run(insertSQL, [discord_name, discord_id, ss14_userid, refresh_token, access_token, last_refreshed_time], (err) => {
            if (err) {
                logger.error(`Error caught while inserting user into the table: ${err.message}`);
                reject(err);
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

const getAllUsers = async () => {
    const selectSQL = `SELECT * FROM users`;
    return new Promise((resolve, reject) => {
        db.all(selectSQL, (err, rows) => {
            if (err) {
                logger.error(`Error caught while selecting all users from the table: ${err.message}`);
                reject(err);
                return;
            }
            logger.info("Successfully retrieved users from database");
            resolve(rows);
        })
    })
}

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

const getAllGiven = async () => {
    const selectSQL = `SELECT * FROM given`;
    return new Promise((resolve, reject) => {
        db.all(selectSQL, (err, rows) => {
            if (err) {
                logger.error(`Error caught while selecting all givens from the table: ${err.message}`);
                reject(err);
                return;
            }
            logger.info("Successfully retrieved givens from database");
            resolve(rows);
        })
    })
}

const getGivenBySS14Id = async (ss14_id) => {
    const selectSQL = `SELECT * FROM given WHERE ss14_user_id = ?`
    return new Promise((resolve, reject) => {
        db.get(selectSQL, [ss14_id], (err, row) => {
            if (err) {
                logger.error(`Error caught while selecting given from the table: ${err.message}`);
                reject(err);
                return;
            }
            logger.info("Successfully retrieved given from database");
            resolve(row);
        })
    })
}

const getGivenByDiscordId = async (discord_id) => {
    const selectSQL = `SELECT * FROM given WHERE discord_id = ?`
    return new Promise((resolve, reject) => {
        db.get(selectSQL, [discord_id], (err, row) => {
            if (err) {
                logger.error(`Error caught while selecting given from the table: ${err.message}`);
                reject(err);
                return;
            }
            logger.info("Successfully retrieved given from database");
            resolve(row);
        })
    })
}

const insertGivenUser = async (discord_id, ss14_uid, given = 0) => {
    const insertSQL = `
        INSERT INTO given (discord_id, ss14_user_id, is_given)
        VALUES (?, ?, ?)
    `;
    return new Promise((resolve, reject) => {
        db.run(insertSQL, [discord_id, ss14_uid, given], (err) => {
            if (err) {
                logger.error(`Error caught while inserting given into the table: ${err.message}`);
                reject(err);
            }

            logger.info('New given inserted successfully.');
            resolve(true);
        });
    });
}

const updateGivenUser = async (discord_id, given, ss14_user_id) => {
    const updateSQL = `
        UPDATE given
        SET discord_id = ?, is_given = ?
        WHERE ss14_user_id = ?
    `;

    return new Promise((resolve, reject) => {
        db.run(updateSQL, [discord_id, given, ss14_user_id], (err) => {
            if (err) {
                logger.error(`Error updating given: ${err.message}`);
                reject(false);
                return;
            }
            logger.info('Successfully updated given in database');
            resolve(true);
        })
    })
}

const setGivenToZeroAll = async () => {
    const updateSQL = `UPDATE given SET is_given = 0`;
    return new Promise((resolve, reject) => {
        db.run(updateSQL, (err) => {
            if (err) {
                logger.error(`Error updating given: ${err.message}`);
                reject(false);
                return;
            }
            logger.info('Successfully updated given in database');
            resolve(true);
        });
    })
}
const setGivenTo = async (ss14_uid, is_given) => {
    const updateSQL = `UPDATE given SET is_given = ? WHERE ss14_user_id = ?`;
    return new Promise((resolve, reject) => {
        db.run(updateSQL, [is_given, ss14_uid], (err) => {
            if (err) {
                logger.error(`Error updating given: ${err.message}`);
                reject(false);
                return;
            }
            logger.info('Successfully updated given in database');
            resolve(true);
        });
    })
}

const setGivenDiscordTo = async (discord_id, is_given) => {
    const updateSQL = `UPDATE given SET is_given = ? WHERE discord_id = ?`;
    return new Promise((resolve, reject) => {
        db.run(updateSQL, [is_given, discord_id], (err) => {
            if (err) {
                logger.error(`Error updating given: ${err.message}`);
                reject(false);
                return;
            }
            logger.info('Successfully updated given in database');
            resolve(true);
        });
    })
}

module.exports = {
    dbInit,
    insertUser,
    deleteUser,
    updateUserById,
    updateUserByDiscordId,
    getUserById,
    getUserByDiscordId,
    getUserBySS14Id,
    getAllUsers,

    updateGivenUser,
    getGivenBySS14Id,
    getGivenByDiscordId,
    getAllGiven,
    insertGivenUser,
    setGivenToZeroAll,
    setGivenTo,
    setGivenDiscordTo
}