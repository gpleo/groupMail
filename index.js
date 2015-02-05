var sugar = require('sugar');
var fs = require('fs');
var csv = require('fast-csv');
var Log = require('log');
var ejs = require('ejs');
var nodemailer = require('nodemailer');
var config = require(__dirname + '/data/config.js').config;

var logFile = __dirname + '/logs/' + Date.create().format('{yyyy}-{MM}-{dd}_{hh}:{mm}:{ss}') + '.log.txt';
var log = new Log('debug', fs.createWriteStream(logFile));

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

var csvStream = csv()
  .on("data", function(data){
    if (data && data.length === 2) {
      count++;

      var html = ejs.render(htmlTemplate, {nickname: data[0]});
      var text = ejs.render(textTemplate, {nickname: data[0]});

      var mailOptions = {
        from: config.senderName + '<' + config.auth.user + '>',
        to: data[0] + '<' + data[1] + '>',
        subject: config.subject,
        html: html,
        text: text,
        attachments: attachments
      };
      transport.sendMail(mailOptions, function(err, info){
        if(err){
          log.error(data[0] + '<' + data[1] + '> send failure: ', err);
          failureEmails++;
        }else{
          log.info(data[0] + '<' + data[1] + '> send success!');
          successEmails++;
          if(successEmails % 100 === 0){
            console.log('Sending ' + successEmails + ' emails successful.');
          }
        }
        count--;
        if(count===0){
          console.log('============== Done ===============');
          console.log(successEmails + ' email(s) send success!');
          console.log(failureEmails + ' email(s) send failure!');
          console.log(errorRecords + ' record(s) data error!');
          console.log('Please check the log file for detail: ' + logFile);
        }
      });
    } else {
      log.error('Error data: ', data);
      errorRecords++;
    }
  })
  .on("end", function(data){
  });
stream.pipe(csvStream);
