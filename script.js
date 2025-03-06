// DOM Elements
const editor = document.getElementById('editor');
const fileList = document.getElementById('file-list');
const newFileBtn = document.getElementById('new-file');
const saveBtn = document.getElementById('save');
const exportBtn = document.getElementById('export');
const wordCount = document.getElementById('word-count');
const charCount = document.getElementById('char-count');
const lineNumber = document.getElementById('line-number');
const cursorPosition = document.getElementById('cursor-position');

// File Management
let files = [];
let currentFile = null;

newFileBtn.addEventListener('click', () => {
  const fileName = prompt('Enter file name:');
  if (fileName) {
    const file = { name: fileName, content: '' };
    files.push(file);
    renderFileList();
    openFile(file);
  }
});

function renderFileList() {
  fileList.innerHTML = '';
  files.forEach((file, index) => {
    const li = document.createElement('li');
    li.textContent = file.name;
    li.addEventListener('click', () => openFile(file));
    fileList.appendChild(li);
  });
}

function openFile(file) {
  currentFile = file;
  editor.value = file.content;
  updateStatusBar();
}

saveBtn.addEventListener('click', () => {
  if (currentFile) {
    currentFile.content = editor.value;
    alert('File saved!');
  }
});

exportBtn.addEventListener('click', () => {
  if (currentFile) {
    const blob = new Blob([currentFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    a.click();
  }
});

// Status Bar Updates
editor.addEventListener('input', () => {
  if (currentFile) {
    currentFile.content = editor.value;
    updateStatusBar();
  }
});

editor.addEventListener('keyup', () => {
  updateCursorPosition();
});

function updateStatusBar() {
  const text = editor.value;
  const words = text.split(/\s+/).filter(word => word.length > 0).length;
  const chars = text.length;
  const lines = text.split('\n').length;

  wordCount.textContent = `Words: ${words}`;
  charCount.textContent = `Chars: ${chars}`;
  lineNumber.textContent = `Lines: ${lines}`;
}

function updateCursorPosition() {
  const cursorPos = editor.selectionStart;
  const textBeforeCursor = editor.value.substring(0, cursorPos);
  const line = textBeforeCursor.split('\n').length;
  const column = textBeforeCursor.split('\n').pop().length + 1;
  cursorPosition.textContent = `Cursor: ${line}:${column}`;
}
