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

async function validateZip(file) {
    try {
        const zip = await JSZip.loadAsync(file);

        let pdfFiles = [];
        let nonPdfFiles = [];

        zip.forEach((relativePath, zipEntry) => {
            if (zipEntry.dir) return;

            const isPdf = relativePath.toLowerCase().endsWith(".pdf");

            if (isPdf) {
                pdfFiles.push(zipEntry);
            } else {
                nonPdfFiles.push(relativePath);
            }
        });
        if (nonPdfFiles.length > 0) {
            return {
                valid: false,
                message: "ZIP must contain only a PDF file."
            };
        }
        if (pdfFiles.length !== 1) {
            return {
                valid: false,
                message: "ZIP must contain exactly one PDF."
            };
        }
        return {
            valid: true,
            pdfFile: pdfFiles[0]
        };

    } catch (err) {
        return {
            valid: false,
            message: "Invalid ZIP file."
        };
    }
}

async function updateFiles(files){
    const fileInput = document.getElementById("file-upload");
    let dt = new DataTransfer()

    if (!files || files.length === 0) return;

    const mainFile = files[0];


    if (mainFile.type === "application/pdf" || mainFile.name.toLowerCase().endsWith(".pdf")) {
        dt.items.add(mainFile);
        updatePdfData(mainFile);
    }
    else if (mainFile.name.toLowerCase().endsWith(".zip")) {
        const isValid = await validateZip(mainFile);

        if (!isValid.valid) {
            alert(isValid.message);
            return;
        }

        const pdfBlob = await isValid.pdfFile.async("blob");
        const pdfFile = new File([pdfBlob], isValid.pdfFile.name, { type: "application/pdf" });

        dt.items.add(pdfFile);
        updatePdfData(pdfFile);
    }
    else {
        alert("Only PDF or ZIP files are allowed.");
        return;
    }

    fileInput.files = dt.files;
}
