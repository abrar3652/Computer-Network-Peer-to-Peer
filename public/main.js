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
    // usernameForm.style.display = 'none';

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
    usernameDisplay.textContent = username;
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
    const username = localStorage.getItem('username');

    if (message && username) {
        // Send message via WebSocket

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
        // const username = data.username || "Peer";  // Fallback to "Peer" if username is not present

        if (data.type === 'message'&& data.content && data.username) {
            if (typeof data.content === 'string') {
                displayMessage(data.username + ': ' + data.content); // Display the text message content correctly
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
                    displayMessage(data.username + ' shared an image: ' + ': ' + data.fileName, imageElement);
                    // displayMessage('Peer shared an image: ' + ': ' + data.fileName, imageElement);
                    // displayMessage(`${data.username} shared an image: ${data.fileName}`, imageElement);
                }

                if (isDocument) {
                    const docLink = document.createElement('a');
                    docLink.href = data.fileContent;
                    docLink.target = '_blank'; // Open in a new tab
                    docLink.textContent = 'Peer shared a document: ' + data.fileName;
                    displayMessage(data.username + ' Peer shared a document: ' + data.fileName, docLink);
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

