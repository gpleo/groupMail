exports.config = {
  host: 'smtp.exmail.qq.com',
  secure: true,
  port: 465,
  auth: {
    user: 'leo@gopersist.com',
    pass: 'llybxylz&7'
  },
  tls: {
    rejectUnauthorized: false
  },
  senderName: 'Test',
  subject: ['Test email', 'Dear <%- nickname%>, Hello'],
  template: ['template', 'template2'],
  sleep: 0.5  // 每发一封邮件后,等待0.5秒
};
