function noImgChange(defaultName, rotation){
    const originalImg = document.getElementById(`old-image-content-${defaultName}`);
    const rotatedCanvas = getRotatedCanvas(originalImg, rotation);
    updateImgUrl(defaultName, rotatedCanvas);
    const newTitle = document.getElementById(`new-image-name-${defaultName}`); 
    const noImgMsg = document.getElementById(`no-image-${defaultName}`);

    newTitle.style.display = "inline";
    noImgMsg.style.display = "none";
    updateImgName(defaultName);
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

function updateImgByMode(defaultName, updateImgMode){
    if (updateImgMode.startsWith("rotate")){
        noImgChange(defaultName, updateImgMode.split("rotate-")[1]);
    }
    else if (updateImgMode === "delete"){
        ignoreImage(defaultName);
    }
}

function updateExtractedImage(ev) {
    const button = ev.target;
    const defaultName = button.name;
    const selectEl = document.getElementById(`extracted-img-transformation-${defaultName}`);
    const updateImgMode = selectEl.value;

    updateImgByMode(defaultName, updateImgMode);
}

function deleteExtractedImage(ev) {
    const button = ev.target;
    const defaultName = button.name;
    const selectEl = document.getElementById(`extracted-img-transformation-${defaultName}`);
    selectEl.value = "delete";

    updateImgByMode(defaultName, "delete");
}

function clearAdjustMap(defaultName){
    const parentEl = document.getElementById(`map-adjust-${defaultName}`);
    parentEl.innerHTML = "";
}

function updateSelectSubOptions(ev){
    const select = ev.target;
    const defaultName = select.name;
    const selectedValue = select.value;
    const updateImageButton = document.getElementById(`update-image-button-${defaultName}`);

    updateImageButton.disabled = false;
    if(selectedValue.startsWith("adjust-map")){
        updateImageButton.disabled = true;        
        adjustMap(defaultName, selectedValue.split("adjust-map-")[1]);
    }
    else clearAdjustMap(defaultName);
}