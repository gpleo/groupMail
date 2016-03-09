var sugar = require('sugar');
var fs = require('fs');
var async = require('async');
var csv = require('fast-csv');
var Log = require('log');
var ejs = require('ejs');
var nodemailer = require('nodemailer');
var sleep = require('sleep');
var config = require(__dirname + '/data/config.js').config;

var logFile = __dirname + '/logs/' + 'log.txt';
// var logFile = __dirname + '/logs/' + Date.create().format('{yyyy}-{MM}-{dd}_{hh}:{mm}:{ss}') + '.log.txt';
var log = new Log('debug', fs.createWriteStream(logFile, {
  flag: 'a',
  encoding: 'utf-8'
}));

var stream = fs.createReadStream(__dirname + '/data/email.csv');

var htmlTemplate = fs.readFileSync(__dirname + '/data/template.html', 'utf8');
var textTemplate = fs.readFileSync(__dirname + '/data/template.text', 'utf8');

var transport = nodemailer.createTransport(config);

var attachments = [];
var attachmentPath = __dirname + '/data/attachments';
var attachmentFiles = fs.readdirSync(attachmentPath);

var i,
  len;

console.log('Attachments:');
for(i=0, len=attachmentFiles.length; i<len; i++){
  var attachment = attachmentPath + '/' + attachmentFiles[i];
  console.log(attachment);
  attachments.push({path: attachment});
}
console.log('-----------------------------------------------');

var count = 0;
var successEmails = 0;
var failureEmails = 0;
var errorRecords = 0;

var user_data = [];

function sendEmail() {
  async.eachSeries(user_data, function(user, cb) {
    console.log('The email send for ' + JSON.stringify(user));

    var html = ejs.render(htmlTemplate, {nickname: user.nickname});
    var text = ejs.render(textTemplate, {nickname: user.nickname});

    var mailOptions = {
      from: config.senderName + '<' + config.auth.user + '>',
      to: user.nickname + '<' + user.email + '>',
      subject: config.subject,
      html: html,
      text: text,
      attachments: attachments,
      headers: {
        'Disposition-Notification-To': config.auth.user
      }
    };
    transport.sendMail(mailOptions, function(err, info){
      if(err){
        log.error(user.nickname + '<' + user.email + '> send failure: ', err);
        failureEmails++;
      }else{
        log.info(user.nickname + '<' + user.email + '> send success!');
        successEmails++;
        if(successEmails % 100 === 0){
          console.log('Sending ' + successEmails + ' emails successful.');
        }
      }
      sleep.usleep(config.sleep*1000000);
      cb();
    });
  }, function() {
    console.log('============== Done ===============');
    console.log(successEmails + ' email(s) send success!');
    console.log(failureEmails + ' email(s) send failure!');
    console.log(errorRecords + ' record(s) data error!');
    console.log('Please check the log file for detail: ' + logFile);
  });
}

var csvStream = csv()
  .on("data", function(data){
    if (data && data.length === 2) {
      user_data.push({
        nickname: data[0],
        email: data[1]
      });
    } else {
      log.error('Error data: ', data);
      errorRecords++;
    }
  })
  .on("end", function(data){
    sendEmail();
  });
stream.pipe(csvStream);
