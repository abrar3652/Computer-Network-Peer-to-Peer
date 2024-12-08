// WebSocket connection
const socket = new WebSocket('ws://localhost:3000');  // Connect to the WebSocket server

// Ensure the WebSocket is sending and receiving text
socket.binaryType = 'text'; // We expect text data

// DOM Elements
const usernameForm = document.getElementById('usernameForm');
const chatInterface = document.getElementById('chatInterface');
const startChatButton = document.getElementById('startChatButton');
const usernameInput = document.getElementById('usernameInput');
const usernameDisplay = document.getElementById('usernameDisplay');
const sendButton = document.getElementById('sendButton');
const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('fileInput');
const messagesContainer = document.getElementById('messages');
const emojiButton = document.getElementById('emojiButton');
const emojiPicker = document.getElementById('emojiPicker');
const mediaButton = document.getElementById('mediaButton');


// Event listeners
startChatButton.addEventListener('click', startChat);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('input', toggleSendButton);
fileInput.addEventListener('change', sendFile);
messageInput.addEventListener('keydown', handleKeyPress);
emojiButton.addEventListener('click', toggleEmojiPicker);
mediaButton.addEventListener('click', openFilePicker);  // Handle file picker click

// Check if the user has already entered their name
// usernameForm.style.display = 'block';
// chatInterface.style.display = 'none';
// const username = localStorage.getItem('username');
// if (username) {
//     switchToChat(username);
// }
//  else {
//     usernameForm.style.display = 'block';
//     chatInterface.style.display = 'none';
// }

// Start the chat after user enters their name
chatInterface.style.display = 'none';
function startChat() {
    usernameForm.style.display = 'none';

    const enteredUsername = usernameInput.value.trim();
    if (enteredUsername) {
        localStorage.setItem('username', enteredUsername);
        switchToChat(enteredUsername);
    } else {
        alert('Please enter a valid name.');
    }
}

// Switch to the chat interface
function switchToChat(username) {
    usernameForm.style.display = 'none';
    chatInterface.style.display = 'block';
    // usernameDisplay.textContent = username;
    socket.send(JSON.stringify({ type: 'join', username: username })); // Send join message to the server
}

// Enable the Send button only when there's text in the message input
function toggleSendButton() {
    sendButton.disabled = !messageInput.value.trim();
}

// Function to handle Enter key press
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();  // Prevent the default action (line break)
        sendMessage();
    }
}

// Function to send a text message
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        // Send message via WebSocket
        const username = localStorage.getItem('username');

        socket.send(JSON.stringify({ 
            type: 'message', 
            content: message,
            username: username 
        }));
        displayMessage('You: ' + message);
        messageInput.value = ''; // Clear the input after sending
    }
}

// Function to toggle the emoji picker visibility
function toggleEmojiPicker() {
    emojiPicker.style.display = emojiPicker.style.display === 'block' ? 'none' : 'block';
}

// Function to insert the selected emoji into the message input field
function insertEmoji(emoji) {
    messageInput.value += emoji;  // Append the emoji to the text input
    messageInput.focus();  // Focus back to the input field
    toggleEmojiPicker();  // Hide the emoji picker after selecting an emoji
}

// Function to open the file picker
function openFilePicker() {
    fileInput.click();  // Trigger the file input dialog
}

// Function to display messages in the UI
function displayMessage(message, fileElement = null) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.textContent = message;  // Text message

    // If there's a file (image or document), add it as well
    if (fileElement) {
        messageElement.appendChild(fileElement);
    }

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the bottom
}

