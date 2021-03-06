'use strict';

let config = require('config');
let express = require('express');
let favicon = require('serve-favicon');
let app = express();
let bodyParser = require('body-parser');
let compiledTemplates = require('./compiledTemplates');
let handlebars = require('handlebars');
var _ = require('lodash');
let http = require('http');
let https = require('https');
let fs = require('fs');

// compile handlebars templates
Object.keys(config.issuers).forEach(function(issuer) {
  let emailTemplate = _.get(config.issuers[issuer], 'email.template');
  if (emailTemplate)
    fs.readFile(emailTemplate, 'utf-8', function(err, data) {
      if (err) {
        throw err;
        process.exit(1);
      }
      compiledTemplates[issuer] = compiledTemplates[issuer] || {};
      compiledTemplates[issuer].email = handlebars.compile(data);
    });
});

app.use(express.static('public'));
app.use(favicon(__dirname + '/../public/favicon.ico'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/invitation/send', require('./sendInvitation'));
app.get('/invitation/redirect', require('./redirect'));
app.get('/invitation/accept', require('./acceptInvitation'));

if (config.sslPort)
  https.createServer({
    key: fs.readFileSync(config.sslKey),
    cert: fs.readFileSync(config.sslCert)
  }, app).listen(config.sslPort);
else
  http.createServer(app).listen(config.port);
