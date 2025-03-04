// File Management
let currentFile = "Untitled";
let files = [];

const editor = document.getElementById('editor');
const currentFileName = document.getElementById('current-file-name');
const oldFilesList = document.getElementById('old-files-list');
const newFileBtn = document.getElementById('new-file-btn');

// New File Button Functionality
newFileBtn.addEventListener('click', () => {
    // Save the current file to the old files list
    if (editor.innerHTML.trim() !== "") {
        files.push({ name: currentFile, content: editor.innerHTML });
        updateOldFilesList();
    }

    // Clear the editor and reset the current file name
    editor.innerHTML = '';
    currentFile = "Untitled";
    currentFileName.textContent = currentFile;
    localStorage.removeItem('noteContent');
    editor.focus();
});

// Update Old Files List
function updateOldFilesList() {
    oldFilesList.innerHTML = files
        .map((file, index) => `<li onclick="loadFile(${index})">${file.name}</li>`)
        .join('');
}

// Load File from Old Files List
function loadFile(index) {
    const file = files[index];
    editor.innerHTML = file.content;
    currentFile = file.name;
    currentFileName.textContent = currentFile;
}

// Save Content to Local Storage
editor.addEventListener('input', () => {
    localStorage.setItem('noteContent', editor.innerHTML);
});

// Load Saved Content
const savedContent = localStorage.getItem('noteContent');
if (savedContent) {
    editor.innerHTML = savedContent;
}
