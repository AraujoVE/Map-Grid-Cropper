function updateImgName(defaultName){
    const nameInputEl = document.getElementById(`extracted-img-name-${defaultName}`);
    const newImgNameEl = document.getElementById(`new-image-name-${defaultName}`);

    const newName = `${nameInputEl.value}.png`;

    newImgNameEl.setAttribute("download", newName);
    newImgNameEl.innerHTML = newName;
}

function noImgChange(defaultName){
    const originalImg = document.getElementById(`old-image-content-${defaultName}`);
    const newImg = document.getElementById(`new-image-content-${defaultName}`);
    const newTitle = document.getElementById(`new-image-name-${defaultName}`); 
    const noImgMsg = document.getElementById(`no-image-${defaultName}`);
    const originalUrl = originalImg.getAttribute("src");

    newImg.setAttribute("src",originalUrl);
    newTitle.setAttribute("href",originalUrl)
    newTitle.style.display = "inline";
    noImgMsg.style.display = "none";
}

function ignoreImage(defaultName){
    const newImg = document.getElementById(`new-image-content-${defaultName}`);
    const newTitle = document.getElementById(`new-image-name-${defaultName}`); 
    const noImgMsg = document.getElementById(`no-image-${defaultName}`);

    newImg.setAttribute("src","");
    newTitle.setAttribute("href","");

    newTitle.style.display = "none";
    noImgMsg.style.display = "inline";
}

async function updateImgUrl(defaultName, newImgCanvas){
    const blob = await new Promise(resolve => newImgCanvas.toBlob(resolve));
    const newImgUrl = URL.createObjectURL(blob);
    const newImg = document.getElementById(`new-image-content-${defaultName}`);
    const newTitle = document.getElementById(`new-image-name-${defaultName}`);

    newImg.setAttribute("src",newImgUrl);
    newTitle.setAttribute("href",newImgUrl);
}

async function complexImgAdjustments(defaultName, updateImgMode){
    // const newTitle = document.getElementById(`new-image-name-${defaultName}`); 
    // const noImgMsg = document.getElementById(`no-image-${defaultName}`);
    // newTitle.style.display = "inline";
    // noImgMsg.style.display = "none";

    const imgEl = document.getElementById(`old-image-content-${defaultName}`);
    const {canvas, ctx} = await getImgObj(imgEl);


    // if (updateImgMode == "adjust-map"){
    //     const newImgCanvas = await adjustMap(canvas, ctx);
    //     updateImgUrl(defaultName, newImgCanvas);
    // }
}

function updateImgByMode(defaultName){
    const selectEl = document.getElementById(`extracted-img-transformation-${defaultName}`);
    const updateImgMode = selectEl.value;

    if (updateImgMode === "none"){
        noImgChange(defaultName);
    }
    else if (updateImgMode === "delete"){
        ignoreImage(defaultName);
    }
    else {
        complexImgAdjustments(defaultName, updateImgMode);
    }
}

function updateExtractedImage(ev) {
    const button = ev.target;
    const defaultName = button.name;
    updateImgName(defaultName);
    updateImgByMode(defaultName);

    console.log(defaultName);
}