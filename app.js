// Initialize variables for file management
let currentFile = null;
let files = [];
let editor;

// Initialize the Quill editor
document.addEventListener('DOMContentLoaded', function() {
    // Setup Quill with toolbar options
    editor = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'align': [] }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image', 'code-block'],
                ['clean']
            ]
        },
        placeholder: 'Start typing here...'
    });

    // Load files from localStorage
    loadFiles();
    renderFileList();

    // Auto-save content periodically
    let autoSaveInterval = setInterval(() => {
        if (currentFile) {
            saveCurrentFile();
            updateSaveStatus('All changes saved');
        }
    }, 30000); // Auto-save every 30 seconds

    // Text change handler for word count and save status
    editor.on('text-change', function() {
        countWords();
        updateSaveStatus('Unsaved changes');
    });

    // Initialize event listeners
    setupEventListeners();
});

// Load files from localStorage
function loadFiles() {
    const savedFiles = localStorage.getItem('notepad-files');
    if (savedFiles) {
        files = JSON.parse(savedFiles);
    }
}

// Save files to localStorage
function saveFiles() {
    localStorage.setItem('notepad-files', JSON.stringify(files));
}

// Render the file list in the sidebar
function renderFileList() {
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';

    files.forEach(file => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas fa-file-alt"></i> ${file.name}`;
        li.dataset.id = file.id;
        
        if (currentFile && file.id === currentFile.id) {
            li.classList.add('active');
        }
        
        li.addEventListener('click', () => openFile(file.id));
        fileList.appendChild(li);
    });
}

// Create a new file
function createNewFile() {
    const fileName = 'Untitled Document';
    const newFile = {
        id: Date.now().toString(),
        name: fileName,
        content: '',
        created: new Date(),
        modified: new Date()
    };
    
    files.push(newFile);
    saveFiles();
    renderFileList();
    openFile(newFile.id);
}

// Open a file
function openFile(fileId) {
    if (currentFile) {
        saveCurrentFile(); // Save current file before opening a new one
    }
    
    const file = files.find(f => f.id === fileId);
    if (file) {
        currentFile = file;
        document.getElementById('file-name').value = file.name;
        editor.root.innerHTML = file.content;
        countWords();
        updateSaveStatus('All changes saved');
        renderFileList(); // Update active file in list
    }
}

// Save the current file
function saveCurrentFile() {
    if (currentFile) {
        const fileName = document.getElementById('file-name').value.trim() || 'Untitled Document';
        currentFile.name = fileName;
        currentFile.content = editor.root.innerHTML;
        currentFile.modified = new Date();
        
        const fileIndex = files.findIndex(f => f.id === currentFile.id);
        if (fileIndex >= 0) {
            files[fileIndex] = currentFile;
        }
        
        saveFiles();
        renderFileList();
    }
}

// Delete the current file
function deleteCurrentFile() {
    if (currentFile) {
        const fileIndex = files.findIndex(f => f.id === currentFile.id);
        if (fileIndex >= 0) {
            files.splice(fileIndex, 1);
            saveFiles();
            renderFileList();
            
            if (files.length > 0) {
                openFile(files[0].id);
            } else {
                currentFile = null;
                document.getElementById('file-name').value = '';
                editor.root.innerHTML = '';
                countWords();
            }
        }
    }
}

// Rename the current file
function renameCurrentFile(newName) {
    if (currentFile && newName) {
        currentFile.name = newName;
        document.getElementById('file-name').value = newName;
        
        // Update files array and save
        const fileIndex = files.findIndex(f => f.id === currentFile.id);
        if (fileIndex >= 0) {
            files[fileIndex] = currentFile;
        }
        
        saveFiles();
        renderFileList();
        
        // Show success toast
        showToast('File renamed successfully', 'success');
    } else {
        showToast('Failed to rename file', 'error');
    }
}

// Count words in the editor
function countWords() {
    const text = editor.getText().trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    document.getElementById('word-count').textContent = `${wordCount} words`;
}

// Update the save status indicator
function updateSaveStatus(message) {
    // This function still exists but we're not displaying the status element
    // We'll still show toast notifications when explicitly saving
    if (message !== 'Unsaved changes') {
        showToast(message, 'success');
    }
}

// Helper function to download a blob
function downloadBlob(blob, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
    
    // Show success message
    showToast(`Successfully exported as ${fileName}`, 'success');
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Export functions
function exportAsTxt() {
    if (!currentFile) {
        showToast('No file to export', 'error');
        return;
    }
    
    const fileName = currentFile.name || 'document';
    const text = editor.getText();
    const blob = new Blob([text], { type: 'text/plain' });
    downloadBlob(blob, `${fileName}.txt`);
}

function exportAsPdf() {
    if (!currentFile) {
        showToast('No file to export', 'error');
        return;
    }
    
    const fileName = currentFile.name || 'document';
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Convert editor content to plain text for now
    // For a more advanced solution, html2canvas can be used
    const text = editor.getText();
    const lines = doc.splitTextToSize(text, 180);
    
    doc.text(lines, 15, 15);
    doc.save(`${fileName}.pdf`);
    showToast(`Successfully exported as ${fileName}.pdf`, 'success');
}

function exportAsDocx() {
    if (!currentFile) {
        showToast('No file to export', 'error');
        return;
    }
    
    const fileName = currentFile.name || 'document';
    const text = editor.getText();
    
    // Access the docx library through the global window object
    const Document = window.docx.Document;
    const Paragraph = window.docx.Paragraph;
    const TextRun = window.docx.TextRun;
    const Packer = window.docx.Packer;
    
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [new TextRun(text)]
                })
            ]
        }]
    });
    
    Packer.toBlob(doc).then(blob => {
        downloadBlob(blob, `${fileName}.docx`);
    }).catch(err => {
        showToast('Failed to export as DOCX', 'error');
        console.error(err);
    });
}

