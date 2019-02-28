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

var htmlTemplate = [];
var textTemplate = [];
for (var i = 0, len = config.template.length; i < len; i++) {
  htmlTemplate.push(fs.readFileSync(__dirname + '/data/' + config.template[i] + '.html', 'utf8'));
  textTemplate.push(fs.readFileSync(__dirname + '/data/' + config.template[i] + '.text', 'utf8'));
}

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

var templateCount = {};
var subjectCount = {};

var user_data = [];

function sendEmail() {
  async.eachSeries(user_data, function(user, cb) {
    var templateIndex = Math.floor(Math.random()*htmlTemplate.length);
    var html = ejs.render(htmlTemplate[templateIndex], {nickname: user.nickname});
    var text = ejs.render(textTemplate[templateIndex], {nickname: user.nickname});

    var templateName = config.template[templateIndex];
    if (templateCount[templateName]) {
      templateCount[templateName] = templateCount[templateName] + 1;
    } else {
        templateCount[templateName] = 1;
    }

    var subjectIndex = Math.floor(Math.random()*config.subject.length);
    var subject = config.subject[subjectIndex];
    if (subjectCount[subject]) {
      subjectCount[subject] = subjectCount[subject] + 1;
    } else {
      subjectCount[subject] = 1;
    }

    console.log('The email send for ' + JSON.stringify(user) + ', ' + templateName + ', subject: ' + subject);

    var mailOptions = {
      from: config.senderName + '<' + config.auth.user + '>',
      to: user.nickname + '<' + user.email + '>',
      subject: subject,
      html: html,
      text: text,
      attachments: attachments,
      headers: {
        'Disposition-Notification-To': config.auth.user
      }
    };
    transport.sendMail(mailOptions, function(err, info){
      if(err){
        log.error(user.nickname + '<' + user.email + '> send failure, template: ' + templateName + ', subject: ' + subject + ', error: ', err);
        failureEmails++;
      }else{
        log.info(user.nickname + '<' + user.email + '> send success!, template: ' + templateName + ', subject: ' + subject);
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
    console.log('Template Count: ', templateCount);
    console.log('Subject Count: ', subjectCount);
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