// Function to handle file input and send the file (including images and documents)
function sendFile() {
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const fileContent = event.target.result; // Base64 encoded string

            // Check if the file is an image or a document
            const isImage = file.type.startsWith('image/');
            const isDocument = !isImage && (file.type === 'application/pdf' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/vnd.ms-powerpoint' || file.type === 'application/xml');

            // Handle image files
            if (isImage) {
                const imageElement = document.createElement('img');
                imageElement.src = fileContent;
                imageElement.alt = file.name;
                imageElement.style.maxWidth = '200px'; // Limit image size
                imageElement.style.maxHeight = '200px';
                displayMessage('You shared an image: ' + file.name, imageElement);
            }

            // Handle document files (e.g., PDF, DOCX, PPTX)
            if (isDocument) {
                const docLink = document.createElement('a');
                docLink.href = fileContent;
                docLink.target = '_blank'; // Open in a new tab
                docLink.textContent = 'You shared a document: ' + file.name;
                displayMessage('You shared a document: ' + file.name, docLink);
            }

            // Send the file as base64 string to the server
            socket.send(JSON.stringify({
                type: 'file',
                fileName: file.name,
                fileContent: fileContent,
                fileType: file.type  // Send the file type (image, document, etc.)
            }));
        };
        reader.readAsDataURL(file); // Read the file as base64 (data URL)
        fileInput.value = ''; // Clear the file input after sending
    }
}

// WebSocket event handlers
socket.onopen = function() {
    console.log('WebSocket connection established.');
};

socket.onmessage = function(event) {
    try {
        const data = JSON.parse(event.data); // Parse the message as JSON
        const username = data.username || "Peer";  // Fallback to "Peer" if username is not present

        if (data.type === 'message') {
            if (typeof data.content === 'string') {
                displayMessage(username + ': ' + data.content); // Display the text message content correctly
                // displayMessage(`${data.username}: ${data.content}`); // Display the message with username
            } else {
                console.error('Invalid message content:', data.content);
            }
        } else if (data.type === 'file') {
            // Handle file messages (images and documents)
            if (data.fileContent) {
                const isImage = data.fileType.startsWith('image/');
                const isDocument = !isImage && (data.fileType === 'application/pdf' || data.fileType === 'application/msword' || data.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || data.fileType === 'application/vnd.ms-powerpoint' || data.fileType === 'application/xml');
                
                if (isImage) {
                    const imageElement = document.createElement('img');
                    imageElement.src = data.fileContent;
                    imageElement.alt = data.fileName;
                    imageElement.style.maxWidth = '200px'; // Limit image size
                    imageElement.style.maxHeight = '200px';
                    displayMessage(username + ' shared an image: ' + ': ' + data.fileName, imageElement);
                    // displayMessage('Peer shared an image: ' + ': ' + data.fileName, imageElement);
                    // displayMessage(`${data.username} shared an image: ${data.fileName}`, imageElement);
                }

                if (isDocument) {
                    const docLink = document.createElement('a');
                    docLink.href = data.fileContent;
                    docLink.target = '_blank'; // Open in a new tab
                    docLink.textContent = 'Peer shared a document: ' + data.fileName;
                    displayMessage(username + ' Peer shared a document: ' + data.fileName, docLink);
                    // displayMessage(' Peer shared a document: ' + data.fileName, docLink);
                    // displayMessage(`${data.username} shared a document: ${data.fileName}`, docLink);
                }
            }
        }
    } catch (error) {
        console.error('Error parsing message:', error);
    }
};

socket.onclose = function() {
    console.log('WebSocket connection closed.');
};

socket.onerror = function(error) {
    console.error('WebSocket error:', error);
};





// // WebSocket connection
// const socket = new WebSocket('ws://localhost:3000');  // Connect to the WebSocket server

// // Ensure the WebSocket is sending and receiving text
// socket.binaryType = 'text'; // We expect text data

// // DOM Elements
// const sendButton = document.getElementById('sendButton');
// const messageInput = document.getElementById('messageInput');
// const fileInput = document.getElementById('fileInput');
// const messagesContainer = document.getElementById('messages');

// // Event listeners
// sendButton.addEventListener('click', sendMessage);
// messageInput.addEventListener('input', toggleSendButton);
// fileInput.addEventListener('change', sendFile);

// // Enable the Send button only when there's text in the message input
// function toggleSendButton() {
//     sendButton.disabled = !messageInput.value.trim();
// }

// // Function to send a text message
// function sendMessage() {
//     const message = messageInput.value.trim();
//     if (message) {
//         // Send message via WebSocket
//         socket.send(JSON.stringify({ type: 'message', content: message }));
//         displayMessage('You: ' + message);
//         messageInput.value = ''; // Clear the input after sending
//     }
// }

// // Function to display messages in the UI
// function displayMessage(message, fileElement = null) {
//     const messageElement = document.createElement('div');
//     messageElement.classList.add('message');
//     messageElement.textContent = message;  // Text message