// Toggle fullscreen mode
function toggleFullscreen() {
    const editorContainer = document.querySelector('.editor-container');
    editorContainer.classList.toggle('fullscreen');
    
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (editorContainer.classList.contains('fullscreen')) {
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        fullscreenBtn.textContent = ' Exit Fullscreen';
        fullscreenBtn.style.position = 'fixed';
        fullscreenBtn.style.top = '20px';
        fullscreenBtn.style.right = '20px';
        fullscreenBtn.style.zIndex = '10000';
    } else {
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        fullscreenBtn.textContent = ' Fullscreen';
        fullscreenBtn.style.position = '';
        fullscreenBtn.style.top = '';
        fullscreenBtn.style.right = '';
        fullscreenBtn.style.zIndex = '';
    }
}

// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Setup all event listeners
function setupEventListeners() {
    // New file button
    document.getElementById('new-file-btn').addEventListener('click', createNewFile);
    
    // Save button
    document.getElementById('save-file-btn').addEventListener('click', () => {
        saveCurrentFile();
        updateSaveStatus('All changes saved');
        showToast('All changes saved', 'success');
    });
    
    // Open file button - Changed to allow opening files from desktop
    document.getElementById('open-file-btn').addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt, .html, .md, .js, .css, .json, .log'; 
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const fileName = file.name.split('.')[0];
                    const content = event.target.result;
                    
                    // Create a new file in our app with the content
                    const newFile = {
                        id: Date.now().toString(),
                        name: file.name,
                        content: content,
                        created: new Date(),
                        modified: new Date()
                    };
                    
                    files.push(newFile);
                    saveFiles();
                    renderFileList();
                    openFile(newFile.id);
                    
                    showToast(`Opened file: ${file.name}`, 'success');
                };
                
                // Use appropriate method based on file type
                if (file.type.startsWith('text/') || 
                    ['.txt', '.html', '.md', '.js', '.css', '.json', '.log'].includes(file.name.slice(file.name.lastIndexOf('.')))) {
                    reader.readAsText(file);
                } else {
                    showToast('Unsupported file type', 'warning');
                }
            }
        };
        
        fileInput.click();
    });
    
    // Delete file button
    document.getElementById('delete-file-btn').addEventListener('click', () => {
        if (currentFile) {
            showModal('delete-modal');
        } else {
            showToast('No file selected to delete', 'warning');
        }
    });
    
    document.getElementById('delete-confirm').addEventListener('click', () => {
        deleteCurrentFile();
        hideModal('delete-modal');
        showToast('File deleted successfully', 'success');
    });
    
    document.getElementById('delete-cancel').addEventListener('click', () => {
        hideModal('delete-modal');
    });
    
    // Rename file button
    document.getElementById('rename-file-btn').addEventListener('click', () => {
        if (currentFile) {
            document.getElementById('rename-input').value = currentFile.name;
            document.getElementById('rename-modal').style.display = 'block';
            setTimeout(() => {
                document.getElementById('rename-modal').classList.add('show');
            }, 10);
        }
    });
    
    document.getElementById('rename-confirm').addEventListener('click', () => {
        const newName = document.getElementById('rename-input').value.trim();
        if (newName) {
            renameCurrentFile(newName);
            hideModal('rename-modal');
        } else {
            showToast('Please enter a valid filename', 'warning');
        }
    });
    
    document.getElementById('rename-cancel').addEventListener('click', () => {
        document.getElementById('rename-modal').style.display = 'none';
        document.getElementById('rename-modal').classList.remove('show');
    });
    
    // File name input change
    document.getElementById('file-name').addEventListener('blur', () => {
        saveCurrentFile();
        updateSaveStatus('All changes saved');
    });
    
    // Export dropdown functionality
    document.getElementById('export-file-btn').addEventListener('click', function(e) {
        e.preventDefault();
        const dropdown = document.querySelector('.dropdown-content');
        dropdown.classList.toggle('show');
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function closeDropdown(e) {
            if (!e.target.matches('#export-file-btn') && !e.target.closest('.dropdown-content')) {
                dropdown.classList.remove('show');
                document.removeEventListener('click', closeDropdown);
            }
        });
    });
    
    // Export buttons
    document.getElementById('export-txt').addEventListener('click', function(e) {
        e.preventDefault();
        exportAsTxt();
        document.querySelector('.dropdown-content').classList.remove('show');
    });
    
    document.getElementById('export-pdf').addEventListener('click', function(e) {
        e.preventDefault();
        exportAsPdf();
        document.querySelector('.dropdown-content').classList.remove('show');
    });
    
    document.getElementById('export-docx').addEventListener('click', function(e) {
        e.preventDefault();
        exportAsDocx();
        document.querySelector('.dropdown-content').classList.remove('show');
    });
    
    // Fullscreen button - moving the event listener to maintain functionality 
    // for the button that will now be in the toolbar
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    
    // Close buttons for modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            hideModal(modal.id);
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Create a default first file if none exists
window.addEventListener('load', function() {
    if (files.length === 0) {
        createNewFile();
    } else {
        openFile(files[0].id);
    }
});
