function handleCancelExtraction(ev){
    let dt = new DataTransfer();
    const container = document.getElementById("pdf-image");
    const fileInput = document.getElementById("file-upload");
    const secondSectionDiv = document.getElementById("second-section-div");
    const extractPdfEl = document.getElementById("approve-extraction");

    extractPdfEl.disabled = false;
    extractPdfEl.innerHTML = "Extract PDF Images";
    
    fileInput.files = dt.files;
    container.innerHTML = "";
    secondSectionDiv.innerHTML = "";
    
    deactivateById("pdf-extraction");
    deactivateById("second-section-div");
    deactivateById("second-section-header");
    activateById("pdf-input");

}

function loadImage(imgObj, imageCount, p, isUrl = false) {
    const mainDiv = document.getElementById("second-section-div");
    const imgSrc = isUrl === true ? imgObj : URL.createObjectURL(imgObj);
    const imgExtractedSection = document.createElement("section");
    imgExtractedSection.classList.add("extracted-img-section");
    imgExtractedSection.id = `extracted-image-${p}-${imageCount}`;
    imgExtractedSection.setAttribute("name", `${p}-${imageCount}`);

    const html = `
        <div class="extracted-img-div" id="original-extracted-image-${p}-${imageCount}">
            <a style="cursor:pointer;" title="Click to download the single image." id="old-image-name-${p}-${imageCount}" download="Image_${p}_${imageCount}.png" href="${imgSrc}">Image_${p}_${imageCount}.png</a>
            <img id="old-image-content-${p}-${imageCount}" src="${imgSrc}" style="width:100%;" />
        </div>
        <div class="extracted-img-inner">
            <div class="vertical-form">
                <label for="extracted-img-name-${p}-${imageCount}"><h3>Image Name</h3></label>
                <input type="text" id="extracted-img-name-${p}-${imageCount}" value="Image_${p}_${imageCount}">                
                <label for="extracted-img-transformation-${p}-${imageCount}"><h3>Image Transformation</h3></label>
                <select class="update-select" id="extracted-img-transformation-${p}-${imageCount}">
                    <option value="none">None</option>
                    <option value="delete">Delete</option>
                    <option value="adjust-map">Adjust Map</option>
                </select>
                <button name="${p}-${imageCount}" id="update-image-button-${p}-${imageCount}" class="update-image">Update Image</button>
            </div>
        </div>
        <div class="extracted-img-div" id="updated-extracted-image-${p}-${imageCount}">
            <a style="cursor:pointer;" title="Click to download the single image." id="new-image-name-${p}-${imageCount}" download="Image_${p}_${imageCount}.png" href="${imgSrc}">Image_${p}_${imageCount}.png</a>            
            <p id="no-image-${p}-${imageCount}" style="display:none;">This image will not be downloaded.</p>
            <img id="new-image-content-${p}-${imageCount}" src="${imgSrc}" style="width:100%;" />
        </div>
    `
    imgExtractedSection.innerHTML = html;
    mainDiv.appendChild(imgExtractedSection)
    const updateImageButton = document.getElementById(`update-image-button-${p}-${imageCount}`);
    updateImageButton.addEventListener("click", updateExtractedImage);
}

async function getObjectWithTimeout(page, objId, timeout = 1000) {
    return new Promise((resolve, reject) => {
        let resolved = false;

        const timer = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                reject(new Error("Timeout retrieving object"));
            }
        }, timeout);

        try {
            page.objs.get(objId, (obj) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timer);
                    resolve(obj);
                }
            });
        } catch (err) {
            clearTimeout(timer);
            reject(err);
        }
    });
}

