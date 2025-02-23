document.addEventListener("DOMContentLoaded", () => {
    const notepad = document.getElementById("notepad");

    // Load saved text
    notepad.value = localStorage.getItem("notepadText") || "";

    notepad.addEventListener("input", () => {
        localStorage.setItem("notepadText", notepad.value);
    });
});

function saveText() {
    alert("Text saved!");
}

function clearText() {
    if (confirm("Are you sure you want to clear the text?")) {
        document.getElementById("notepad").value = "";
        localStorage.removeItem("notepadText");
    }
}
