const express = require("express");
const msal = require('@azure/msal-node');
const admin = require("firebase-admin");
const fs = require('fs');
const https = require('https');
require('dotenv').config();

const SERVER_PORT = process.env.PORT || 3000;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:3000/redirect";
const CLIENT_ID = process.env.CLIENT_ID;
const TENANT_ID = process.env.TENANT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const FIREBASE_SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH;
const SSL_CRT_PATH = process.env.SSL_CRT_PATH;

var privateKey  = fs.readFileSync(SSL_KEY_PATH, 'utf8');
var certificate = fs.readFileSync(SSL_CRT_PATH, 'utf8');
var credentials = { key: privateKey, cert: certificate };
const app = express();
app.set ( "view engine", "ejs" );

const config = {
    "auth": {
        "clientId": CLIENT_ID,
        "authority": "https://login.microsoftonline.com/" + TENANT_ID,
        "clientSecret": CLIENT_SECRET
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};
const cca = new msal.ConfidentialClientApplication(config);

const serviceAccount = require(FIREBASE_SERVICE_ACCOUNT_PATH);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: FIREBASE_DATABASE_URL,
});

app.get('/', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: REDIRECT_URI,
    };
    cca.getAuthCodeUrl(authCodeUrlParameters)
        .then((ccaRes) => {
            res.redirect(ccaRes);
        }).catch((error) => {
            console.error(error);
            res.status(500).send(error);
        });
});

app.get('/redirect', (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: REDIRECT_URI,
    };
    cca.acquireTokenByCode(tokenRequest)
        .then((ccaRes) => {
            admin.auth().createCustomToken(ccaRes.account.localAccountId)
                .then(function (token) {
                    res.render("vuplex", { token: token });
                    //res.status(200).send({ token: token });
                }).catch((error) => {
                    console.error(error);
                    res.status(500).send(error);
                });
        }).catch((error) => {
            console.error(error);
            res.status(500).send(error);
        });
});

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(SERVER_PORT, () => console.log(`Azure AD Deamon is listening on port ${SERVER_PORT}`));