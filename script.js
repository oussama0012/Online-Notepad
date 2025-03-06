// File Management
document.getElementById('upload-btn').addEventListener('click', () => {
  document.getElementById('file-upload').click();
});

document.getElementById('file-upload').addEventListener('change', (e) => {
  const files = e.target.files;
  const fileList = document.getElementById('file-list');
  fileList.innerHTML = '';

  Array.from(files).forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.textContent = file.name;
    fileItem.addEventListener('click', () => openFile(file));
    fileList.appendChild(fileItem);
  });
});

function openFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('editor').innerHTML = e.target.result;
    document.getElementById('article-content').innerHTML = e.target.result;
  };
  reader.readAsText(file);
}

// Text Formatting
function formatText(command) {
  document.execCommand(command, false, null);
}

function changeFontSize(size) {
  document.execCommand('fontSize', false, size);
}

function alignText(align) {
  document.execCommand('justify' + align, false, null);
}

function insertBullet() {
  document.execCommand('insertUnorderedList', false, null);
}

function insertNumber() {
  document.execCommand('insertOrderedList', false, null);
}

// Undo/Redo
function undo() {
  document.execCommand('undo', false, null);
}

function redo() {
  document.execCommand('redo', false, null);
}

// Save and Export
function saveNote() {
  const content = document.getElementById('editor').innerHTML;
  localStorage.setItem('savedNote', content);
  alert('Note saved!');
}

function exportNote(format) {
  const content = document.getElementById('editor').innerText;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `note.${format}`;
  a.click();
}

function clearNote() {
  document.getElementById('editor').innerHTML = '';
  document.getElementById('article-content').innerHTML = '';
}

// Auto-save
setInterval(() => {
  const content = document.getElementById('editor').innerHTML;
  localStorage.setItem('savedNote', content);
}, 5000);

// Load saved note on page load
window.onload = () => {
  const savedNote = localStorage.getItem('savedNote');
  if (savedNote) {
    document.getElementById('editor').innerHTML = savedNote;
    document.getElementById('article-content').innerHTML = savedNote;
  }
};