//     // If there's a file (image or document), add it as well
//     if (fileElement) {
//         messageElement.appendChild(fileElement);
//     }

//     messagesContainer.appendChild(messageElement);
//     messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the bottom
// }

// // Function to handle file input and send the file (including images and documents)
// function sendFile() {
//     const file = fileInput.files[0];
//     if (file) {
//         const reader = new FileReader();
//         reader.onload = function(event) {
//             const fileContent = event.target.result; // Base64 encoded string

//             // Check if the file is an image or a document
//             const isImage = file.type.startsWith('image/');
//             const isDocument = !isImage && (file.type === 'application/pdf' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

//             // Handle image files
//             if (isImage) {
//                 const imageElement = document.createElement('img');
//                 imageElement.src = fileContent;
//                 imageElement.alt = file.name;
//                 imageElement.style.maxWidth = '200px'; // Limit image size
//                 imageElement.style.maxHeight = '200px';
//                 displayMessage('You shared an image: ' + file.name, imageElement);
//             }

//             // Handle document files (e.g., PDF, DOCX)
//             if (isDocument) {
//                 const docLink = document.createElement('a');
//                 docLink.href = fileContent;
//                 docLink.target = '_blank'; // Open in a new tab
//                 docLink.textContent = 'You shared a document: ' + file.name;
//                 displayMessage('You shared a document: ' + file.name, docLink);
//             }

//             // Send the file as base64 string to the server
//             socket.send(JSON.stringify({
//                 type: 'file',
//                 fileName: file.name,
//                 fileContent: fileContent,
//                 fileType: file.type  // Send the file type (image, document, etc.)
//             }));
//         };
//         reader.readAsDataURL(file); // Read the file as base64 (data URL)
//         fileInput.value = ''; // Clear the file input after sending
//     }
// }

// // WebSocket event handlers
// socket.onopen = function() {
//     console.log('WebSocket connection established.');
// };

// socket.onmessage = function(event) {
//     console.log('Message received from server:', event.data); // Log to check if the message is received
//     try {
//         const data = JSON.parse(event.data); // Parse the message as JSON

//         if (data.type === 'message') {
//             if (typeof data.content === 'string') {
//                 displayMessage('Peer: ' + data.content); // Display the text message content correctly
//             } else {
//                 console.error('Invalid message content:', data.content);
//             }
//         } else if (data.type === 'file') {
//             // Handle file messages (images and documents)
//             if (data.fileContent) {
//                 const isImage = data.fileType.startsWith('image/');
//                 const isDocument = !isImage && (data.fileType === 'application/pdf' || data.fileType === 'application/msword' || data.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

//                 // Display image if it's an image
//                 if (isImage) {
//                     const imageElement = document.createElement('img');
//                     imageElement.src = data.fileContent;  // Set the base64 string as image source
//                     imageElement.alt = data.fileName;
//                     imageElement.style.maxWidth = '200px'; // Limit the image size
//                     imageElement.style.maxHeight = '200px';
//                     displayMessage('Peer shared an image: ' + data.fileName, imageElement);
//                 }

//                 // Display document link if it's a document
//                 if (isDocument) {
//                     const docLink = document.createElement('a');
//                     docLink.href = data.fileContent;
//                     docLink.target = '_blank'; // Open in a new tab
//                     docLink.textContent = 'Peer shared a document: ' + data.fileName;
//                     displayMessage('Peer shared a document: ' + data.fileName, docLink);
//                 }
//             }
//         }
//     } catch (error) {
//         console.error('Error parsing message:', error);
//     }
// };

// socket.onclose = function() {
//     console.log('WebSocket connection closed.');
// };

// socket.onerror = function(error) {
//     console.error('WebSocket error:', error);
// };










//----------------------- last 4 pages

// // Create a WebSocket connection to the server
// const socket = new WebSocket('ws://localhost:3000');

// // Elements for each page
// const loginPage = document.getElementById('page-login');
// const chatPage = document.getElementById('page-chat');
// const liveConnectionsPage = document.getElementById('page-live-connections');
// const groupChatPage = document.getElementById('page-group-chat');

