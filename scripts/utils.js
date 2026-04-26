function activateById(idString){
    const activateEl = document.getElementById(idString);

    activateEl.style.pointerEvents = "auto";
    activateEl.style.display = "flex";
}

function deactivateById(idString){
    const deactivateEl = document.getElementById(idString);

    deactivateEl.style.pointerEvents = "none";
    deactivateEl.style.display = "none";
}

async function getImgObj(originalImg){

    await new Promise((resolve, reject) => {
        if (originalImg.complete) {
            resolve();
        } else {
            originalImg.addEventListener("load", resolve, { once: true });
            originalImg.addEventListener("error", reject, { once: true });
        }
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = originalImg.naturalWidth;
    canvas.height = originalImg.naturalHeight;

    ctx.drawImage(originalImg, 0, 0);

    return { canvas, ctx };
}

function updateImgName(defaultName){
    const nameInputEl = document.getElementById(`extracted-img-name-${defaultName}`);
    const newImgNameEl = document.getElementById(`new-image-name-${defaultName}`);

    const newName = `${nameInputEl.value}.png`;

    newImgNameEl.setAttribute("download", newName);
    newImgNameEl.innerHTML = newName;
}

async function updateImgUrl(defaultName, newImgCanvas){
    const blob = await new Promise(resolve => newImgCanvas.toBlob(resolve));
    const newImgUrl = URL.createObjectURL(blob);
    const newImg = document.getElementById(`new-image-content-${defaultName}`);
    const newTitle = document.getElementById(`new-image-name-${defaultName}`);

    newImg.setAttribute("src",newImgUrl);
    newTitle.setAttribute("href",newImgUrl);
}

function getRotatedCanvas(sourceCanvas, angle) {
    angle = ((angle % 360) + 360) % 360;

    if (![0, 90, 180, 270].includes(angle)) {
        throw new Error("Angle must be 0, 90, 180, or 270");
    }

    const newCanvas = document.createElement("canvas");
    const ctx = newCanvas.getContext("2d");

    const w = sourceCanvas.naturalWidth || sourceCanvas.width;
    const h = sourceCanvas.naturalHeight || sourceCanvas.height;

    // adjust size
    if (angle === 90 || angle === 270) {
        newCanvas.width = h;
        newCanvas.height = w;
    } else {
        newCanvas.width = w;
        newCanvas.height = h;
    }

    ctx.translate(newCanvas.width / 2, newCanvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(sourceCanvas, -w / 2, -h / 2);

    return newCanvas;
}