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

// Save File
saveBtn.addEventListener('click', () => {
    const content = editor.innerHTML.trim();

    if (content === '') {
        alert('Cannot save an empty file!');
        return;
    }

    if (currentFileIndex === -1) {
        // No file is currently selected
        if (files.length === 0) {
            // No files exist, create a new one
            const fileName = `File ${files.length + 1}`;
            files.push({ name: fileName, content });
            currentFileIndex = files.length - 1;
            updateFileList();
            alert('File saved successfully!');
        } else {
            // Ask the user if they want to save to a new file or an existing one
            const saveOption = prompt(
                'Do you want to save to a (1) New File or (2) Existing File? Enter 1 or 2:'
            );

            if (saveOption === '1') {
                // Save to a new file
                const fileName = `File ${files.length + 1}`;
                files.push({ name: fileName, content });
                currentFileIndex = files.length - 1;
                updateFileList();
                alert('File saved successfully!');
            } else if (saveOption === '2') {
                // Save to an existing file
                if (files.length > 0) {
                    const fileNames = files.map((file, index) => `${index + 1}. ${file.name}`).join('\n');
                    const fileIndex = prompt(
                        `Select a file to save to:\n${fileNames}\nEnter the file number:`
                    );

                    if (fileIndex && fileIndex >= 1 && fileIndex <= files.length) {
                        files[fileIndex - 1].content = content;
                        currentFileIndex = fileIndex - 1;
                        updateFileList();
                        alert('File saved successfully!');
                    } else {
                        alert('Invalid file selection!');
                    }
                }
            } else {
                alert('Invalid option!');
            }
        }
    } else {
        // Save to the current file
        files[currentFileIndex].content = content;
        updateFileList();
        alert('File saved successfully!');
    }

    saveFilesToLocalStorage();
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
    }
}

// Delete File
function deleteFile(index) {
    if (confirm('Are you sure you want to delete this file?')) {
        files.splice(index, 1);
        if (currentFileIndex === index) {
            currentFileIndex = -1;
            editor.innerHTML = '';
        }
        updateFileList();
    }
}

// Load Saved Files from Local Storage
function loadSavedFiles() {
    const savedFiles = JSON.parse(localStorage.getItem('files')) || [];
    files = savedFiles;
    if (files.length > 0) {
        currentFileIndex = 0;
        editor.innerHTML = files[0].content;
    }
    updateFileList();
}

// Save Files to Local Storage
function saveFilesToLocalStorage() {
    localStorage.setItem('files', JSON.stringify(files));
}

// Auto-save every 5 seconds
setInterval(() => {
    if (currentFileIndex !== -1) {
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
    darkModeBtn.innerHTML = document.body.classList.contains('dark-mode') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});