// // Login Form and Username
// const loginForm = document.getElementById('login-form');
// const currentUsername = document.getElementById('current-username');
// const usernameInput = document.getElementById('username');

// // Chat-related elements
// const messagesContainer = document.getElementById('messages');
// const chatMessageInput = document.getElementById('chat-message');
// const sendMessageBtn = document.getElementById('send-message-btn');
// const emojiBtn = document.getElementById('emoji-btn');
// const fileInput = document.getElementById('file-input');
// const fileBtn = document.getElementById('file-btn');

// // Live Connections page elements
// const liveConnectionsList = document.getElementById('live-connections-list');
// const liveConnectionsBtn = document.getElementById('live-connection-btn');
// const backToChatBtn = document.getElementById('back-to-chat-btn');

// // Group chat elements
// const groupSelectList = document.getElementById('group-select-list');
// const createGroupBtn = document.getElementById('create-group-btn');

// // Track the current user and selected peers
// let currentPeerId = '';
// let selectedPeers = [];

// // Login Logic: Once the user enters their name
// loginForm.addEventListener('submit', (e) => {
//     e.preventDefault();
//     const username = usernameInput.value;
//     if (username) {
//         currentUsername.textContent = username;
//         loginPage.style.display = 'none';
//         chatPage.style.display = 'block';

//         // Send username to the server to create a new connection
//         socket.send(JSON.stringify({ type: 'newUser', username: username }));
//     }
// });

// // WebSocket connection opened
// socket.addEventListener('open', () => {
//     console.log('Connected to WebSocket server');
// });

// // Receive messages from server
// socket.addEventListener('message', (event) => {
//     const data = JSON.parse(event.data);

//     switch (data.type) {
//         case 'welcome':
//             // Set the peer ID when a user connects
//             currentPeerId = data.peerId;
//             break;

//         case 'chatMessage':
//             // Display incoming chat messages
//             displayMessage(data.username, data.message);
//             break;

//         case 'updatePeerList':
//             // Update the live connection list
//             updatePeerList(data.peers);
//             break;

//         case 'groupMessage':
//             // Handle receiving group messages
//             displayGroupMessage(data);
//             break;

//         case 'groupCreated':
//             // Handle group creation success
//             alert(`Group created with members: ${data.members.join(', ')}`);
//             break;

//         case 'groupCreationFailed':
//             // Handle failed group creation
//             alert(`Failed to create group: ${data.message}`);
//             break;

//         default:
//             console.log('Unknown message type:', data);
//     }
// });

// // Send a chat message when the user clicks the send button
// sendMessageBtn.addEventListener('click', () => {
//     const message = chatMessageInput.value.trim();
//     if (message) {
//         socket.send(JSON.stringify({ type: 'chatMessage', message: message, username: currentUsername.textContent }));
//         chatMessageInput.value = ''; // Clear the input after sending
//     }
// });

// // Show emoji picker (basic)
// emojiBtn.addEventListener('click', () => {
//     chatMessageInput.value += '😊'; // Just adding an emoji as an example
// });

// // Handle file input button click (basic)
// fileBtn.addEventListener('click', () => {
//     fileInput.click();
// });

// // Handle file selection (for future enhancement)
// fileInput.addEventListener('change', (e) => {
//     const file = e.target.files[0];
//     if (file) {
//         console.log('Selected file:', file.name);
//         // You can send the file to the server here or handle it in another way
//     }
// });

// // Switch to the live connections page
// liveConnectionsBtn.addEventListener('click', () => {
//     chatPage.style.display = 'none';
//     liveConnectionsPage.style.display = 'block';
// });

// // Back to the chat interface from the live connections page
// backToChatBtn.addEventListener('click', () => {
//     liveConnectionsPage.style.display = 'none';
//     chatPage.style.display = 'block';
// });

// // Handle group creation logic
// createGroupBtn.addEventListener('click', () => {
//     if (selectedPeers.length > 0) {
//         socket.send(JSON.stringify({ type: 'createGroup', selectedPeers: selectedPeers }));
//     } else {
//         alert('Please select peers to create a group.');
//     }
// });

