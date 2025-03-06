document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quill editor
  const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
      toolbar: '#toolbar'
    }
  });

  // File management
  let files = {};
  let currentFile = null;

  const fileList = document.getElementById('fileList');
  const newFileBtn = document.getElementById('newFileBtn');
  const saveFileBtn = document.getElementById('saveFileBtn');
  const exportFileBtn = document.getElementById('exportFileBtn');
  const deleteFileBtn = document.getElementById('deleteFileBtn');
  const wordCount = document.getElementById('wordCount');
  const charCount = document.getElementById('charCount');

  // Update word and character count
  const updateCounts = () => {
    const text = quill.getText().trim();
    const words = text ? text.split(/\s+/).length : 0;
    const characters = text.length;
    wordCount.textContent = `Words: ${words}`;
    charCount.textContent = `Characters: ${characters}`;
  };

  quill.on('text-change', updateCounts);

  // Create a new file
  newFileBtn.addEventListener('click', () => {
    const fileName = prompt('Enter a name for the new file:');
    if (fileName) {
      files[fileName] = '';
      currentFile = fileName;
      quill.setText('');
      updateCounts();
      renderFileList();
    }
  });

  // Save the current file
  saveFileBtn.addEventListener('click', () => {
    if (currentFile) {
      files[currentFile] = quill.getText();
      alert(`File "${currentFile}" saved!`);
    } else {
      alert('No file is currently open.');
    }
  });

  // Delete the current file
  deleteFileBtn.addEventListener('click', () => {
    if (currentFile) {
      if (confirm(`Are you sure you want to delete "${currentFile}"?`)) {
        delete files[currentFile];
        currentFile = null;
        quill.setText('');
        updateCounts();
        renderFileList();
      }
    } else {
      alert('No file is currently open.');
    }
  });

  // Render the file list
  const renderFileList = () => {
    fileList.innerHTML = '';
    for (const file in files) {
      const li = document.createElement('li');
      li.textContent = file;
      li.addEventListener('click', () => {
        currentFile = file;
        quill.setText(files[file]);
        updateCounts();
        renderFileList();
      });
      if (file === currentFile) {
        li.classList.add('active');
      }
      fileList.appendChild(li);
    }
  };

  // Initial render
  renderFileList();
});
