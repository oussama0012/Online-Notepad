// File Management
let files = [];
let currentFileIndex = -1;

const editor = document.getElementById('editor');
const fileList = document.getElementById('file-list');
const newFileBtn = document.getElementById('new-file-btn');
const saveBtn = document.getElementById('save-btn');

// Toolbar Buttons
const boldBtn = document.getElementById('bold-btn');
const italicBtn = document.getElementById('italic-btn');
const underlineBtn = document.getElementById('underline-btn');
const strikeBtn = document.getElementById('strike-btn');
const listUlBtn = document.getElementById('list-ul-btn');
const listOlBtn = document.getElementById('list-ol-btn');
const linkBtn = document.getElementById('link-btn');
const imageBtn = document.getElementById('image-btn');
const alignLeftBtn = document.getElementById('align-left-btn');
const alignCenterBtn = document.getElementById('align-center-btn');
const alignRightBtn = document.getElementById('align-right-btn');
const alignJustifyBtn = document.getElementById('align-justify-btn');
const fontSizeSelect = document.getElementById('font-size');
const fontFamilySelect = document.getElementById('font-family');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const darkModeBtn = document.getElementById('dark-mode-btn');

// Create New File
newFileBtn.addEventListener('click', () => {
    const fileName = `File ${files.length + 1}`;
    files.push({ name: fileName, content: '' });
    currentFileIndex = files.length - 1;
    updateFileList();
    editor.innerHTML = '';
    editor.focus();
});

// Improved Save Function
saveBtn.addEventListener('click', () => {
    const content = editor.innerHTML.trim();

    if (content === '') {
        alert('Cannot save an empty file!');
        return;
    }

    // If no file is currently selected, create a new file
    if (currentFileIndex === -1) {
        const fileName = `File ${files.length + 1}`;
        files.push({ name: fileName, content });
        currentFileIndex = files.length - 1;
    } else {
        // Update existing file
        files[currentFileIndex].content = content;
    }

    updateFileList();
    saveFilesToLocalStorage();
    alert('File saved successfully!');
});

// Update File List
function updateFileList() {
    fileList.innerHTML = files
        .map((file, index) => `
            <li class="${index === currentFileIndex ? 'active' : ''}" onclick="loadFile(${index})">
                ${file.name}
                <div class="file-actions">
                    <button onclick="renameFile(${index})"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteFile(${index})"><i class="fas fa-trash"></i></button>
                </div>
            </li>
        `)
        .join('');
}

// Load File
function loadFile(index) {
    currentFileIndex = index;
    editor.innerHTML = files[index].content;
    updateFileList();
}

// Rename File
function renameFile(index) {
    const newName = prompt('Enter new file name:', files[index].name);
    if (newName) {
        files[index].name = newName;
        updateFileList();
        saveFilesToLocalStorage();
    }
}

// Improved Delete File Function
function deleteFile(index) {
    if (confirm('Are you sure you want to delete this file?')) {
        files.splice(index, 1);

        // Adjust currentFileIndex
        if (files.length === 0) {
            // No files left
            currentFileIndex = -1;
            editor.innerHTML = '';
        } else if (currentFileIndex >= files.length) {
            // If deleted file was the last one, select the last remaining file
            currentFileIndex = files.length - 1;
            editor.innerHTML = files[currentFileIndex].content;
        } else if (currentFileIndex > index) {
            // Adjust index if file before current was deleted
            currentFileIndex--;
        }

        updateFileList();
        saveFilesToLocalStorage();
    }
}

// Improved Load Saved Files Function
function loadSavedFiles() {
    const savedFiles = JSON.parse(localStorage.getItem('files')) || [];
    files = savedFiles;
    
    if (files.length > 0) {
        currentFileIndex = 0;
        editor.innerHTML = files[0].content;
    } else {
        currentFileIndex = -1;
        editor.innerHTML = '';
    }
    
    updateFileList();
}

// Save Files to Local Storage
function saveFilesToLocalStorage() {
    try {
        localStorage.setItem('files', JSON.stringify(files));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        alert('Unable to save files. Local storage might be full or disabled.');
    }
}

// Improved Auto-save Function
setInterval(() => {
    if (currentFileIndex !== -1 && editor.innerHTML.trim() !== '') {
        files[currentFileIndex].content = editor.innerHTML;
        saveFilesToLocalStorage();
    }
}, 5000);

// Load saved files on page load
loadSavedFiles();

// Text Formatting Functions
boldBtn.addEventListener('click', () => document.execCommand('bold', false, null));
italicBtn.addEventListener('click', () => document.execCommand('italic', false, null));
underlineBtn.addEventListener('click', () => document.execCommand('underline', false, null));
strikeBtn.addEventListener('click', () => document.execCommand('strikeThrough', false, null));
listUlBtn.addEventListener('click', () => document.execCommand('insertUnorderedList', false, null));
listOlBtn.addEventListener('click', () => document.execCommand('insertOrderedList', false, null));
linkBtn.addEventListener('click', () => {
    const url = prompt('Enter the URL:');
    if (url) document.execCommand('createLink', false, url);
});
imageBtn.addEventListener('click', () => {
    const url = prompt('Enter the image URL:');
    if (url) document.execCommand('insertImage', false, url);
});

// Text Alignment
alignLeftBtn.addEventListener('click', () => document.execCommand('justifyLeft', false, null));
alignCenterBtn.addEventListener('click', () => document.execCommand('justifyCenter', false, null));
alignRightBtn.addEventListener('click', () => document.execCommand('justifyRight', false, null));
alignJustifyBtn.addEventListener('click', () => document.execCommand('justifyFull', false, null));

// Font Size and Family
fontSizeSelect.addEventListener('change', () => {
    document.execCommand('fontSize', false, fontSizeSelect.value);
});
fontFamilySelect.addEventListener('change', () => {
    document.execCommand('fontName', false, fontFamilySelect.value);
});

// Undo/Redo
undoBtn.addEventListener('click', () => document.execCommand('undo', false, null));
redoBtn.addEventListener('click', () => document.execCommand('redo', false, null));

// Dark Mode Toggle
darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    darkModeBtn.innerHTML = document.body.classList.contains('dark-mode') 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
});
