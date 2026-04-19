async function displayPdfImage(file) {
    const container = document.getElementById("pdf-image");

    const url = URL.createObjectURL(file);

    const pdf = await pdfjsLib.getDocument(url).promise;
    const page = await pdf.getPage(1);

    const scale = 0.25;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const pdfName = document.createElement("span");
    pdfName.id = "pdf-name";

    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    pdfName.innerText = file.name;

    container.appendChild(canvas);
    container.appendChild(pdfName);
    activateById("pdf-extraction");
    deactivateById("pdf-upload-loader");
}

function activateLoader(){
    deactivateById("pdf-input");
    deactivateById("pdf-extraction");
    activateById("pdf-upload-loader");
}    

function updatePdfData(file){
    displayPdfImage(file);
}

function updateFiles(files){
    const fileInput = document.getElementById("file-upload");
    let dt = new DataTransfer()
    if (files && files.length > 0) {
        const mainFile = files[0]
        dt.items.add(mainFile)
        updatePdfData(mainFile);
    }
    fileInput.files = dt.files;
}
