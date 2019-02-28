exports.config = {
  host: 'smtp.exmail.qq.com',
  secure: true,
  port: 465,
  auth: {
    user: 'test@gopersist.com',
    pass: 'abcd1234'
  },
  tls: {
    rejectUnauthorized: false
  },
  senderName: 'Test',
  subject: ['Test email', 'Test subject 2', 'Test subject 3'],
  template: ['template', 'template2'],
  sleep: 0.5  // 每发一封邮件后,等待0.5秒
};
