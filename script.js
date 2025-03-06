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
            showModal(`
            <div style="text-align: center;">
                <h2 style="color: #dc3545; margin-bottom: 1rem;">Error</h2>
                <p style="font-size: 1.1rem; color: #333;">File not found.</p>
                <button class="cancel" onclick="closeModal()" style="background-color: #dc3545; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; cursor: pointer; margin-top: 1rem; transition: background-color 0.2s ease-in-out;">OK</button>
            </div>
            `);
        }
    };

    const saveFile = () => {
        if (currentFile) {
            files[currentFile] = quill.getContents();
            localStorage.setItem('files', JSON.stringify(files));
            showModal(`
            <div style="text-align: center;">
                <h2 style="color: #28a745; margin-bottom: 1rem;">File Saved!</h2>
                <p style="font-size: 1.1rem; color: #333;">Your file "${currentFile}" has been successfully saved.</p>
                <button class="confirm" onclick="closeModal()" style="background-color: #28a745; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; cursor: pointer; margin-top: 1rem; transition: background-color 0.2s ease-in-out;">OK</button>
            </div>
            `);
        } else {
            showModal(`
            <div style="text-align: center;">
                <h2 style="color: #dc3545; margin-bottom: 1rem;">Error</h2>
                <p style="font-size: 1.1rem; color: #333;">No file is currently open. Please open or create a new file.</p>
                <button class="cancel" onclick="closeModal()" style="background-color: #dc3545; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; cursor: pointer; margin-top: 1rem; transition: background-color 0.2s ease-in-out;">OK</button>
            </div>
            `);
        }
    };

    const exportFile = () => {
        if (!currentFile) {
            showModal(`
            <div style="text-align: center;">
                <h2 style="color: #dc3545; margin-bottom: 1rem;">Error</h2>
                <p style="font-size: 1.1rem; color: #333;">No file is currently open. Please open or create a new file.</p>
                <button class="cancel" onclick="closeModal()" style="background-color: #dc3545; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; cursor: pointer; margin-top: 1rem; transition: background-color 0.2s ease-in-out;">OK</button>
            </div>
            `);
            return;
        }

        let modalContent = `
            <div style="text-align: center;">
                <h2 style="color: #3490dc; margin-bottom: 1rem;">Export File</h2>
                <p style="font-size: 1.1rem; color: #333;">Choose the export format for "${currentFile}":</p>
                <div class="export-options-grid">
                    <div class="export-option" data-export-type="txt">.txt</div>
                    <div class="export-option" data-export-type="md">.md</div>
                    <div class="export-option" data-export-type="html">.html</div>
                    <div class="export-option" data-export-type="pdf">.pdf</div>
                    <div class="export-option" data-export-type="rtf">.rtf</div>
                    <div class="export-option" data-export-type="docx">.docx</div>
                    <div class="export-option" data-export-type="odt">.odt</div>
                    <div class="export-option" data-export-type="epub">.epub</div>
                    <div class="export-option" data-export-type="json">.json</div>
                    <div class="export-option" data-export-type="latex">.tex</div>
                </div>
                <div class="modal-labelledby">
                    <button class="cancel" onclick="closeModal()">Cancel</button>
                </div>
            </div>
        `;
        showModal(modalContent);

        // Attach event listeners to export options
        document.querySelectorAll('.export-option').forEach(option => {
            option.addEventListener('click', () => {
                const exportType = option.dataset.exportType;
                handleExportFile(exportType);
            });
        });
    };

    window.handleExportFile = (exportType) => {
        const content = quill.getText();

        if (exportType === 'txt') {
            downloadFile(currentFile + '.txt', content, 'text/plain');
        } else if (exportType === 'md') {
            const markdownContent = content.replace(/^# (.*$)/gim, '# $1\n').replace(/^## (.*$)/gim, '## $1\n').replace(/^### (.*$)/gim, '### $1\n').replace(/\*\*(.*)\*\*/gim, '**$1**').replace(/\*(.*)\*/gim, '*$1*');
            downloadFile(currentFile + '.md', markdownContent, 'text/markdown');
        } else if (exportType === 'pdf') {
            exportToPDF(currentFile, quill.getContents());
        } else if (exportType === 'html') {
            const htmlContent = quill.root.innerHTML;
            downloadFile(currentFile + '.html', htmlContent, 'text/html');
        } else if (exportType === 'rtf') {
            alert('RTF export not implemented yet.');
        } else if (exportType === 'docx') {
            alert('DOCX export not implemented yet.');
        } else if (exportType === 'odt') {
            alert('ODT export not implemented yet.');
        } else if (exportType === 'epub') {
            alert('EPUB export not implemented yet.');
        } else if (exportType === 'json') {
            const jsonContent = JSON.stringify(quill.getContents());
            downloadFile(currentFile + '.json', jsonContent, 'application/json');
        } else if (exportType === 'latex') {
            alert('LaTeX export not implemented yet.');
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
                <div class="modal-labelledby">
                    <button class="confirm" onclick="handleDeleteFile()">Delete</button>
                    <button class="cancel" onclick="closeModal()">Cancel</button>
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

    // Initial Load
    loadFiles();

    // Function to display code block with copy and delete options
    const displayCodeBlock = (code) => {
        const range = quill.getSelection(true); // Get current selection

        // Insert into Quill editor
        quill.insertEmbed(range.index, 'code-block', {
            code: code
        }, Quill.sources.USER);
        quill.setSelection(range.index + 1, Quill.sources.SILENT);
    };

    // Add custom code option
    const addCodeButton = document.createElement('button');
    addCodeButton.innerHTML = '&lt;Code&gt;'; // Display as <Code>
    addCodeButton.title = 'Insert Code Block';
    addCodeButton.classList.add('ql-code-block'); // Add a class for styling
    addCodeButton.addEventListener('click', () => {
        let modalContent = `
            <h2>Enter Code</h2>
            <textarea id="codeContent" class="modal-input" placeholder="Enter your code here" style="height: 200px; font-family: monospace;"></textarea>
            <div class="modal-labelledby">
                <button class="confirm" onclick="handleInsertCode()">Insert</button>
                <button class="cancel" onclick="closeModal()">Cancel</button>
            </div>
        `;
        showModal(modalContent);
    });

    window.handleInsertCode = () => {
        const code = document.getElementById('codeContent').value;
        if (code) {
            displayCodeBlock(code);
            modal.style.display = "none";
        }
    };
    document.getElementById('toolbar').appendChild(addCodeButton);

    // Define the custom blot for code-block
    class CodeBlock extends Quill.import('blots/block/embed') {
        static create(value) {
            let node = super.create();
            node.classList.add('code-block-display');
            node.setAttribute('contenteditable', 'false');

            // Code content
            const codeContent = document.createElement('pre');
            codeContent.textContent = value.code;
            node.appendChild(codeContent);

            // Controls container
            const controls = document.createElement('div');
            controls.classList.add('code-block-controls');

            // Copy button
            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copy';
            copyButton.addEventListener('click', (event) => {
                event.stopPropagation();
                navigator.clipboard.writeText(value.code).then(() => {
                    alert('Code copied to clipboard!');
                }).catch(err => {
                    console.error('Failed to copy code: ', err);
                    alert('Failed to copy code to clipboard.');
                });
            });
            controls.appendChild(copyButton);

            // Delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'X';
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                // Remove the entire code block
                const parent = node.parentNode;
                const index = quill.getIndex(node);
                quill.deleteText(index, node.textContent.length + 1);
            });
            controls.appendChild(deleteButton);

            node.appendChild(controls);
            return node;
        }

        static value(node) {
            return { code: node.querySelector('pre').textContent };
        }
    }

    CodeBlock.blotName = 'code-block';
    CodeBlock.tagName = 'div';
    Quill.register(CodeBlock);

    // Register the custom code-block embed
    Quill.register('formats/code-block', CodeBlock);

    // Header selector
    const headerSelector = document.createElement('select');
    headerSelector.classList.add('ql-header');

    // Add options for h1 to h6 and normal
    const normalOption = document.createElement('option');
    normalOption.value = '0';
    normalOption.textContent = 'Normal';
    headerSelector.appendChild(normalOption);

    for (let i = 1; i <= 6; i++) {
        const option = document.createElement('option');
        option.value = i.toString();
        option.textContent = `Header ${i}`;
        headerSelector.appendChild(option);
    }

    headerSelector.addEventListener('change', function() {
        const value = this.value;
        quill.format('header', value === '0' ? false : value);
    });

    document.getElementById('toolbar').insertBefore(headerSelector, document.querySelector('.ql-bold').parentNode);

    // Font selector
    const fontSelector = document.createElement('select');
    fontSelector.classList.add('ql-font');

    // Add font options
    const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Impact', 'Comic Sans MS', 'Roboto', 'Montserrat', 'Calibri', 'Segoe UI']; 
    fonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font.toLowerCase().replace(/\s+/g, '-'); 
        option.textContent = font;
        fontSelector.appendChild(option);
    });

    fontSelector.addEventListener('change', function() {
        const value = this.value;
        quill.format('font', value);
    });

    document.getElementById('toolbar').insertBefore(fontSelector, document.querySelector('.ql-size').parentNode);

    // Make sure these functions are accessible globally
    window.handleCreateFile = handleCreateFile;
    window.handleOpenFile = handleOpenFile;
    window.handleExportFile = handleExportFile;
    window.handleDeleteFile = handleDeleteFile;

    function handleCreateFile() {
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

    function handleOpenFile() {
        const fileName = document.getElementById('openFileName').value;
        if (fileName && files[fileName]) {
            currentFile = fileName;
            loadContent(currentFile);
            modal.style.display = "none";
        } else {
            showModal(`
            <div style="text-align: center;">
                <h2 style="color: #dc3545; margin-bottom: 1rem;">Error</h2>
                <p style="font-size: 1.1rem; color: #333;">File not found.</p>
                <button class="cancel" onclick="closeModal()" style="background-color: #dc3545; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; cursor: pointer; margin-top: 1rem; transition: background-color 0.2s ease-in-out;">OK</button>
            </div>
            `);
        }
    };

    function handleExportFile(exportType) {
        const content = quill.getText();

        if (exportType === 'txt') {
            downloadFile(currentFile + '.txt', content, 'text/plain');
        } else if (exportType === 'md') {
            const markdownContent = content.replace(/^# (.*$)/gim, '# $1\n').replace(/^## (.*$)/gim, '## $1\n').replace(/^### (.*$)/gim, '### $1\n').replace(/\*\*(.*)\*\*/gim, '**$1**').replace(/\*(.*)\*/gim, '*$1*');
            downloadFile(currentFile + '.md', markdownContent, 'text/markdown');
        } else if (exportType === 'pdf') {
            exportToPDF(currentFile, quill.getContents());
        } else if (exportType === 'html') {
            const htmlContent = quill.root.innerHTML;
            downloadFile(currentFile + '.html', htmlContent, 'text/html');
        } else if (exportType === 'rtf') {
            alert('RTF export not implemented yet.');
        } else if (exportType === 'docx') {
            alert('DOCX export not implemented yet.');
        } else if (exportType === 'odt') {
            alert('ODT export not implemented yet.');
        } else if (exportType === 'epub') {
            alert('EPUB export not implemented yet.');
        } else if (exportType === 'json') {
            const jsonContent = JSON.stringify(quill.getContents());
            downloadFile(currentFile + '.json', jsonContent, 'application/json');
        } else if (exportType === 'latex') {
            alert('LaTeX export not implemented yet.');
        } else {
            alert('Invalid export type.');
        }
        modal.style.display = "none";
    };

    function handleDeleteFile() {
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
});
