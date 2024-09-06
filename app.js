const config = require('./configuration/config.js');
const morgan = require('morgan')
const logger = require('./utilities/logger.js');
const bodyParser = require('body-parser');
const sqliteDb = require('./database/sqlite.js')
const path = require('path');
const compression = require("compression");
const helmet = require("helmet");

const apiRouter = require('./routes/api.js');
const authRouter = require('./routes/auth.js');

const express = require('express');

const app = express();

app.set("trust proxy", 1);

app.set('view engine', 'pug')

app.use(compression()); // Compress all routes
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "code.jquery.com", "cdn.jsdelivr.net"],
                styleSrc: ["'self'", "cdn.jsdelivr.net", "fonts.googleapis.com"],
                imgSrc: ["'self'", "data:"],
                fontSrc: ["'self'", "cdn.jsdelivr.net", "fonts.gstatic.com"],
            },
        },
    })
);

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(morgan('combined'))
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/', apiRouter)
app.use('/auth/', authRouter);

app.listen(config.port, config.host, () => {
    if (process.env.NODE_ENV === 'production') {
        logger.info('Running in production mode');
    } else {
        logger.info('Running in development mode');
    }
    logger.info(`App listening on ${config.host}:${config.port}`);
    sqliteDb.dbInit(config.use_given_table);
});