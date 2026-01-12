import dotenv from 'dotenv';
dotenv.config();

let dbconfig = {};

if (process.env.NODE_ENV === 'production') {
    console.log('Production DB config loaded.');
    dbconfig = {
        PORT: process.env.PORT,
        DB_HOST: process.env.DB_HOST_PROD,
        DB_PORT: process.env.DB_PORT_PROD,
        DB_NAME: process.env.DB_NAME_PROD,
        DB_USER: process.env.DB_USER_PROD,
        DB_PASS: process.env.DB_PASS_PROD,
    };
} else if (process.env.NODE_ENV === 'development') {
    console.log('Development DB config loaded.');
    dbconfig = {
        PORT: process.env.PORT,
        DB_HOST: process.env.DB_HOST_DEV,
        DB_PORT: process.env.DB_PORT_DEV,
        DB_NAME: process.env.DB_NAME_DEV,
        DB_USER: process.env.DB_USER_DEV,
        DB_PASS: process.env.DB_PASS_DEV,
    };
} else if (process.env.NODE_ENV === 'test') {
    console.log('Test DB config loaded.');
    dbconfig = {
        PORT: process.env.PORT,
        DB_HOST: process.env.DB_HOST_TEST,
        DB_PORT: process.env.DB_PORT_TEST,
        DB_NAME: process.env.DB_NAME_TEST,
        DB_USER: process.env.DB_USER_TEST,
        DB_PASS: process.env.DB_PASS_TEST,
    };
} else {
    console.log('No NODE_ENV set or unknown; falling back to development-like DB config.');
    dbconfig = {
        PORT: process.env.PORT,
        DB_HOST: process.env.DB_HOST_DEV || process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT_DEV || process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME_DEV || process.env.DB_NAME,
        DB_USER: process.env.DB_USER_DEV || process.env.DB_USER,
        DB_PASS: process.env.DB_PASS_DEV || process.env.DB_PASS,
    };
}

export default dbconfig;