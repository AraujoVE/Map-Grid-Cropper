function windowDrop(e) {
    e.preventDefault();
}

function dropZoneDragover(e) {
    const dropZone = document.getElementById("drop-zone");

    const fileItems = [...e.dataTransfer.items].filter(
        (item) => item.kind === "file"
    );

    if (fileItems.length > 0) {
        e.preventDefault();

        const hasValidFile = fileItems.some((item) => {
            const type = item.type;

            return (
                type === "application/pdf" ||
                type === "application/zip" ||
                type === "application/x-zip-compressed" ||
                type === ""
            );
        });

        if (hasValidFile) {
            dropZone.classList.add("dragover");
            e.dataTransfer.dropEffect = "copy";
        } else {
            e.dataTransfer.dropEffect = "none";
        }
    }
}

function dropZoneDragleave() {
    const dropZone = document.getElementById("drop-zone");
    dropZone.classList.remove("dragover");
}

function windowDragover (e) {
    const dropZone = document.getElementById("drop-zone");
    const fileItems = [...e.dataTransfer.items].filter(
        (item) => item.kind === "file",
    );
    if (fileItems.length > 0) {
        e.preventDefault();

        if (!dropZone.contains(e.target)) {
            e.dataTransfer.dropEffect = "none";
        }
    }
}

function dropZoneHandler(ev) {
    activateLoader()
    ev.preventDefault();
    const files = [...ev.dataTransfer.items]
        .map((item) => item.getAsFile())
        .filter((file) => file);
    
    updateFiles(files);
    const dropZone = document.getElementById("drop-zone");
    dropZone.classList.remove("dragover");
}

function changeFile(ev) {
    activateLoader()    
    let files = ev.target.files;
    updateFiles(files)
}
