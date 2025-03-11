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
        this.undoStack = [];
        this.redoStack = [];
        this.lastSavedState = '';
        this.isUndoRedo = false;
        this.currentNoteId = null;
        this.savedNotes = {};

        // Convert textarea to contenteditable div for rich text support
        this.setupRichTextEditor();
        this.setupEventListeners();
        this.loadSavedNotes();
        this.renderSavedFiles();
        
        // Initialize toggle button as collapsed
        this.toggleSavedFilesBtn.classList.add('collapsed');
    }

    setupRichTextEditor() {
        // Create a contenteditable div to replace the textarea
        const textareaParent = this.notepad.parentNode;
        const editorDiv = document.createElement('div');
        editorDiv.setAttribute('contenteditable', 'true');
        editorDiv.setAttribute('id', 'rich-notepad');
        editorDiv.className = this.notepad.className;
        editorDiv.style.minHeight = '200px';
        editorDiv.style.overflow = 'auto';
        editorDiv.style.outline = 'none';
        editorDiv.style.whiteSpace = 'pre-wrap';
        
        // Replace textarea with contenteditable div
        textareaParent.replaceChild(editorDiv, this.notepad);
        this.notepad = editorDiv;
        
        // Setup initial undo state
        this.undoStack.push(this.notepad.innerHTML);
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
        
        // Important: Store selection state when clicking outside the editor
        document.addEventListener('mouseup', () => {
            if (window.getSelection && window.getSelection().rangeCount > 0) {
                const selection = window.getSelection();
                if (this.notepad.contains(selection.anchorNode)) {
                    this.lastSelection = {
                        startOffset: selection.anchorOffset,
                        endOffset: selection.focusOffset,
                        startNode: selection.anchorNode,
                        endNode: selection.focusNode
                    };
                }
            }
        });
        
        this.toolbarBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleToolbarAction(btn.dataset.action));
        });

        this.colorPicker.addEventListener('change', (e) => {
            this.applyFormatting('foreColor', e.target.value);
        });
        
        this.fontSelector.addEventListener('change', (e) => {
            this.applyFormatting('fontName', e.target.value);
        });
        
        this.fontSizeSelector.addEventListener('change', (e) => {
            // Convert px value to font size (1-7)
            const sizeValue = parseInt(e.target.value);
            
            // Map pixel values to fontSize command values (1-7)
            let fontSizeValue;
            if (sizeValue <= 10) fontSizeValue = 1;
            else if (sizeValue <= 13) fontSizeValue = 2;
            else if (sizeValue <= 16) fontSizeValue = 3;
            else if (sizeValue <= 18) fontSizeValue = 4;
            else if (sizeValue <= 24) fontSizeValue = 5;
            else if (sizeValue <= 32) fontSizeValue = 6;
            else fontSizeValue = 7;
            
            this.applyFormatting('fontSize', fontSizeValue);
        });

        this.toggleSavedFilesBtn.addEventListener('click', () => {
            this.toggleSavedFilesPanel();
        });
        
        // Add support for keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.handleToolbarAction('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.handleToolbarAction('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.handleToolbarAction('underline');
                        break;
                    case 's':
                        e.preventDefault();
                        this.handleToolbarAction('save');
                        break;
                    case 'z':
                        e.preventDefault();
                        this.handleToolbarAction('undo');
                        break;
                    case 'y':
                        e.preventDefault();
                        this.handleToolbarAction('redo');
                        break;
                }
            }
        });
    }

    toggleSavedFilesPanel() {
        const filesList = this.savedFilesList;
        const toggleBtn = this.toggleSavedFilesBtn;
        
        if (filesList.style.display === 'none') {
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
            
            // Extract text content for preview, stripping HTML tags
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = note.content;
            const textContent = tempDiv.textContent || tempDiv.innerText || '';
            
            noteCard.innerHTML = `
                <div class="saved-file-title">${note.title || 'Untitled Note'}</div>
                <div class="saved-file-preview">${textContent.substring(0, 120)}</div>
                <div class="saved-file-date">${formattedDate}</div>
                <div class="saved-file-actions">
                    <button class="file-action-btn delete-note" data-note-id="${noteId}">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            `;
            
            noteCard.addEventListener('click', (e) => {
                // Ignore clicks on the delete button
                if (!e.target.closest('.delete-note')) {
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
        // For HTML content, extract just the text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        const firstLine = textContent.split('\n')[0].trim();
        
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
            
            // Reset undo/redo stacks but keep the current state
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
                this.applyFormatting('bold');
                break;
            case 'italic':
                this.applyFormatting('italic');
                break;
            case 'underline':
                this.applyFormatting('underline');
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

    applyFormatting(command, value = null) {
        // Focus on the editor to ensure commands apply properly
        this.notepad.focus();
        
        // Check if there's a selection
        const selection = window.getSelection();
        const hasSelection = selection.toString().length > 0;
        
        // If there's no selection, try to use last known selection
        if (!hasSelection && this.lastSelection) {
            try {
                const range = document.createRange();
                range.setStart(this.lastSelection.startNode, this.lastSelection.startOffset);
                range.setEnd(this.lastSelection.endNode, this.lastSelection.endOffset);
                selection.removeAllRanges();
                selection.addRange(range);
            } catch (e) {
                console.log("Couldn't restore selection");
            }
        }
        
        // Apply the formatting command
        document.execCommand(command, false, value);
        
        // After applying formatting, save to the undo stack
        if (!this.isUndoRedo) {
            this.undoStack.push(this.notepad.innerHTML);
            this.redoStack = [];
        }
        
        // Update formatting button states
        this.updateFormatButtonStates();
        
        // Check for changes
        this.checkForChanges();
    }
    
    updateFormatButtonStates() {
        // Update button active states based on current selection format
        const isBold = document.queryCommandState('bold');
        const isItalic = document.queryCommandState('italic');
        const isUnderline = document.queryCommandState('underline');
        
        const boldBtn = document.querySelector('[data-action="bold"]');
        const italicBtn = document.querySelector('[data-action="italic"]');
        const underlineBtn = document.querySelector('[data-action="underline"]');
        
        if (boldBtn) boldBtn.classList.toggle('active', isBold);
        if (italicBtn) italicBtn.classList.toggle('active', isItalic);
        if (underlineBtn) underlineBtn.classList.toggle('active', isUnderline);
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
        // Get text without HTML tags for counting
        const textContent = this.notepad.textContent || this.notepad.innerText || '';
        const chars = textContent.length;
        const words = textContent.trim().split(/\s+/).filter(word => word.length > 0).length;

        this.charCount.textContent = `${chars} characters`;
        this.wordCount.textContent = `${words} words`;
    }

    clearNotepad() {
        this.notepad.innerHTML = '';
        this.updateStats();
        this.savedContent = '';
        this.hasUnsavedChanges = false;
        this.currentNoteId = null;
        
        // Reset undo/redo stacks but keep the empty state
        this.undoStack = [''];
        this.redoStack = [];
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
        const title = this.generateTitle(content);
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
        // For HTML content, offer option to download as HTML or plain text
        const htmlContent = this.notepad.innerHTML;
        const textContent = this.notepad.textContent || this.notepad.innerText || '';
        
        // Create HTML blob
        const blob = new Blob([htmlContent], {type: 'text/html'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'note.html';
        a.click();
        URL.revokeObjectURL(url);
        
        // Also offer plain text option
        const textBlob = new Blob([textContent], {type: 'text/plain'});
        const textUrl = URL.createObjectURL(textBlob);
        const textA = document.createElement('a');
        textA.href = textUrl;
        textA.download = 'note.txt';
        
        // Show option dialog
        const modal = document.createElement('div');
        modal.className = 'download-modal';
        modal.innerHTML = `
            <div class="download-modal-content">
                <h3>Download Format</h3>
                <p>Choose a format to download:</p>
                <div class="download-modal-buttons">
                    <button id="download-html">HTML (with formatting)</button>
                    <button id="download-text">Plain Text</button>
                    <button id="download-cancel">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('download-html').addEventListener('click', () => {
            a.click();
            document.body.removeChild(modal);
        });
        
        document.getElementById('download-text').addEventListener('click', () => {
            textA.click();
            document.body.removeChild(modal);
        });
        
        document.getElementById('download-cancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    undo() {
        // Check if undo stack has more than one item (keep at least initial state)
        if (this.undoStack.length > 1) {
            // Save current state to redo stack
            this.redoStack.push(this.notepad.innerHTML);
            
            // Remove current state from undo stack
            this.undoStack.pop();
            
            // Get previous state
            const previousState = this.undoStack[this.undoStack.length - 1];
            
            // Set the flag to prevent adding to undo stack
            this.isUndoRedo = true;
            
            // Apply the previous state
            this.notepad.innerHTML = previousState;
            this.updateStats();
            this.checkForChanges();
            
            // Feedback to user
            this.createToast('Undo successful', 'info');
        } else {
            this.createToast('Nothing to undo', 'info');
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            // Get next state from redo stack
            const nextState = this.redoStack.pop();
            
            // Save current state to undo stack
            this.undoStack.push(nextState);
            
            // Set the flag to prevent adding to undo stack
            this.isUndoRedo = true;
            
            // Apply the next state
            this.notepad.innerHTML = nextState;
            this.updateStats();
            this.checkForChanges();
            
            // Feedback to user
            this.createToast('Redo successful', 'info');
        } else {
            this.createToast('Nothing to redo', 'info');
        }
    }

    toggleFullscreen() {
        const container = document.querySelector('.notepad-container');
        
        // Use fullscreenElement to check if already in fullscreen
        if (document.fullscreenElement) {
            // Exit fullscreen
            document.exitFullscreen()
              .then(() => {
                  this.updateFullscreenButton(false);
              })
              .catch(err => {
                  this.createToast(`Error exiting fullscreen: ${err.message}`, 'error');
              });
        } else {
            // Alternative approach using iframe for browser-only fullscreen
            if (!this.fullscreenFrame) {
                // Create fullscreen container
                const fullscreenContainer = document.createElement('div');
                fullscreenContainer.className = 'browser-fullscreen';
                fullscreenContainer.style.position = 'fixed';
                fullscreenContainer.style.top = '0';
                fullscreenContainer.style.left = '0';
                fullscreenContainer.style.width = '100%';
                fullscreenContainer.style.height = '100%';
                fullscreenContainer.style.backgroundColor = 'var(--bg-primary)';
                fullscreenContainer.style.zIndex = '9999';
                fullscreenContainer.style.display = 'flex';
                fullscreenContainer.style.flexDirection = 'column';
                
                // Clone the toolbar and editor
                const toolbar = document.querySelector('.toolbar').cloneNode(true);
                const editor = this.notepad.cloneNode(true);
                editor.style.flex = '1';
                editor.style.height = 'auto';
                
                // Add exit button
                const exitBtn = document.createElement('button');
                exitBtn.className = 'toolbar-btn';
                exitBtn.innerHTML = '<i class="ri-fullscreen-exit-line"></i> Exit Fullscreen';
                exitBtn.style.marginLeft = 'auto';
                exitBtn.onclick = () => this.exitBrowserFullscreen();
                
                toolbar.appendChild(exitBtn);
                fullscreenContainer.appendChild(toolbar);
                fullscreenContainer.appendChild(editor);
                
                document.body.appendChild(fullscreenContainer);
                this.fullscreenFrame = fullscreenContainer;
                this.fullscreenEditor = editor;
                
                // Sync content
                this.fullscreenEditor.innerHTML = this.notepad.innerHTML;
                
                // Setup events for fullscreen editor
                this.fullscreenEditor.addEventListener('input', () => {
                    this.notepad.innerHTML = this.fullscreenEditor.innerHTML;
                    if (!this.isUndoRedo) {
                        this.undoStack.push(this.notepad.innerHTML);
                        this.redoStack = [];
                    }
                    this.isUndoRedo = false;
                    this.updateStats();
                    this.checkForChanges();
                });
                
                // Setup toolbar buttons
                const fullscreenToolbarBtns = this.fullscreenFrame.querySelectorAll('.toolbar-btn');
                fullscreenToolbarBtns.forEach(btn => {
                    if (btn.dataset.action) {
                        btn.addEventListener('click', () => {
                            // Special handling for fullscreen button
                            if (btn.dataset.action === 'fullscreen') {
                                this.exitBrowserFullscreen();
                            } else {
                                this.handleToolbarAction(btn.dataset.action);
                                // Sync content after action
                                this.fullscreenEditor.innerHTML = this.notepad.innerHTML;
                            }
                        });
                    }
                });
                
                // Focus the editor
                this.fullscreenEditor.focus();
                
                this.updateFullscreenButton(true);
            }
        }
    }
    
    exitBrowserFullscreen() {
        if (this.fullscreenFrame) {
            // Sync content back to main editor
            this.notepad.innerHTML = this.fullscreenEditor.innerHTML;
            
            // Remove the fullscreen frame
            document.body.removeChild(this.fullscreenFrame);
            this.fullscreenFrame = null;
            this.fullscreenEditor = null;
            
            this.updateFullscreenButton(false);
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

// Add missing CSS for browser fullscreen mode
const style = document.createElement('style');
style.textContent = `
.browser-fullscreen .toolbar {
    padding: 10px;
    display: flex;
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
}

.browser-fullscreen [contenteditable="true"] {
    padding: 15px;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    background-color: var(--bg-primary);
    border: none;
    resize: none;
    width: 100%;
    box-sizing: border-box;
}

/* Added styles for font size display */
[style*="font-size"] {
    line-height: 1.4;
}
`;
document.head.appendChild(style);

new NotepadApp();
