document.addEventListener('DOMContentLoaded', function() {
    let notes = [];
    if (localStorage.getItem('notes')) {
        notes = JSON.parse(localStorage.getItem('notes'));
    }
    let currentNoteIndex = -1;

    function populateNoteList() {
        const noteList = document.getElementById('note-list');
        noteList.innerHTML = '';
        notes.forEach(function(note, index) {
            const li = document.createElement('li');
            li.textContent = note.title || 'Untitled';
            li.classList.toggle('selected', index === currentNoteIndex);
            li.addEventListener('click', function() {
                loadNote(index);
            });
            noteList.appendChild(li);
        });
    }

    function loadNote(index) {
        currentNoteIndex = index;
        const note = notes[index];
        document.getElementById('note-title').value = note.title || '';
        document.getElementById('note-content').value = note.content || '';
        populateNoteList(); // Update the list to show the selected note
    }

    document.getElementById('new-note-button').addEventListener('click', function() {
        const newNote = { title: '', content: '' };
        notes.push(newNote);
        currentNoteIndex = notes.length - 1;
        document.getElementById('note-title').value = '';
        document.getElementById('note-content').value = '';
        populateNoteList();
    });

    document.getElementById('save-button').addEventListener('click', function() {
        if (currentNoteIndex >= 0) {
            notes[currentNoteIndex].title = document.getElementById('note-title').value;
            notes[currentNoteIndex].content = document.getElementById('note-content').value;
            localStorage.setItem('notes', JSON.stringify(notes));
            populateNoteList();
            alert('Note saved!');
        } else {
            alert('Please select a note to save.');
        }
    });

    document.getElementById('delete-button').addEventListener('click', function() {
        if (currentNoteIndex >= 0) {
            notes.splice(currentNoteIndex, 1);
            localStorage.setItem('notes', JSON.stringify(notes));
            populateNoteList();
            document.getElementById('note-title').value = '';
            document.getElementById('note-content').value = '';
            currentNoteIndex = -1;
        } else {
            alert('Please select a note to delete.');
        }
    });

    // Initial population of the note list and load the first note if available
    populateNoteList();
    if (notes.length > 0) {
        loadNote(0);
    }
});
