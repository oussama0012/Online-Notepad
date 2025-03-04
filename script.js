// File Management
let files = [];
let currentFileIndex = -1;

const editor = document.getElementById('editor');
const fileList = document.getElementById('file-list');
const newFileBtn = document.getElementById('new-file-btn');
const saveBtn = document.getElementById('save-btn');

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
    if (currentFileIndex !== -1) {
        files[currentFileIndex].content = editor.innerHTML;
        updateFileList();
    }
});

// Update File List
function updateFileList() {
    fileList.innerHTML = files
        .map((file, index) => `
            <li class="${index === currentFileIndex ? 'active' : ''}" onclick="loadFile(${index})">
                ${file.name}
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
