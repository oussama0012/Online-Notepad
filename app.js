class NotepadApp {
    constructor() {
        this.notepad = document.getElementById('notepad');
        this.charCount = document.getElementById('charCount');
        this.wordCount = document.getElementById('wordCount');
        this.toolbarBtns = document.querySelectorAll('.toolbar-btn');
        this.colorPicker = document.getElementById('textColorPicker');
        this.fontSelector = document.getElementById('fontSelector');
        this.fontSizeSelector = document.getElementById('fontSizeSelector');
        this.savedFilesContainer = document.getElementById('savedFilesContainer');
        this.savedFilesList = document.getElementById('savedFilesList');
        this.toggleSavedFilesBtn = document.getElementById('toggleSavedFiles');
        this.hasUnsavedChanges = false;
        this.savedContent = '';
        this.undoStack = [this.notepad.innerHTML]; 
        this.redoStack = [];
        this.lastSavedState = '';
        this.isUndoRedo = false;
        this.currentNoteId = null;
        this.savedNotes = {};

        this.setupEventListeners();
        this.loadSavedNotes();
        this.renderSavedFiles();
        
        // Initialize toggle button as collapsed
        this.toggleSavedFilesBtn.classList.add('collapsed');
    }

    setupEventListeners() {
        this.notepad.addEventListener('input', () => {
            if (!this.isUndoRedo) {
                this.undoStack.push(this.notepad.innerHTML);
                this.redoStack = [];
            }
            this.isUndoRedo = false;
            this.updateStats();
            this.checkForChanges();
        });
        
        this.toolbarBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleToolbarAction(btn.dataset.action));
        });

        this.colorPicker.addEventListener('change', (e) => {
            this.notepad.style.color = e.target.value;
        });
        
        this.fontSelector.addEventListener('change', (e) => {
            this.notepad.style.fontFamily = e.target.value;
        });
        
        this.fontSizeSelector.addEventListener('change', (e) => {
            this.notepad.style.fontSize = e.target.value + 'px';
        });

        this.toggleSavedFilesBtn.addEventListener('click', () => {
            this.toggleSavedFilesPanel();
        });
    }

    toggleSavedFilesPanel() {
        const filesList = this.savedFilesList;
        const toggleBtn = this.toggleSavedFilesBtn;
        
        if (filesList.style.display === 'none' || filesList.style.display === '') {
            filesList.style.display = 'flex';
            toggleBtn.classList.remove('collapsed');
        } else {
            filesList.style.display = 'none';
            toggleBtn.classList.add('collapsed');
        }
    }

    loadSavedNotes() {
        const savedNotesJSON = localStorage.getItem('savedNotes');
        if (savedNotesJSON) {
            this.savedNotes = JSON.parse(savedNotesJSON);
        }
        
        // Backward compatibility with previous version
        const oldSavedNote = localStorage.getItem('savedNote');
        if (oldSavedNote && Object.keys(this.savedNotes).length === 0) {
            const noteId = 'note_' + Date.now();
            this.savedNotes[noteId] = {
                content: oldSavedNote,
                title: this.generateTitle(oldSavedNote),
                lastModified: new Date().toISOString()
            };
            localStorage.setItem('savedNotes', JSON.stringify(this.savedNotes));
            localStorage.removeItem('savedNote'); // Remove old format
        }
        
        // Load the most recent note if available
        if (Object.keys(this.savedNotes).length > 0) {
            // Sort by last modified date and get the most recent
            const sortedNotes = Object.entries(this.savedNotes)
                .sort((a, b) => new Date(b[1].lastModified) - new Date(a[1].lastModified));
            
            if (sortedNotes.length > 0) {
                const [noteId, note] = sortedNotes[0];
                this.loadNote(noteId);
            }
        }
    }

    renderSavedFiles() {
        this.savedFilesList.innerHTML = '';
        
        if (Object.keys(this.savedNotes).length === 0) {
            this.savedFilesList.innerHTML = `
                <div class="empty-files-message">No saved notes yet</div>
            `;
            return;
        }
        
        // Sort notes by last modified date (newest first)
        const sortedNotes = Object.entries(this.savedNotes)
            .sort((a, b) => new Date(b[1].lastModified) - new Date(a[1].lastModified));
        
        for (const [noteId, note] of sortedNotes) {
            const isActive = noteId === this.currentNoteId;
            const noteCard = document.createElement('div');
            noteCard.className = `saved-file-card ${isActive ? 'active' : ''}`;
            noteCard.dataset.noteId = noteId;
            
            const formattedDate = this.formatDate(new Date(note.lastModified));
            
            noteCard.innerHTML = `
                <div class="saved-file-title">${note.title || 'Untitled Note'}</div>
                <div class="saved-file-preview">${note.content.substring(0, 120)}</div>
                <div class="saved-file-date">${formattedDate}</div>
                <div class="saved-file-actions">
                    <button class="file-action-btn rename-note" data-note-id="${noteId}">
                        <i class="ri-edit-line"></i>
                    </button>
                    <button class="file-action-btn delete-note" data-note-id="${noteId}">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            `;
            
            noteCard.addEventListener('click', (e) => {
                // Ignore clicks on action buttons
                if (!e.target.closest('.delete-note') && !e.target.closest('.rename-note')) {
                    this.loadNote(noteId);
                }
            });
            
            this.savedFilesList.appendChild(noteCard);
        }
        
        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                const noteId = btn.dataset.noteId;
                this.deleteNote(noteId);
            });
        });

        // Add event listeners for rename buttons
        document.querySelectorAll('.rename-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                const noteId = btn.dataset.noteId;
                this.showRenameDialog(noteId);
            });
        });
    }
    
    showRenameDialog(noteId) {
        const note = this.savedNotes[noteId];
        if (!note) return;
        
        const modal = document.createElement('div');
        modal.className = 'save-modal';
        modal.innerHTML = `
            <div class="save-modal-content rename-modal">
                <h3>Rename Note</h3>
                <input type="text" id="rename-input" value="${note.title || 'Untitled Note'}" 
                    class="rename-input" placeholder="Enter a new name">
                <div class="save-modal-buttons rename-buttons">
                    <button id="modal-rename">Rename</button>
                    <button id="modal-cancel-rename">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus the input field
        const renameInput = document.getElementById('rename-input');
        renameInput.focus();
        renameInput.select();
        
        // Add event listeners
        document.getElementById('modal-rename').addEventListener('click', () => {
            const newTitle = renameInput.value.trim() || 'Untitled Note';
            this.renameNote(noteId, newTitle);
            document.body.removeChild(modal);
        });
        
        document.getElementById('modal-cancel-rename').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Handle Enter key press
        renameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const newTitle = renameInput.value.trim() || 'Untitled Note';
                this.renameNote(noteId, newTitle);
                document.body.removeChild(modal);
            }
        });
    }
    
    renameNote(noteId, newTitle) {
        if (this.savedNotes[noteId]) {
            this.savedNotes[noteId].title = newTitle;
            localStorage.setItem('savedNotes', JSON.stringify(this.savedNotes));
            this.renderSavedFiles();
            this.createToast('Note renamed successfully!');
        }
    }

    formatDate(date) {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        
        if (date.toDateString() === now.toDateString()) {
            return `Today, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        } else {
            return date.toLocaleDateString([], {
                month: 'short', 
                day: 'numeric',
                year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
            });
        }
    }

    generateTitle(content) {
        // Extract first line or first few words as title
        const firstLine = content.split('\n')[0].trim();
        if (firstLine.length > 0) {
            return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
        }
        return 'Untitled Note';
    }

    loadNote(noteId) {
        if (this.hasUnsavedChanges) {
            // Show save dialog before loading another note
            this.showSaveDialog(() => this.doLoadNote(noteId));
            return;
        }
        
        this.doLoadNote(noteId);
    }
    
    doLoadNote(noteId) {
        const note = this.savedNotes[noteId];
        if (note) {
            this.notepad.innerHTML = note.content;
            this.savedContent = note.content;
            this.currentNoteId = noteId;
            this.hasUnsavedChanges = false;
            this.updateStats();
            this.undoStack = [note.content];
            this.redoStack = [];
            
            // Update active state in UI
            this.renderSavedFiles();
        }
    }

    deleteNote(noteId) {
        if (confirm('Are you sure you want to delete this note?')) {
            delete this.savedNotes[noteId];
            localStorage.setItem('savedNotes', JSON.stringify(this.savedNotes));
            
            // If the deleted note was the current note, clear the editor
            if (noteId === this.currentNoteId) {
                this.createNewNote();
            }
            
            this.renderSavedFiles();
        }
    }

    checkForChanges() {
        this.hasUnsavedChanges = this.notepad.innerHTML !== this.savedContent;
    }

    handleToolbarAction(action) {
        switch(action) {
            case 'new':
                this.createNewNote();
                break;
            case 'save':
                this.saveNote();
                break;
            case 'download':
                this.downloadNote();
                break;
            case 'bold':
                document.execCommand('bold', false, null);
                break;
            case 'italic':
                document.execCommand('italic', false, null);
                break;
            case 'underline':
                document.execCommand('underline', false, null);
                break;
            case 'undo':
                this.undo();
                break;
            case 'redo':
                this.redo();
                break;
            case 'fullscreen':
                this.toggleFullscreen();
                break;
        }
    }

    createNewNote() {
        if (this.notepad.innerHTML.trim() !== '' && this.hasUnsavedChanges) {
            this.showSaveDialog(() => this.clearNotepad());
        } else {
            this.clearNotepad();
        }
    }

    showSaveDialog(onComplete = null) {
        const modal = document.createElement('div');
        modal.className = 'save-modal';
        modal.innerHTML = `
            <div class="save-modal-content">
                <h3>Save your work?</h3>
                <p>Your note has unsaved changes. What would you like to do?</p>
                <div class="save-modal-buttons">
                    <button id="modal-save">Save Note</button>
                    <button id="modal-export">Export File</button>
                    <button id="modal-discard">Discard</button>
                    <button id="modal-cancel">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add subtle animation when buttons are pressed
        const buttons = modal.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('mousedown', () => {
                button.style.transform = 'scale(0.98)';
            });
            button.addEventListener('mouseup', () => {
                button.style.transform = '';
            });
        });
        
        document.getElementById('modal-save').addEventListener('click', () => {
            this.saveNote();
            if (onComplete) onComplete();
            document.body.removeChild(modal);
        });
        
        document.getElementById('modal-discard').addEventListener('click', () => {
            if (onComplete) onComplete();
            document.body.removeChild(modal);
        });
        
        document.getElementById('modal-export').addEventListener('click', () => {
            this.downloadNote();
            document.body.removeChild(modal);
        });
        
        document.getElementById('modal-cancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    updateStats() {
        const text = this.notepad.innerText;
        const chars = text.length;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;

        this.charCount.textContent = `${chars} characters`;
        this.wordCount.textContent = `${words} words`;
    }

    clearNotepad() {
        this.notepad.innerHTML = '';
        this.updateStats();
        this.savedContent = '';
        this.hasUnsavedChanges = false;
        this.currentNoteId = null;
    }

    createToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <div class="toast-progress"></div>
        `;
        
        document.body.appendChild(toast);
        
        // Remove toast after animation
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            'success': 'ri-check-line',
            'error': 'ri-error-warning-line',
            'warning': 'ri-alert-line'
        };
        return icons[type] || 'ri-information-line';
    }

    saveNote() {
        const content = this.notepad.innerHTML;
        const title = this.generateTitle(this.notepad.innerText);
        const lastModified = new Date().toISOString();
        
        // Create a new note or update existing one
        if (!this.currentNoteId) {
            this.currentNoteId = 'note_' + Date.now();
        }
        
        this.savedNotes[this.currentNoteId] = {
            content,
            title,
            lastModified
        };
        
        localStorage.setItem('savedNotes', JSON.stringify(this.savedNotes));
        this.savedContent = content;
        this.hasUnsavedChanges = false;
        this.lastSavedState = content;
        
        this.renderSavedFiles();
        this.createToast('Note saved successfully!');
    }

    downloadNote() {
        this.showDownloadFormatDialog().then(fileFormat => {
            if (!fileFormat) return; // User cancelled
            
            // Handle PDF and DOCX differently
            if (fileFormat === 'pdf') {
                this.createPDF();
                return;
            }
            
            if (fileFormat === 'docx') {
                this.createDOCX();
                return;
            }
            
            let mimeType, extension;
            switch(fileFormat) {
                case 'txt':
                    mimeType = 'text/plain';
                    extension = 'txt';
                    break;
                case 'html':
                    mimeType = 'text/html';
                    extension = 'html';
                    break;
                case 'md':
                    mimeType = 'text/markdown';
                    extension = 'md';
                    break;
                case 'rtf':
                    mimeType = 'application/rtf';
                    extension = 'rtf';
                    break;
                default:
                    mimeType = 'text/plain';
                    extension = 'txt';
            }
            
            const content = fileFormat === 'html' ? this.notepad.innerHTML : this.notepad.innerText;
            const blob = new Blob([content], {type: mimeType});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `note.${extension}`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
    
    createPDF() {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Notepad Export</title>
                <style>
                    body { font-family: ${this.notepad.style.fontFamily || 'Arial'}; font-size: ${this.notepad.style.fontSize || '16px'}; }
                </style>
            </head>
            <body>
                <div style="white-space: pre-wrap;">${this.notepad.innerHTML}</div>
            </body>
            </html>
        `;
        
        const blob = new Blob([htmlContent], {type: 'text/html'});
        const url = URL.createObjectURL(blob);
        
        // Use html2pdf library to convert and download
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        document.body.appendChild(script);
        
        script.onload = () => {
            const element = document.createElement('div');
            element.innerHTML = this.notepad.innerHTML;
            document.body.appendChild(element);
            
            const opt = {
                margin: [0.5, 0.5, 0.5, 0.5],
                filename: 'note.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            
            html2pdf().from(element).set(opt).save().then(() => {
                document.body.removeChild(element);
                document.body.removeChild(script);
                this.createToast('PDF downloaded successfully!', 'success');
            });
        };
    }
    
    createDOCX() {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/docx@7.1.0/build/index.js';
        document.body.appendChild(script);
        
        script.onload = () => {
            const { Document, Packer, Paragraph, TextRun } = docx;
            
            const paragraphs = this.notepad.innerText.split('\n').map(line => {
                return new Paragraph({
                    children: [new TextRun(line)]
                });
            });
            
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: paragraphs
                }]
            });
            
            // Generate and download the document
            Packer.toBlob(doc).then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'note.docx';
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(script);
                this.createToast('DOCX downloaded successfully!', 'success');
            });
        };
    }

    showDownloadFormatDialog() {
        const formats = [
            { id: 'txt', name: 'Text (.txt)', icon: 'ri-file-text-line' },
            { id: 'html', name: 'HTML (.html)', icon: 'ri-html5-line' },
            { id: 'md', name: 'Markdown (.md)', icon: 'ri-markdown-line' },
            { id: 'rtf', name: 'Rich Text (.rtf)', icon: 'ri-file-word-line' },
            { id: 'docx', name: 'Word (.docx)', icon: 'ri-file-word-2-line' },
            { id: 'pdf', name: 'PDF (.pdf)', icon: 'ri-file-pdf-line' }
        ];
        
        const modal = document.createElement('div');
        modal.className = 'save-modal';
        modal.innerHTML = `
            <div class="save-modal-content download-format-modal">
                <h3>Choose File Format</h3>
                <div class="format-options horizontal">
                    ${formats.map(format => `
                        <div class="format-option" data-format="${format.id}">
                            <i class="${format.icon}"></i>
                            <span>${format.name}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="save-modal-buttons">
                    <button id="modal-cancel-download">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        return new Promise(resolve => {
            // Add event listeners for format options
            document.querySelectorAll('.format-option').forEach(option => {
                option.addEventListener('click', () => {
                    const format = option.dataset.format;
                    document.body.removeChild(modal);
                    resolve(format);
                });
            });
            
            // Cancel button
            document.getElementById('modal-cancel-download').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });
        });
    }

    undo() {
        if (this.undoStack.length > 1) { 
            this.undoStack.pop(); 
            const previousState = this.undoStack[this.undoStack.length - 1]; 
            
            this.redoStack.push(this.notepad.innerHTML);
            
            this.isUndoRedo = true;
            
            this.notepad.innerHTML = previousState;
            this.updateStats();
            this.checkForChanges();
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            this.undoStack.push(this.notepad.innerHTML);
            
            const nextState = this.redoStack.pop();
            
            this.isUndoRedo = true;
            
            this.notepad.innerHTML = nextState;
            this.updateStats();
            this.checkForChanges();
        }
    }

    toggleFullscreen() {
        const container = document.querySelector('.notepad-container');
        
        if (document.fullscreenElement) {
            document.exitFullscreen();
            this.updateFullscreenButton(false);
        } else {
            container.requestFullscreen().catch(err => {
                this.createToast(`Error: ${err.message}`, 'error');
            });
            this.updateFullscreenButton(true);
        }
    }

    updateFullscreenButton(isFullscreen) {
        const button = document.querySelector('[data-action="fullscreen"]');
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = isFullscreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line';
        }
        
        // Toggle active class
        if (isFullscreen) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }
}

new NotepadApp();
