import {
    debounce
} from 'lodash';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Quill editor
    const quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: {
                container: '#toolbar',
                handlers: {
                    'image': imageHandler
                }
            },
        }
    });

    // Custom Image Handler
    function imageHandler() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = () => {
            const file = input.files[0];

            if (/^image\//.test(file.type)) {
                saveToServer(file);
            } else {
                console.warn('You could only upload images.');
            }
        }
    }

    /**
     * Step2. save to server
     *
     * @param {File} image
     */
    function saveToServer(image) {
        const fd = new FormData();
        fd.append('image', image);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://api.imgbb.com/1/upload?key=YOUR_API_KEY', true); // Change to your image upload API endpoint
        xhr.onload = () => {
            if (xhr.status === 200) {
                // this is callback data: url
                const url = JSON.parse(xhr.responseText).data.url;
                insertToEditor(url);
            }
        }
        xhr.send(fd);
    }

    /**
     * Step3. insert image url to rich editor.
     *
     * @param {string} url
     */
    function insertToEditor(url) {
        // push image url to rich editor.
        const range = quill.getSelection();
        quill.insertEmbed(range.index, 'image', url);
    }

    let currentFile = null;
    let files = JSON.parse(localStorage.getItem('files') || '{}');

    const fileList = document.getElementById('fileList');
    const newFileBtn = document.getElementById('newFileBtn');
    const openFileBtn = document.getElementById('openFileBtn');
    const saveFileBtn = document.getElementById('saveFileBtn');
    const exportFileBtn = document.getElementById('exportFileBtn');
    const deleteFileBtn = document.getElementById('deleteFileBtn');
    const renameFileBtn = document.getElementById('renameFileBtn');
    const wordCount = document.getElementById('wordCount');
    const charCount = document.getElementById('charCount');

    // Get the modal
    const modal = document.createElement('div');
    modal.id = "myModal";
    modal.classList.add("modal");
    modal.innerHTML = `
    <div class="modal-content">
        <span class="close">&times;</span>
        <p>Some text in the Modal..</p>
    </div>
    `;
    document.body.appendChild(modal);

    // Get the <span> element that closes the modal
    const modalSpan = document.querySelector('.close');

    const showModal = (content) => {
        modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            ${content}
        </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = "block";

        // Get the <span> element that closes the modal
        const span = document.querySelector('.close');
        span.onclick = function() {
            modal.style.display = "none";
        }

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    }

    // When the user clicks on <span> (x), close the modal
    modalSpan.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Function to update word and character count
    const updateWordCount = () => {
        const text = quill.getText();
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const characters = text.length;

        wordCount.textContent = `Words: ${words}`;
        charCount.textContent = `Characters: ${characters}`;
    };

    // Autosave
    const saveContent = () => {
        if (currentFile) {
            files[currentFile] = quill.getContents();
            localStorage.setItem('files', JSON.stringify(files));
            console.log(`Saved ${currentFile}`);
        }
    };

    //Debounce saves
    const debouncedSave = debounce(saveContent, 1000);

    quill.on('text-change', function() {
        updateWordCount();
        debouncedSave();
    });

    // File Management Functions
    const createFile = () => {
        let modalContent = `
            <h2>New File</h2>
            <input type="text" id="newFileName" class="modal-input" placeholder="Enter file name" />
            <div class="modal-buttons">
                <button class="confirm" onclick="handleCreateFile()">Create</button>
                <button class="cancel" onclick="closeModal()">Cancel</button>
            </div>
        `;
        showModal(modalContent);
    };

    window.handleCreateFile = () => {
        const fileName = document.getElementById('newFileName').value;
        if (fileName) {
            currentFile = fileName;
            files[currentFile] = {
                ops: [{
                    insert: '\n'
                }]
            }; // Initialize with empty content
            localStorage.setItem('files', JSON.stringify(files));
            loadFiles();
            loadContent(currentFile);
            modal.style.display = "none";
        } else {
            alert('Please enter a file name.');
        }
    };

    window.closeModal = () => {
        modal.style.display = "none";
    };

    const openFile = () => {
        let modalContent = `
            <h2>Open File</h2>
            <input type="text" id="openFileName" class="modal-input" placeholder="Enter file name to open" />
            <div class="modal-buttons">
                <button class="confirm" onclick="handleOpenFile()">Open</button>
                <button class="cancel" onclick="closeModal()">Cancel</button>
            </div>
        `;
        showModal(modalContent);
    };

    window.handleOpenFile = () => {
        const fileName = document.getElementById('openFileName').value;
        if (fileName && files[fileName]) {
            currentFile = fileName;
            loadContent(currentFile);
            modal.style.display = "none";
        } else {
            let modalContent = `
                <div class="flex flex-col items-center justify-center p-6">
                    <svg class="w-12 h-12 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Warning</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">File not found.</p>
                    <button class="confirm bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick="closeModal()">OK</button>
                </div>
            `;
            showModal(modalContent);
        }
    };

    const renameFile = () => {
        if (currentFile) {
            let modalContent = `
                <h2>Rename File</h2>
                <input type="text" id="newFileName" class="modal-input" placeholder="Enter new file name" value="${currentFile}" />
                <div class="modal-buttons">
                    <button class="confirm" onclick="handleRenameFile()">Rename</button>
                    <button class="cancel" onclick="closeModal()">Cancel</button>
                </div>
            `;
            showModal(modalContent);
        } else {
            let modalContent = `
                <div class="flex flex-col items-center justify-center p-6">
                    <svg class="w-12 h-12 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Warning</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">No file selected to rename.</p>
                    <button class="confirm bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick="closeModal()">OK</button>
                </div>
            `;
            showModal(modalContent);
        }
    };

    window.handleRenameFile = () => {
        const newFileName = document.getElementById('newFileName').value;
        if (newFileName && newFileName !== currentFile) {
            // Rename file logic
            files[newFileName] = files[currentFile];
            delete files[currentFile];
            localStorage.setItem('files', JSON.stringify(files));
            currentFile = newFileName;
            loadFiles();
            loadContent(currentFile);
            modal.style.display = "none";
        } else {
            alert('Please enter a different file name.');
        }
    };

    const saveFile = () => {
        let modalContent = `
            <h2>Save File</h2>
            <p>Do you want to save the current file?</p>
            <div class="modal-buttons">
                <button class="confirm" onclick="handleSaveFile()">Yes</button>
                <button class="cancel" onclick="closeModal()">No</button>
            </div>
        `;
        showModal(modalContent);
    };

    window.handleSaveFile = () => {
        if (currentFile) {
            files[currentFile] = quill.getContents();
            localStorage.setItem('files', JSON.stringify(files));
            let modalContent = `
                <div class="flex flex-col items-center justify-center p-6">
                    <svg class="w-12 h-12 text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Success</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">File saved!</p>
                    <button class="confirm bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" onclick="closeModal()">OK</button>
                </div>
            `;
            showModal(modalContent);
        } else {
            let modalContent = `
                <div class="flex flex-col items-center justify-center p-6">
                    <svg class="w-12 h-12 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Warning</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">No file currently open.</p>
                    <button class="confirm bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick="closeModal()">OK</button>
                </div>
            `;
            showModal(modalContent);
        }
    };

    const exportFile = () => {
        if (!currentFile) {
            let modalContent = `
                <div class="flex flex-col items-center justify-center p-6">
                    <svg class="w-12 h-12 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Warning</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">No file is open to export.</p>
                    <button class="confirm bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick="closeModal()">OK</button>
                </div>
            `;
            showModal(modalContent);
            return;
        }

        let modalContent = `
            <h2>Export File</h2>
            <div class="export-grid">
                <div class="export-option" onclick="handleExportFile('txt')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.5 1.5 0 010 2.966l-5.607-.857a.75.75 0 00-.794.65V15a.75.75 0 00.75.75h2.25a.75.75 0 010 1.5h-2.25a2.25 2.25 0 01-2.25-2.25v-1.9c0-.343.262-.629.599-.643l5.607-.857a1.5 1.5 0 011.277-.428zm-7.012-2.4a.75.75 0 01.743.75v3.75a.75.75 0 01-1.5 0V8.667a3.001 3.001 0 013-3h2.25a.75.75 0 010 1.5H9.75a1.5 1.5 0 00-1.5 1.5z" clip-rule="evenodd" />
                    </svg>
                    .txt
                </div>
                <div class="export-option" onclick="handleExportFile('md')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.5 1.5 0 010 2.966l-5.607-.857a.75.75 0 00-.794.65V15a.75.75 0 00.75.75h2.25a.75.75 0 010 1.5h-2.25a2.25 2.25 0 01-2.25-2.25v-1.9c0-.343.262-.629.599-.643l5.607-.857a1.5 1.5 0 011.277-.428zm-7.012-2.4a.75.75 0 01.743.75v3.75a.75.75 0 01-1.5 0V8.667a3.001 3.001 0 013-3h2.25a.75.75 0 010 1.5H9.75a1.5 1.5 0 00-1.5 1.5z" clip-rule="evenodd" />
                    </svg>
                    .md
                </div>
                <div class="export-option" onclick="handleExportFile('html')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.447 1.54A.75.75 0 003 8.285V15.714A.75.75 0 004.447 22.46l7.26-4.063a.75.75 0 000-6.794l-7.26-4.062zM7.5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.74 5.56a.75.75 0 00-1.447.862L18 11.203l-2.707 4.781a.75.75 0 001.447.862l2.707-4.781 2.707-4.781a.75.75 0 00-.75-1.295h-4.667z" />
                    </svg>
                    .html
                </div>
                <div class="export-option" onclick="handleExportFile('json')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.5 2.25a3 3 0 00-3 3v13.5a3 3 0 003 3h15a3 3 0 003-3V5.25a3 3 0 00-3-3H4.5zM6 7.5a.75.75 0 01.75-.75h9a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-9a.75.75 0 01-.75-.75V7.5zm0 4.5a.75.75 0 01.75-.75h5.25a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75v-1.5zm0 4.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-1.5z" />
                    </svg>
                    .json
                </div>
                <div class="export-option" onclick="handleExportFile('pdf')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V3.375c0-1.036-.84-1.875-1.875-1.875H5.625zM4.5 5.625h15a.375.375 0 01.375.375v2.25a.375.375 0 01-.375.375H4.5a.375.375 0 01-.375-.375V6a.375.375 0 01.375-.375zM4.5 12h9.75a.375.375 0 01.375.375v2.25a.375.375 0 01-.375.375H4.5a.375.375 0 01-.375-.375v-2.25a.375.375 0 01.375-.375zM4.5 17.25h9.75a.375.375 0 01.375.375v2.25a.375.375 0 01-.375.375H4.5a.375.375 0 01-.375-.375v-2.25a.375.375 0 01.375-.375z" />
                    </svg>
                    .pdf
                </div>
                <div class="export-option" onclick="handleExportFile('docx')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 2.25a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V3a.75.75 0 01.75-.75h1.5zm-9 0a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V3a.75.75 0 01.75-.75h1.5zm12.75 7.5a.75.75 0 000-1.5h-9a.75.75 0 000 1.5h9zM7.5 9.75a.75.75 0 01.75-.75h9a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-9a.75.75 0 01-.75-.75v-1.5zm9 4.5a.75.75 0 000-1.5h-9a.75.75 0 000 1.5h9zM7.5 16.5a.75.75 0 01.75-.75h9a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-9a.75.75 0 01-.75-.75v-1.5zM6 5.25a3 3 0 013-3h6a3 3 0 013 3v13.5a3 3 0 01-3 3H9a3 3 0 01-3-3V5.25z" />
                    </svg>
                    .docx
                </div>
            </div>
        `;
        showModal(modalContent);
    };

    window.handleExportFile = (exportType) => {
        const content = quill.getText();

        if (exportType === 'txt') {
            downloadFile(currentFile + '.txt', content, 'text/plain');
        } else if (exportType === 'md') {
            //Basic Markdown conversion (you can improve this)
            const markdownContent = content.replace(/^# (.*$)/gim, '# $1\n').replace(/^## (.*$)/gim, '## $1\n').replace(/^### (.*$)/gim, '### $1\n').replace(/\*\*(.*)\*\*/gim, '**$1**').replace(/\*(.*)\*/gim, '*$1*');
            downloadFile(currentFile + '.md', markdownContent, 'text/markdown');
        } else if (exportType === 'html') {
            const htmlContent = `<!DOCTYPE html><html><head><title>${currentFile}</title></head><body><div id="content">${quill.root.innerHTML}</div></body></html>`;
            downloadFile(currentFile + '.html', htmlContent, 'text/html');
        } else if (exportType === 'json') {
            const jsonContent = JSON.stringify(quill.getContents());
            downloadFile(currentFile + '.json', jsonContent, 'application/json');
        } else if (exportType === 'pdf') {
            exportToPDF(currentFile, quill.getContents());
        } else if (exportType === 'docx') {
             alert('Exporting to docx is not yet implemented.');
        } else {
            alert('Invalid export type.');
        }
        modal.style.display = "none";
    };

    const deleteFile = () => {
        if (currentFile) {
            let modalContent = `
                <h2>Delete File</h2>
                <p>Are you sure you want to delete ${currentFile}?</p>
                <div class="modal-buttons">
                    <button class="confirm" onclick="handleDeleteFile()">Delete</button>
                    <button class="cancel" onclick="closeModal()">Cancel</button>
                </div>
            `;
            showModal(modalContent);
        } else {
            let modalContent = `
                <div class="flex flex-col items-center justify-center p-6">
                    <svg class="w-12 h-12 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Warning</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">No file selected to delete.</p>
                    <button class="confirm bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick="closeModal()">OK</button>
                </div>
            `;
            showModal(modalContent);
        }
    };

    window.handleDeleteFile = () => {
        if (currentFile) {
            delete files[currentFile];
            localStorage.setItem('files', JSON.stringify(files));
            currentFile = null;
            quill.setContents([{
                insert: '\n'
            }]); // Clear editor
            loadFiles();
            modal.style.display = "none";
        }
    };

    const downloadFile = (filename, content, contentType) => {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:' + contentType + ';charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const exportToPDF = (filename, content) => {
        const docDefinition = {
            content: [{
                text: filename,
                style: 'header'
            }, {
                text: quill.getText()
            }],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true
                }
            }
        };

        pdfMake.createPdf(docDefinition).download(filename + '.pdf');
    };

    const loadContent = (fileName) => {
        if (files[fileName]) {
            quill.setContents(files[fileName]);
            currentFile = fileName;

             // Update active state in file list
             document.querySelectorAll('#fileList li').forEach(item => item.classList.remove('active'));
             const activeListItem = Array.from(fileList.children).find(item => item.textContent === fileName);
             if (activeListItem) {
                 activeListItem.classList.add('active');
             }
        }
        updateWordCount();
    };

    const loadFiles = () => {
        fileList.innerHTML = '';
        for (const file in files) {
            const listItem = document.createElement('li');
            listItem.textContent = file;
            listItem.addEventListener('click', () => {
                loadContent(file);
                // Remove 'active' class from all list items
                document.querySelectorAll('#fileList li').forEach(item => item.classList.remove('active'));
                // Add 'active' class to the clicked list item
                listItem.classList.add('active');
            });
            fileList.appendChild(listItem);
        }
    };

    // Event Listeners
    newFileBtn.addEventListener('click', createFile);
    openFileBtn.addEventListener('click', openFile);
    saveFileBtn.addEventListener('click', saveFile);
    exportFileBtn.addEventListener('click', exportFile);
    deleteFileBtn.addEventListener('click', deleteFile);
    renameFileBtn.addEventListener('click', renameFile);

    // Initial Load
    loadFiles();
});
