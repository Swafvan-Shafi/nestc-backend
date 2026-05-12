const { sendChatNotification } = require('./src/utils/mailer');
require('dotenv').config();

async function testEmail() {
  const testEmail = 'swafvan_b240311cs@nitc.ac.in'; // Using one of the valid emails I saw
  console.log(`Sending test email to ${testEmail}...`);
  
  const result = await sendChatNotification(
    testEmail,
    'Antigravity Test Bot',
    'This is a test message to verify the NestC mail system.',
    { title: 'Test Product', price: '999' },
    'test-chat-id'
  );

  if (result) {
    console.log('Test email SENT successfully!');
  } else {
    console.log('Test email FAILED to send.');
  }
  process.exit(0);
}

testEmail();
