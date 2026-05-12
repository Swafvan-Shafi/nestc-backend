const { io } = require('socket.io-client');

const SOCKET_URL = 'http://localhost:5000'; // local backend
const senderId = '26f4908e-51b3-4655-8965-5f3779784575';
const receiverId = 'eb8fbb35-fa99-453e-81b0-78c38555f3a1';

const socket = io(SOCKET_URL);

socket.on('connect', () => {
  console.log('Connected to socket');
  socket.emit('register_user', senderId);
  
  const payload = {
    chatId: 'test_chat_123',
    senderId,
    receiverId,
    content: 'Socket test message',
    listingId: null,
    productContext: null
  };
  
  socket.emit('send_message', payload, (response) => {
    console.log('Response from server:', JSON.stringify(response));
    process.exit();
  });
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout');
  process.exit(1);
}, 10000);