async function checkValidImage(page, ops, seen, i, imgCount, p){
    try {
        const args = ops.argsArray[i];
        const objId = args[0];
        console.log("Before image promise");

        let img;

        try {
            img = await getObjectWithTimeout(page, objId, 1000);
        } catch (err) {
            console.warn("Skipping unresolved image", objId);
            return imgCount;
        }

        console.log("Before check type");
        if (img.data) {
            console.log("IMGDATA");
            if (img.width < 50 || img.height < 50) {
                console.log("Pre return <50");
                return;
            }

            const key = `${img.width}-${img.height}-${img.data.length}`;
            if (seen.has(key)) {
                console.log("Pre return seen");
                return;                
            }
            seen.add(key);

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;

            const imageData = ctx.createImageData(img.width, img.height);
            imageData.data.set(img.data);

            ctx.putImageData(imageData, 0, 0);

            imgCount += 1;

            const blob = await new Promise(resolve => canvas.toBlob(resolve));
            if (!blob) return;
            loadImage(blob, imgCount, p);
        }
        else if (img.bitmap) {
            console.log("BITMAP");

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img.bitmap, 0, 0);

            imgCount += 1;

            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
            if (!blob) return;
            loadImage(blob, imgCount, p);
        }
        else if (img.src) {
            console.log("SRC");
            imgCount += 1;
            loadImage(img.src, imgCount, p, true)
        }
        else {
            console.warn("Unsupported image format", img);
        }

    } catch (err) {
        console.warn("Failed to extract image", err);
    }
    return imgCount
}

async function extractPdfImages(file) {
    activateById("second-section-header");
    activateById("second-section-div");
    activateById("pdf-extraction-loader");
    deactivateById("download-zip");
    const url = URL.createObjectURL(file);
    const pdf = await pdfjsLib.getDocument(url).promise;
    
    const seen = new Set();
    for (let p = 1; p <= pdf.numPages; p++) {
        let imgCount = -1;
        const page = await pdf.getPage(p);
        const ops = await page.getOperatorList();
        console.log(`Page = ${p} with ${ops.fnArray.length} ops`);
        for (let i = 0; i < ops.fnArray.length; i++) {
            console.log("Inside ops");
            const fn = ops.fnArray[i];
            if (
                fn === pdfjsLib.OPS.paintImageXObject ||
                fn === pdfjsLib.OPS.paintJpegXObject ||
                fn === pdfjsLib.OPS.paintInlineImageXObject
            ) {
                console.log("Valid Fn");
                imgCount = await checkValidImage(page, ops, seen, i, imgCount, p);
            }
        }
    }
    deactivateById("pdf-extraction-loader");
    activateById("download-zip");
    URL.revokeObjectURL(url);
}

function handleApproveExtraction(ev){
    const extractPdfEl = document.getElementById("approve-extraction");
    extractPdfEl.disabled = true;
    extractPdfEl.innerHTML = "Extracting PDF";

    const fileInput = document.getElementById("file-upload");
    const pdfFile = fileInput.files[0]    
    try {
        extractPdfImages(pdfFile);
    } catch (err) {
        console.warn("error: ", err);
    }
}

async function handleDownloadZip(_){
    const downloadButton = document.getElementById("download-zip");
    activateById("pdf-extraction-loader");
    downloadButton.disabled = true;
    downloadButton.innerHTML = "Downloading Zip File"

    console.log("Inside Download Zip");
    const zip = new JSZip();
    const pdfEl = document.getElementById("pdf-name");

    const secondSection = document.getElementById("second-section-div");
    for (const imgSection of secondSection.children){
        const defaultName = imgSection.getAttribute("name");
        const imgEl = document.getElementById(`new-image-content-${defaultName}`);
        if (imgEl.getAttribute("src") === ""){
            continue;
        }
        const imgNameEl = document.getElementById(`new-image-name-${defaultName}`);
        const downloadName = imgNameEl.getAttribute("download");
        const { canvas, _ } = await getImgObj(imgEl);
        const blob = await new Promise(resolve => canvas.toBlob(resolve));
        zip.file(downloadName, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pdfEl.innerHTML}__extracted_images.zip`;
    link.click();

    const extractPdfEl = document.getElementById("approve-extraction");
    extractPdfEl.innerHTML = "PDF Images Extracted";

    deactivateById("pdf-extraction-loader");
    downloadButton.disabled = false;
    downloadButton.innerHTML = "Download Extracted Images"

}

