exports.config = {
  host: 'smtp.exmail.qq.com',
  secure: true,
  port: 465,
  auth: {
    user: 'test@gopersist.com',
    pass: 'tes123'
  },
  tls: {
    rejectUnauthorized: false
  },
  senderName: 'Test',
  subject: 'Test email',
  sleep: 0.5  // 每发一封邮件后,等待0.5秒
};
