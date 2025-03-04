// DOM Elements
const editor = document.getElementById('editor');
const notesList = document.getElementById('notesList');
const btnNewNote = document.getElementById('btnNewNote');
const btnSave = document.getElementById('btnSave');
const newNoteModal = document.getElementById('newNoteModal');
const noteTitle = document.getElementById('noteTitle');
const btnCancelNote = document.getElementById('btnCancelNote');
const btnCreateNote = document.getElementById('btnCreateNote');
const wordCount = document.getElementById('wordCount');
const savedStatus = document.getElementById('savedStatus');
const currentTime = document.getElementById('currentTime');
const fontSelect = document.getElementById('fontSelect');
const fontSizeSelect = document.getElementById('fontSizeSelect');
const saveIndicator = document.getElementById('saveIndicator');
const toolbarButtons = document.querySelectorAll('.toolbar-btn');
const btnSettings = document.getElementById('btnSettings');
const settingsDropdown = document.getElementById('settingsDropdown');
const btnToggleDarkMode = document.getElementById('btnToggleDarkMode');
const btnExportNotes = document.getElementById('btnExportNotes');
const btnImportNotes = document.getElementById('btnImportNotes');

// Initial variables
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let currentNoteId = null;
let isSaved = true;

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Update the current time
function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    currentTime.textContent = `${hours}:${minutes}:${seconds}`;
}

// Update word count
function updateWordCount() {
    const text = editor.innerText.trim();
    const words = text ? text.split(/\s+/).length : 0;
    wordCount.textContent = `Words: ${words}`;
}

// Render the notes list
function renderNotesList() {
    notesList.innerHTML = '';

    if (notes.length === 0) {
        notesList.innerHTML = '<div class="note-item">No notes yet. Create one!</div>';
        return;
    }

    notes.sort((a, b) => b.updatedAt - a.updatedAt);

    notes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = `note-item ${note.id === currentNoteId ? 'active' : ''}`;
        noteItem.dataset.id = note.id;

        const noteDate = new Date(note.updatedAt);
        const formattedDate = noteDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
        });

        noteItem.innerHTML = `
            <div class="note-title">${note.title}</div>
            <div class="note-preview">${note.content.replace(/<[^>]*>/g, '').substring(0, 60)}</div>
            <div class="note-meta">${formattedDate}</div>
            <button class="btn-delete" data-id="${note.id}">🗑️</button>
        `;

        noteItem.addEventListener('click', () => {
            if (currentNoteId && !isSaved) {
                if (confirm('You have unsaved changes. Do you want to save them before switching notes?')) {
                    saveCurrentNote();
                }
            }

            loadNote(note.id);
        });

        // Add delete button functionality
        const deleteButton = noteItem.querySelector('.btn-delete');
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent note item click event
            deleteNote(note.id);
        });

        notesList.appendChild(noteItem);
    });
}

// Load a note into the editor
function loadNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    currentNoteId = note.id;
    editor.innerHTML = note.content;

    // Mark all note items as inactive and the current one as active
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === noteId);
    });

    isSaved = true;
    updateSavedStatus();
    updateWordCount();
}

// Create a new note
function createNewNote(title) {
    const newNote = {
        id: generateId(),
        title,
        content: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    notes.unshift(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));

    renderNotesList();
    loadNote(newNote.id);
}

// Save the current note
function saveCurrentNote() {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    note.content = editor.innerHTML;
    note.updatedAt = Date.now();

    localStorage.setItem('notes', JSON.stringify(notes));

    isSaved = true;
    updateSavedStatus();
    renderNotesList();

    // Show save indicator
    saveIndicator.style.display = 'block';
    setTimeout(() => {
        saveIndicator.style.display = 'none';
    }, 2000);
}

// Delete a note
function deleteNote(noteId) {
    notes = notes.filter(note => note.id !== noteId);
    localStorage.setItem('notes', JSON.stringify(notes));

    if (currentNoteId === noteId) {
        currentNoteId = null;
        editor.innerHTML = '';
        updateWordCount();
    }

    renderNotesList();
}

// Update saved status
function updateSavedStatus() {
    savedStatus.textContent = isSaved ? 'Saved' : 'Unsaved';
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Export notes as JSON
function exportNotes() {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'notespace-notes.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Import notes from JSON
function importNotes(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const importedNotes = JSON.parse(e.target.result);
        notes = importedNotes;
        localStorage.setItem('notes', JSON.stringify(notes));
        renderNotesList();
        if (notes.length > 0) loadNote(notes[0].id);
    };
    reader.readAsText(file);
}

// Event Listeners
editor.addEventListener('input', () => {
    isSaved = false;
    updateSavedStatus();
    updateWordCount();
});

btnNewNote.addEventListener('click', () => {
    newNoteModal.style.display = 'flex';
    noteTitle.focus();
});

btnSave.addEventListener('click', saveCurrentNote);

btnCancelNote.addEventListener('click', () => {
    newNoteModal.style.display = 'none';
    noteTitle.value = '';
});

btnCreateNote.addEventListener('click', () => {
    const title = noteTitle.value.trim();
    if (!title) {
        alert('Please enter a note title');
        return;
    }

    createNewNote(title);
    newNoteModal.style.display = 'none';
    noteTitle.value = '';
});

// Modal outside click to close
window.addEventListener('click', (e) => {
    if (e.target === newNoteModal) {
        newNoteModal.style.display = 'none';
    }
});

// Handle formatting buttons
toolbarButtons.forEach(button => {
    button.addEventListener('click', () => {
        const command = button.dataset.command;

        if (command === 'createLink') {
            const url = prompt('Enter the URL');
            if (url) document.execCommand(command, false, url);
        } else {
            document.execCommand(command, false, null);
        }

        editor.focus();
        isSaved = false;
        updateSavedStatus();
    });
});

// Handle font changes
fontSelect.addEventListener('change', () => {
    document.execCommand('fontName', false, fontSelect.value);
    editor.focus();
    isSaved = false;
    updateSavedStatus();
});

fontSizeSelect.addEventListener('change', () => {
    editor.style.fontSize = fontSizeSelect.value;
    editor.focus();
    isSaved = false;
    updateSavedStatus();
});

// Auto-save timer (every 60 seconds)
setInterval(() => {
    if (!isSaved && currentNoteId) {
        saveCurrentNote();
    }
}, 60000);

// Update time display
setInterval(updateCurrentTime, 1000);

// Toggle settings dropdown
btnSettings.addEventListener('click', () => {
    settingsDropdown.style.display = settingsDropdown.style.display === 'block' ? 'none' : 'block';
});

// Toggle dark mode
btnToggleDarkMode.addEventListener('click', toggleDarkMode);

// Export notes
btnExportNotes.addEventListener('click', exportNotes);

// Import notes
btnImportNotes.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.addEventListener('change', importNotes);
    fileInput.click();
});

// Initialize
renderNotesList();
updateCurrentTime();

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// If there are notes, load the first one
if (notes.length > 0) {
    loadNote(notes[0].id);
}

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveCurrentNote();
    }

    // Ctrl+N for new note
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        btnNewNote.click();
    }
});