// // Handle peer selection in the live connections page
// function updatePeerList(peers) {
//     liveConnectionsList.innerHTML = ''; // Clear the current list
//     peers.forEach((peer) => {
//         if (peer !== currentPeerId) { // Do not allow user to select themselves
//             const listItem = document.createElement('li');
//             listItem.textContent = peer;
//             listItem.addEventListener('click', () => selectPeer(peer));
//             liveConnectionsList.appendChild(listItem);
//         }
//     });
// }

// // Select or deselect a peer for group creation
// function selectPeer(peerId) {
//     const index = selectedPeers.indexOf(peerId);
//     if (index === -1) {
//         selectedPeers.push(peerId);
//     } else {
//         selectedPeers.splice(index, 1);
//     }
//     console.log('Selected peers:', selectedPeers);
// }

// // Display a chat message in the chat area
// function displayMessage(username, message) {
//     const messageElem = document.createElement('div');
//     messageElem.classList.add('message');
//     messageElem.innerHTML = `<strong>${username}:</strong> ${message}`;
//     messagesContainer.appendChild(messageElem);
// }

// // Display group messages in the chat area
// function displayGroupMessage(data) {
//     const messageElem = document.createElement('div');
//     messageElem.classList.add('group-message');
//     messageElem.innerHTML = `<strong>Group [${data.groupId}]:</strong> ${data.message}`;
//     messagesContainer.appendChild(messageElem);
// }

// // WebSocket connection error handling
// socket.addEventListener('error', (error) => {
//     console.error('WebSocket error:', error);
// });

// // WebSocket connection closed
// socket.addEventListener('close', () => {
//     console.log('Disconnected from WebSocket server');
// });











// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>P2P Communication App</title>
//     <link rel="stylesheet" href="./style.css"> <!-- Link to the external CSS -->
// </head>
// <body>
//     <!-- Page 1: Login -->
//     <div id="page-login" class="page">
//         <header>
//             <h1>Welcome to P2P Chat</h1>
//         </header>
//         <main>
//             <form id="login-form">
//                 <label for="username">Enter Your Name:</label>
//                 <input type="text" id="username" placeholder="Enter your name" required>
//                 <button type="submit" id="login-btn">Enter</button>
//             </form>
//         </main>
//         <footer>
//             <p>Secure P2P Communication</p>
//         </footer>
//     </div>

//     <!-- Page 2: Chat Interface -->
//     <div id="page-chat" class="page" style="display: none;">
//         <header>
//             <h1>Chat Interface</h1>
//             <button id="live-connection-btn">Live Connections</button>
//         </header>
//         <main>
//             <section id="chat-container">
//                 <div id="messages">
//                     <!-- Messages will appear here -->
//                 </div>
//                 <div id="chat-input">
//                     <textarea id="chat-message" placeholder="Type your message"></textarea>
//                     <button id="emoji-btn">😊</button>
//                     <input type="file" id="file-input" hidden>
//                     <button id="file-btn">📎</button>
//                     <button id="send-message-btn">Send</button>
//                 </div>
//             </section>
//         </main>
//         <footer>
//             <p>Connected as <span id="current-username"></span></p>
//         </footer>
//     </div>

//     <!-- Page 3: Live Connections -->
//     <div id="page-live-connections" class="page" style="display: none;">
//         <header>
//             <h1>Live Connections</h1>
//             <button id="back-to-chat-btn">Back to Chat</button>
//         </header>
//         <main>
//             <ul id="live-connections-list">
//                 <!-- List of live connections will be dynamically added -->
//             </ul>
//         </main>
//         <footer>
//             <p>Live Connection Status</p>
//         </footer>
//     </div>

//     <!-- Page 4: Group Chat -->
//     <div id="page-group-chat" class="page" style="display: none;">
//         <header>
//             <h1>Group Chat</h1>
//         </header>
//         <main>
//             <section>
//                 <h2>Select Peers for Group</h2>
//                 <ul id="group-select-list">
//                     <!-- List of selectable peers will be dynamically added here -->
//                 </ul>
//                 <button id="create-group-btn">Create Group</button>
//             </section>
//         </main>
//         <footer>
//             <p>Group Chat</p>
//         </footer>
//     </div>

//     <!-- Link to external JavaScript file -->
//     <script src="./main.js"></script>
// </body>
// </html>

