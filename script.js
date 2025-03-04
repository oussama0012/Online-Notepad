document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const boldBtn = document.getElementById('bold-btn');
    const italicBtn = document.getElementById('italic-btn');
    const underlineBtn = document.getElementById('underline-btn');
    const strikeBtn = document.getElementById('strike-btn');
    const listUlBtn = document.getElementById('list-ul-btn');
    const listOlBtn = document.getElementById('list-ol-btn');
    const linkBtn = document.getElementById('link-btn');
    const imageBtn = document.getElementById('image-btn');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const darkModeBtn = document.getElementById('dark-mode-btn');

    // Formatting Functions
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

    undoBtn.addEventListener('click', () => document.execCommand('undo', false, null));
    redoBtn.addEventListener('click', () => document.execCommand('redo', false, null));

    // Dark Mode Toggle
    darkModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        darkModeBtn.innerHTML = document.body.classList.contains('dark-mode') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    // Save Content to Local Storage
    editor.addEventListener('input', () => {
        localStorage.setItem('noteContent', editor.innerHTML);
    });

    // Load Saved Content
    const savedContent = localStorage.getItem('noteContent');
    if (savedContent) {
        editor.innerHTML = savedContent;
    }
});
