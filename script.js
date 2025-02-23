function formatText(command, value = null) {
    document.execCommand(command, false, value);
}

function saveFile() {
    const content = document.getElementById('content').innerHTML;
    const filename = document.getElementById('filename').value || 'untitled';
    
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Save to localStorage
    localStorage.setItem(filename, content);
}

function loadFile() {
    const filename = document.getElementById('filename').value;
    const content = localStorage.getItem(filename);
    if(content) {
        document.getElementById('content').innerHTML = content;
    } else {
        alert('File not found!');
    }
}

function printFile() {
    const content = document.getElementById('content').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Print Document</title>
            </head>
            <body>${content}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Auto-save every 30 seconds
setInterval(() => {
    if(document.getElementById('filename').value) {
        saveFile();
    }
}, 30000);

// Initialize from localStorage
window.onload = function() {
    document.getElementById('content').focus();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
    }
});
