/**
 * 
 * Authenticates using the OAuth2 flow and 
 * stores the access and refresh token in
 * token.json file.
 * 
 * It needs a client_secret.json file which
 * is obtained by following:
 * https://developers.google.com/youtube/v3/quickstart/nodejs#step_1_turn_on_the
 * 
 * NOTE:
 * While setting OAuth Consent Screen:
 * 1. Add these 2 Scopes: 
 * https://www.googleapis.com/auth/youtube.readonly
 * https://www.googleapis.com/auth/youtube
 * 
 * 2. Add the email for the youtube account in Test Users.
 * 
 * 
 * While creating OAuth Client ID:
 * 1. Application type = Web Application
 * 2. Authorized redirect URIs = http://localhost:8080
 * 
 * 
 * Run this script -> Authorize the App through OAuth
 * -> Redirect to localhost:8080/?code=....&...
 * -> Copy the code attribute value to the terminal
 * -> token.json gets created
 * 
 * Move to youtube.js
 * 
 */

import fs from 'fs'
import readline from 'readline';
import {google} from 'googleapis';
let OAuth2 = google.auth.OAuth2;

const TOKEN_PATH='./token.json';

var SCOPES = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube'
];

fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }

    authorize(JSON.parse(content));
});

function authorize(credentials) {
    var clientSecret = credentials.web.client_secret;
    var clientId = credentials.web.client_id;
    var redirectUrl = credentials.web.redirect_uris[0];
    var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
  
    getNewToken(oauth2Client);
}

function getNewToken(oauth2Client) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        const decodedCode = decodeURIComponent(code);
        oauth2Client.getToken(decodedCode, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
        });
    });
}
  
function storeToken(token) {
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) throw err;
        console.log('Token stored to ' + TOKEN_PATH);
    });
}  