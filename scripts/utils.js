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
