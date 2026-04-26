function getMinPixels(canvasMousePos, canvasLenght, refImgCenter, pixelsRatio){
    const distFromCenter = canvasMousePos - (canvasLenght  / 2);
    const refImgPos = refImgCenter + (distFromCenter / pixelsRatio);
    const refImgPosMin = Math.floor(refImgPos);

    return refImgPosMin;
}

function getCanvasMin(refImgPosMin, refImgCenter, pixelsRatio, gridSquareSize, canvasLenght){
    const baseLength = canvasLenght / 2;
    const gridDistance = gridSquareSize * pixelsRatio;
    let minPos = ((refImgPosMin - refImgCenter) * pixelsRatio) + baseLength;
    let distDiff, firstLineIncrease;

    if (minPos === 0) return minPos;

    if (minPos < 0){
        distDiff = -minPos;
        firstLineIncrease = Math.ceil(distDiff / gridDistance) * gridDistance;
        minPos += firstLineIncrease;
    }
    else{
        distDiff = minPos;
        firstLineIncrease = Math.floor(distDiff / gridDistance) * gridDistance;
        minPos -= firstLineIncrease;
    }

    return minPos;
}

function increaseMinPixelPos(baseMin, pixelsRatio, gridPixelLength){
    return Math.ceil(baseMin + (pixelsRatio * gridPixelLength));
}

function drawLine(ctx, auxCanvas, baseMinX, baseMinY, pixelsRatio, gridPixelLength, totalWidth, totalHeight, isColumn){
    let minX = (isColumn === true ? baseMinX : 0);
    let minY = (isColumn === true ? 0 : baseMinY);
    minX = Math.max(0, minX);
    minY = Math.max(0, minY);

    let maxX = (isColumn === true ? increaseMinPixelPos(minX, pixelsRatio, gridPixelLength) : totalWidth);
    let maxY = (isColumn === true ? totalHeight : increaseMinPixelPos(minY, pixelsRatio, gridPixelLength));
    maxX = Math.min(totalWidth, maxX);
    maxY = Math.min(totalHeight, maxY);

    const width = maxX - minX;
    const height = maxY - minY;

    ctx.drawImage(
        auxCanvas,
        minX, minY, width, height,
        minX, minY, width, height
    );
}

function writeMultipleLines(ctx, auxCanvas, baseMinX, baseMinY, pixelsRatio, gridPixelLength, totalWidth, totalHeight, gridSquareSize, drawCols){
    let startIter = (drawCols === true ? baseMinX : baseMinY);
    let maxLenght = (drawCols === true ? totalWidth : totalHeight);
    let forIncrease = gridSquareSize * pixelsRatio;
    let curMinX, curMinY;

    for (let curMinValue = startIter; curMinValue < maxLenght; curMinValue += forIncrease){
        curMinX = (drawCols === true ? curMinValue : baseMinX);
        curMinY = (drawCols === true ? baseMinY : curMinValue);
        drawLine(ctx, auxCanvas, curMinX, curMinY, pixelsRatio, gridPixelLength, totalWidth, totalHeight, drawCols);
    }
}

function execHighlightDrawing(canvas){
    const highlightData = canvas.state.highlightData;
    if(highlightData.refImgPosMinX === null) return;

    const pixelsRatio = highlightData.pixelsRatio;

    const totalWidth = canvas.width;
    const totalHeight = canvas.height;


    const gridPixelLength = highlightData.gridPixelLength;
    const gridSquareSize = highlightData.gridSquareSize;

    const baseMinX = getCanvasMin(highlightData.refImgPosMinX, canvas.state.refImgCenterX, pixelsRatio, gridSquareSize, totalWidth);
    const baseMinY = getCanvasMin(highlightData.refImgPosMinY, canvas.state.refImgCenterY, pixelsRatio, gridSquareSize, totalHeight);

    

    const ctx = canvas.ctx;
    const auxCanvas = canvas.state.auxCanvas;


    ctx.drawImage(auxCanvas, 0, 0);
    ctx.filter = "invert(1)";
    writeMultipleLines(ctx, auxCanvas, baseMinX, baseMinY, pixelsRatio, gridPixelLength, totalWidth, totalHeight, gridSquareSize, true);
    writeMultipleLines(ctx, auxCanvas, baseMinX, baseMinY, pixelsRatio, gridPixelLength, totalWidth, totalHeight, gridSquareSize, false);
    ctx.filter = "none";
}

function updatePixels(canvas, newX, newY){
    const defaultName = canvas.getAttribute("name");
    const xPixel = document.getElementById(`pixel-coords-x-${defaultName}`);
    const yPixel = document.getElementById(`pixel-coords-y-${defaultName}`);

    xPixel.innerHTML = `X: ${newX}`;
    yPixel.innerHTML = `Y: ${newY}`;
}

function drawInvertedSquare(ev, canvas){
    const imgRatio = canvas.state.imgRatio;
    const zoom = canvas.state.zoom;
    const pixelsRatio = zoom / imgRatio;
    if (pixelsRatio < 1.0) return;

    const rect = canvas.getBoundingClientRect();

    const curX = ev.clientX - rect.left;
    const curY = ev.clientY - rect.top;

    const refImgPosMinX = getMinPixels(curX, canvas.width, canvas.state.refImgCenterX, pixelsRatio);
    const refImgPosMinY = getMinPixels(curY, canvas.height, canvas.state.refImgCenterY, pixelsRatio);


    canvas.state.highlightData.pixelsRatio = pixelsRatio;

    if (canvas.state.gridFixed === false || canvas.state.mapClicked === false){
        canvas.state.highlightData.refImgPosMinX = refImgPosMinX;
        canvas.state.highlightData.refImgPosMinY = refImgPosMinY;
        updatePixels(canvas, refImgPosMinX, refImgPosMinY);
    }

    if (canvas.state.showGrid === true){
        execHighlightDrawing(canvas);
    }
}

function firstImageDrawing(canvas, baseImgEl, rotation){
    const baseImgWidth = baseImgEl.naturalWidth || baseImgEl.width;
    const baseImgHeight = baseImgEl.naturalHeight || baseImgEl.height;
    const canvasNewWidth = canvas.clientWidth;
    const canvasNewHeight = (baseImgHeight / baseImgWidth) * canvasNewWidth;
    const imgRatio = baseImgWidth / canvasNewWidth;


    canvas.width = canvasNewWidth;
    canvas.height = canvasNewHeight;
    canvas.ctx = canvas.getContext("2d");

    
    canvas.ctx.drawImage(baseImgEl, 0, 0, baseImgWidth, baseImgHeight, 0, 0, canvasNewWidth, canvasNewHeight);
    
    const auxCanvas = document.createElement("canvas");
    auxCanvas.width = canvasNewWidth;
    auxCanvas.height = canvasNewHeight;
    auxCanvas.getContext("2d").drawImage(canvas, 0, 0);

    canvas.state = {
        rotation: rotation,
        auxCanvas: auxCanvas,
        mouseDown: false,
        refImgWidth: baseImgWidth,
        refImgHeight: baseImgHeight,
        refImgCenterX: (baseImgWidth/2),
        refImgCenterY: (baseImgHeight/2),
        imgRatio: imgRatio,
        lastMouseSelectedX: 0,
        lastMouseSelectedY: 0,
        zoom: 1.0,
        clickingMode: "move-map",
        mapClicked: false,
        lastMouseDownX: null,
        lastMouseDownY: null,
        originalMapEl: baseImgEl,
        highlightPixelSize: 3,
        gridFixed: false,
        showGrid: false,
        pointSelectionMode: false,
        referenceIntersection: false,
        distantIntersection: false,
        refIntersectionCoordX: null,
        refIntersectionCoordY: null,
        distIntersectionCoordX: null,
        distIntersectionCoordY: null,
        highlightData: {
            gridPixelLength: 1.0,
            gridSquareSize: 10.0,
            refImgPosMinX: null,
            refImgPosMinY: null,
            pixelsRatio: (1/imgRatio)
        }
    }

}

function setCanvasCenterAndGetMin(canvas, centerChange, baseImgLength, imgRatio, zoom, isXValue){
    const newCenterIncrease = (imgRatio * centerChange) / zoom;
    let newCenter = (isXValue === true ? canvas.state.refImgCenterX : canvas.state.refImgCenterY); 
    newCenter = newCenter + newCenterIncrease;
    let minPos = newCenter - (baseImgLength / (2 * zoom));
    let maxPos = minPos + (baseImgLength / zoom);
    
    if(minPos < 0){
        newCenter -= minPos;
        minPos = 0;
    }
    else if(maxPos > baseImgLength){
        newCenter += (baseImgLength - maxPos); 
        minPos += (baseImgLength - maxPos);
    }

    if (isXValue === true){
        canvas.state.refImgCenterX = newCenter;
    }
    else{
        canvas.state.refImgCenterY = newCenter;
    }

    return minPos;
}

function drawImage(canvas, xCenterChange, yCenterChange, zoomIncrease){
    const baseImgEl = canvas.state.originalMapEl;

    const zoom = Number((canvas.state.zoom + zoomIncrease).toFixed(1));
    const imgRatio = canvas.state.imgRatio;


    const baseImgWidth = baseImgEl.naturalWidth || baseImgEl.width;
    const baseImgHeight = baseImgEl.naturalHeight || baseImgEl.height;
    const newImgWidth = baseImgWidth / zoom;
    const newImgHeight = baseImgHeight / zoom;


    const minX = setCanvasCenterAndGetMin(canvas, xCenterChange, baseImgWidth, imgRatio, zoom, true);
    const minY = setCanvasCenterAndGetMin(canvas, yCenterChange, baseImgHeight, imgRatio, zoom, false);
    canvas.state.zoom = zoom;

    canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.ctx.drawImage(baseImgEl, minX, minY, newImgWidth, newImgHeight, 0, 0, canvas.width, canvas.height);

    const auxCtx = canvas.state.auxCanvas.getContext("2d");
    auxCtx.clearRect(0, 0, canvas.width, canvas.height);
    auxCtx.drawImage(canvas, 0, 0);
}


function getCenterChange(ev, canvas){
    const lastMouseSelectedX = canvas.state.lastMouseSelectedX;
    const lastMouseSelectedY = canvas.state.lastMouseSelectedY;

    const rect = canvas.getBoundingClientRect();

    const curX = ev.clientX - rect.left;
    const curY = ev.clientY - rect.top;

    const xCenterChange = lastMouseSelectedX - curX; 
    const yCenterChange = lastMouseSelectedY - curY;

    canvas.state.lastMouseSelectedX = curX;
    canvas.state.lastMouseSelectedY = curY;

    return {xCenterChange, yCenterChange};
}

function mapMoveOnMoveMap(ev, canvas){
    const isMouseDown = canvas.state.mouseDown;
    let xCenterChange = 0; 
    let yCenterChange = 0;
    
    if (isMouseDown) ({xCenterChange, yCenterChange} = getCenterChange(ev, canvas));

    drawImage(canvas, xCenterChange, yCenterChange, 0);
}

function mapMouseMoving(ev){
    const canvas = ev.currentTarget;
    const clickingMode = canvas.state.clickingMode;
    
    if (clickingMode === "move-map") mapMoveOnMoveMap(ev, canvas);
    drawInvertedSquare(ev, canvas);
}

function mapMouseDownOnMoveMap(ev, canvas){
    const rect = canvas.getBoundingClientRect();

    canvas.state.lastMouseSelectedX = ev.clientX - rect.left;
    canvas.state.lastMouseSelectedY = ev.clientY - rect.top;
    canvas.state.mouseDown = true;
}

function updateMouseDown(ev, canvas){
    const rect = canvas.getBoundingClientRect();

    canvas.state.lastMouseDownX = ev.clientX - rect.left;
    canvas.state.lastMouseDownY = ev.clientY - rect.top;
}

function updateMouseUp(ev, canvas){
    const rect = canvas.getBoundingClientRect();
    const defaultName = canvas.getAttribute("name");
    const referenceIntersectionButtonEl = document.getElementById(`reference-intersection-button-${defaultName}`);
    const distantIntersectionButtonEl = document.getElementById(`distant-intersection-button-${defaultName}`);

    const lastX = canvas.state.lastMouseDownX;
    const lastY = canvas.state.lastMouseDownY;
    const curX = ev.clientX - rect.left;
    const curY = ev.clientY - rect.top;
    const dist = Math.pow((Math.pow((lastX - curX), 2) + Math.pow((lastY - curY), 2)), 0.5);
    const gridFixed = canvas.state.gridFixed;
    const mapClicked = canvas.state.mapClicked;

    if (gridFixed && dist < 5){
        canvas.state.mapClicked = !mapClicked;
        if(canvas.state.pointSelectionMode){
            referenceIntersectionButtonEl.disabled = mapClicked;
            distantIntersectionButtonEl.disabled = mapClicked;
        }
    }

}


function mapMouseDown(ev){
    const canvas = ev.currentTarget;
    const clickingMode = canvas.state.clickingMode;
    
    updateMouseDown(ev, canvas);
    if (clickingMode === "move-map") mapMouseDownOnMoveMap(ev, canvas);
}

function removeHighlight(canvas){
    canvas.state.highlightData.minX = null;
    canvas.state.highlightData.maxX = null;
    canvas.state.highlightData.minY = null;
    canvas.state.highlightData.maxY = null;
}

function mapMouseOutOnMoveMap(ev, canvas){
    canvas.state.mouseDown = false;
}

function mapMouseOut(ev){
    const canvas = ev.currentTarget;
    const clickingMode = canvas.state.clickingMode;
    
    if (clickingMode === "move-map") mapMouseOutOnMoveMap(ev, canvas);
    removeHighlight(canvas);
}

function mapMouseOverOnMoveMap(ev, canvas){
    canvas.state.mouseDown = false;
}

function mapMouseOver(ev){
    const canvas = ev.currentTarget;
    const clickingMode = canvas.state.clickingMode;
    
    if (clickingMode === "move-map") mapMouseOverOnMoveMap(ev, canvas);
}

function mapMouseUpOnMoveMap(ev, canvas){
    canvas.state.mouseDown = false;
}

function mapMouseUp(ev){
    const canvas = ev.currentTarget;
    const clickingMode = canvas.state.clickingMode;
    
    updateMouseUp(ev, canvas);
    if (clickingMode === "move-map") mapMouseUpOnMoveMap(ev, canvas);
}

//function mapMouseClick(ev){
//    const canvas = ev.currentTarget;
//    if (canvas.state.gridFixed === true){
//        canvas.state.mapClicked = !canvas.state.mapClicked; 
//    }
//}


function changeZoomSpan(increaseEl, decreaseEl, mainButton, curZoom, zoomIncrease){
    let baseName = mainButton.getAttribute("base-name");
    let newZoom = Number((curZoom + zoomIncrease).toFixed(1));
    let zoomDecreaseValue = (newZoom === 1 ? "N/A" : Number((newZoom / 2).toFixed()));

    mainButton.setAttribute("main-value", newZoom);
    mainButton.innerHTML = `${baseName}: ${newZoom}`;
    decreaseEl.innerHTML = `-${zoomDecreaseValue}`;
    increaseEl.innerHTML = `+${newZoom}`;
}

function zoomBaseData(ev){
    const defaultName = ev.currentTarget.name;
    const increaseButton = document.getElementById(`zoom-value-button-increase-${defaultName}`);
    const decreaseButton = document.getElementById(`zoom-value-button-decrease-${defaultName}`);
    const mainButton = document.getElementById(`zoom-value-${defaultName}`);

    const mainValueIntegerNumber = Number(Number(mainButton.getAttribute("main-value")).toFixed());

    const canvas = document.getElementById(`update-map-canvas-${defaultName}`);

    return {increaseButton, decreaseButton, mainButton, mainValueIntegerNumber, canvas};
}

function updatePositiveDecreaseZoom(decreaseButton, curValue, isIncrease){
    if (isIncrease){
        decreaseButton.disabled = false;
    }
    else if (curValue === 2 && isIncrease === false){
        decreaseButton.disabled = true;
    }
}

function decreaseZoom(ev){
    const {increaseButton, decreaseButton, mainButton, mainValueIntegerNumber, canvas} = zoomBaseData(ev);
    const zoomIncrease = Number((-0.5 * mainValueIntegerNumber).toFixed());

    updatePositiveDecreaseZoom(decreaseButton, mainValueIntegerNumber, false);
    changeZoomSpan(increaseButton, decreaseButton, mainButton, mainValueIntegerNumber, zoomIncrease);
    drawImage(canvas, 0, 0, zoomIncrease);
}

function increaseZoom(ev){
    const {increaseButton, decreaseButton, mainButton, mainValueIntegerNumber, canvas} = zoomBaseData(ev);

    updatePositiveDecreaseZoom(decreaseButton, mainValueIntegerNumber, true);
    changeZoomSpan(increaseButton, decreaseButton, mainButton, mainValueIntegerNumber, mainValueIntegerNumber);
    drawImage(canvas, 0, 0, mainValueIntegerNumber);
}

function singleValueChange(mainButton, mainValueIntegerNumber, isIncrease){
    let baseName = mainButton.getAttribute("base-name");
    let newValue = mainValueIntegerNumber + (isIncrease === true ? 1 : -1);

    mainButton.setAttribute("main-value", newValue);
    mainButton.innerHTML = `${baseName}: ${newValue}`;
}

function OneAndFiveButtons(ev, partialName, increment){
    const defaultName = ev.currentTarget.name;
    const mainButton = document.getElementById(`${partialName}-${defaultName}`);
    const minusOneButton = document.getElementById(`${partialName}-button-minus-one-${defaultName}`);
    const minusFiveButton = document.getElementById(`${partialName}-button-minus-five-${defaultName}`);

    const mainValueIntegerNumber = Number(Number(mainButton.getAttribute("main-value")).toFixed());
    const newValue = Number((mainValueIntegerNumber + increment).toFixed());

    if (newValue > 1){
        minusOneButton.disabled = false;
    }
    else{
        minusOneButton.disabled = true;
    }

    if (newValue > 5){
        minusFiveButton.disabled = false;
    }
    else{
        minusFiveButton.disabled = true;
    }

    let baseName = mainButton.getAttribute("base-name");

    mainButton.setAttribute("main-value", newValue);
    mainButton.innerHTML = `${baseName}: ${newValue}`;

    return newValue;
}

function canvasFromEv(ev){
    return document.getElementById(`update-map-canvas-${ev.currentTarget.getAttribute("name")}`);
}

function decreaseThicknessByFive(ev){
    const newValue = OneAndFiveButtons(ev, "line-thickness", -5);
    const canvas = canvasFromEv(ev);
    canvas.state.highlightData.gridPixelLength = newValue;
    drawImage(canvas, 0, 0, 0);
}

function decreaseThicknessByOne(ev){
    const newValue = OneAndFiveButtons(ev, "line-thickness", -1);
    const canvas = canvasFromEv(ev);
    canvas.state.highlightData.gridPixelLength = newValue;
    drawImage(canvas, 0, 0, 0);
}

function increaseThicknessByOne(ev){
    const newValue = OneAndFiveButtons(ev, "line-thickness", 1);
    const canvas = canvasFromEv(ev);
    canvas.state.highlightData.gridPixelLength = newValue;
    drawImage(canvas, 0, 0, 0);
}

function increaseThicknessByFive(ev){
    const newValue = OneAndFiveButtons(ev, "line-thickness", 5);
    const canvas = canvasFromEv(ev);
    canvas.state.highlightData.gridPixelLength = newValue;
    drawImage(canvas, 0, 0, 0);
}

function decreaseGridLengthByFive(ev){
    const newValue = OneAndFiveButtons(ev, "grid-length", -5);
    const canvas = canvasFromEv(ev);
    canvas.state.highlightData.gridSquareSize = newValue;
    drawImage(canvas, 0, 0, 0);
}

function decreaseGridLengthByOne(ev){
    const newValue = OneAndFiveButtons(ev, "grid-length", -1);
    const canvas = canvasFromEv(ev);
    canvas.state.highlightData.gridSquareSize = newValue;
    drawImage(canvas, 0, 0, 0);
}

function increaseGridLengthByOne(ev){
    const newValue = OneAndFiveButtons(ev, "grid-length", 1);
    const canvas = canvasFromEv(ev);
    canvas.state.highlightData.gridSquareSize = newValue;
    drawImage(canvas, 0, 0, 0);
}

function increaseGridLengthByFive(ev){
    const newValue = OneAndFiveButtons(ev, "grid-length", 5);
    const canvas = canvasFromEv(ev);
    canvas.state.highlightData.gridSquareSize = newValue;
    drawImage(canvas, 0, 0, 0);
}

function updateShowGridStatus(ev){
    const isChecked = ev.currentTarget.checked;
    const canvas = canvasFromEv(ev);
    const defaultName = ev.currentTarget.name;
    const startPointsSelectionEl = document.getElementById(`start-points-selection-toggle-${defaultName}`);
    const fixGridEl = document.getElementById(`fix-grid-toggle-${defaultName}`);
    canvas.state.showGrid = isChecked;
    startPointsSelectionEl.disabled = (isChecked === false || fixGridEl.checked === false);
    drawImage(canvas, 0, 0, 0);
}

function updateFixGridStatus(ev){
    const isChecked = ev.currentTarget.checked;
    const canvas = canvasFromEv(ev);
    const defaultName = ev.currentTarget.name;
    const startPointsSelectionEl = document.getElementById(`start-points-selection-toggle-${defaultName}`);
    const showGridEl = document.getElementById(`show-grid-toggle-${defaultName}`);
    canvas.state.mapClicked = false;
    canvas.state.gridFixed = isChecked;
    startPointsSelectionEl.disabled = (isChecked === false || showGridEl.checked === false);
    drawImage(canvas, 0, 0, 0);
}

function startPointsSelection(ev, isActivation){
    const defaultName = ev.currentTarget.name;

    const canvas = canvasFromEv(ev);

    const lineThicknessValue = Number(document.getElementById(`line-thickness-${defaultName}`).getAttribute("main-value"));
    const gridLengthValue = Number(document.getElementById(`grid-length-${defaultName}`).getAttribute("main-value"));

    const minusFiveLineThicknessEl = document.getElementById(`line-thickness-button-minus-five-${defaultName}`); 
    const minusOneLineThicknessEl = document.getElementById(`line-thickness-button-minus-one-${defaultName}`); 
    const plusOneLineThicknessEl = document.getElementById(`line-thickness-button-plus-one-${defaultName}`); 
    const plusFiveLineThicknessEl = document.getElementById(`line-thickness-button-plus-five-${defaultName}`); 

    const minusFiveGridLengthEl = document.getElementById(`grid-length-button-minus-five-${defaultName}`); 
    const minusOneGridLengthEl = document.getElementById(`grid-length-button-minus-one-${defaultName}`); 
    const plusOneGridLengthEl = document.getElementById(`grid-length-button-plus-one-${defaultName}`); 
    const plusFiveGridLengthEl = document.getElementById(`grid-length-button-plus-five-${defaultName}`);

    const showGridToggle = document.getElementById(`show-grid-toggle-${defaultName}`);
    const fixGridToggle = document.getElementById(`fix-grid-toggle-${defaultName}`);

    const referenceIntersectionButtonEl = document.getElementById(`reference-intersection-button-${defaultName}`);
    const referenceIntersectionCoordsX = document.getElementById(`reference-intersection-coords-x-${defaultName}`);
    const referenceIntersectionCoordsY = document.getElementById(`reference-intersection-coords-y-${defaultName}`);

    const distantIntersectionButtonEl = document.getElementById(`distant-intersection-button-${defaultName}`);
    const distantIntersectionCoordsX = document.getElementById(`distant-intersection-coords-x-${defaultName}`);
    const distantIntersectionCoordsY = document.getElementById(`distant-intersection-coords-y-${defaultName}`);

    const pixelCoordsX = document.getElementById(`pixel-coords-x-${defaultName}`);
    const pixelCoordsY = document.getElementById(`pixel-coords-y-${defaultName}`);

    const updateMapButton = document.getElementById(`update-map-button-${defaultName}`);

    if (isActivation) minusFiveLineThicknessEl.disabled = isActivation;
    else if (lineThicknessValue > 5 && isActivation === false) minusFiveLineThicknessEl.disabled = isActivation;

    if (isActivation) minusOneLineThicknessEl.disabled = isActivation;
    else if (lineThicknessValue > 1 && isActivation === false) minusOneLineThicknessEl.disabled = isActivation;

    plusOneLineThicknessEl.disabled = isActivation;
    plusFiveLineThicknessEl.disabled = isActivation;

    if (isActivation) minusFiveGridLengthEl.disabled = isActivation;
    else if (gridLengthValue > 5 && isActivation === false) minusFiveGridLengthEl.disabled = isActivation;

    if (isActivation) minusOneGridLengthEl.disabled = isActivation;
    else if (gridLengthValue > 1 && isActivation === false) minusOneGridLengthEl.disabled = isActivation;

    plusOneGridLengthEl.disabled = isActivation;
    plusFiveGridLengthEl.disabled = isActivation;

    canvas.state.highlightData.refImgPosMinX = null;
    canvas.state.highlightData.refImgPosMinY = null;
    canvas.state.mapClicked = false;
    canvas.state.pointSelectionMode = isActivation;
    canvas.state.referenceIntersection = false;
    canvas.state.distantIntersection = false;
    canvas.state.refIntersectionCoordX = null;
    canvas.state.refIntersectionCoordY = null;
    canvas.state.distIntersectionCoordX = null;
    canvas.state.distIntersectionCoordY = null;

    showGridToggle.disabled = isActivation;
    fixGridToggle.disabled = isActivation;

    referenceIntersectionButtonEl.disabled = true;
    distantIntersectionButtonEl.disabled = true;

    referenceIntersectionButtonEl.classList.add("red-button-color");
    referenceIntersectionButtonEl.classList.remove("blue-button-color");

    distantIntersectionButtonEl.classList.add("red-button-color");
    distantIntersectionButtonEl.classList.remove("blue-button-color");

    referenceIntersectionCoordsX.innerHTML = "X: N/A";
    referenceIntersectionCoordsX.setAttribute("main-value", null);
    referenceIntersectionCoordsY.innerHTML = "Y: N/A";
    referenceIntersectionCoordsY.setAttribute("main-value", null);

    distantIntersectionCoordsX.innerHTML = "X: N/A";
    distantIntersectionCoordsX.setAttribute("main-value", null);
    distantIntersectionCoordsY.innerHTML = "Y: N/A";
    distantIntersectionCoordsY.setAttribute("main-value", null);

    if(isActivation){
        referenceIntersectionCoordsX.parentElement.classList.remove("text-big-block-disabled");    
        referenceIntersectionCoordsY.parentElement.classList.remove("text-big-block-disabled");
        distantIntersectionCoordsX.parentElement.classList.remove("text-big-block-disabled");
        distantIntersectionCoordsY.parentElement.classList.remove("text-big-block-disabled");
    }
    else{
        referenceIntersectionCoordsX.parentElement.classList.add("text-big-block-disabled");    
        referenceIntersectionCoordsY.parentElement.classList.add("text-big-block-disabled");
        distantIntersectionCoordsX.parentElement.classList.add("text-big-block-disabled");
        distantIntersectionCoordsY.parentElement.classList.add("text-big-block-disabled");
    }

    pixelCoordsX.innerHTML = "X: N/A";
    pixelCoordsY.innerHTML = "Y: N/A";

    updateMapButton.disabled = true;
}


function updateStartPointsSelectionStatus(ev){
    const checkbox = ev.currentTarget;
    const canvas = canvasFromEv(ev);

    if (checkbox.checked === false){
        const confirmed = confirm("Are you sure you want to start cancel point selection? This will clear all intersection selections.");
        if (!confirmed) {
            checkbox.checked = true;
            return;
        }
        startPointsSelection(ev, false);
    }
    else{
        startPointsSelection(ev, true);
    }
    drawImage(canvas, 0, 0, 0);
}

function toggleInstructionsDropdown(e) {
    const btn = e.currentTarget;
    const parent = btn.parentElement;

    parent.classList.toggle("open");

    btn.textContent = parent.classList.contains("open")
        ? "Instructions ▲"
        : "Instructions ▼";
}

function populateIntersection(ev, baseName){
    const curEl = ev.currentTarget;
    const defaultName = curEl.name;
    const canvas = canvasFromEv(ev);
    const coordX = document.getElementById(`${baseName}-intersection-coords-x-${defaultName}`);
    const coordY = document.getElementById(`${baseName}-intersection-coords-y-${defaultName}`);
    const newX = canvas.state.highlightData.refImgPosMinX;
    const newY = canvas.state.highlightData.refImgPosMinY;

    curEl.classList.add("blue-button-color");
    curEl.classList.remove("red-button-color");

    coordX.setAttribute("main-value", newX);
    coordX.innerHTML = `X: ${newX}`;
    coordY.setAttribute("main-value", newY);
    coordY.innerHTML = `Y: ${newY}`;
    if (baseName === "reference"){
        canvas.state.refIntersectionCoordX = newX;
        canvas.state.refIntersectionCoordY = newY;
    }
    else{
        canvas.state.distIntersectionCoordX = newX;
        canvas.state.distIntersectionCoordY = newY;
    }

}

function updateUpdateMap(ev, canvas){
    const updateMapButton = document.getElementById(`update-map-button-${ev.currentTarget.name}`);
    updateMapButton.disabled = (canvas.state.referenceIntersection === false || canvas.state.distantIntersection === false);
}

function populateReferenceIntersection(ev){
    const canvas = canvasFromEv(ev);
    populateIntersection(ev, "reference");
    canvas.state.referenceIntersection = true;
    updateUpdateMap(ev, canvas);
}

function populateDistantIntersection(ev){
    const canvas = canvasFromEv(ev);
    populateIntersection(ev, "distant");    
    canvas.state.distantIntersection = true;
    updateUpdateMap(ev, canvas);
}

function computeExpectedGridSize(baseGridSize, x1, x2, y1, y2){
    const diffX = Math.max(x1, x2) - Math.min(x1, x2);
    const diffY = Math.max(y1, y2) - Math.min(y1, y2);
    const diff = (diffX + diffY) / 2;

    const gridSquares = Math.round(diff / baseGridSize);
    const gridSize = diff / gridSquares;

    return gridSize;
}

function getMinMaxRefImgPos(refPos, totLength, gridSize, singleGridDim){
    const gridsNumberSmaller = Math.ceil(refPos / gridSize) + 1;
    let minValue = refPos - (gridSize * gridsNumberSmaller);
    const gridsNumberBigger = Math.ceil((totLength - refPos) / gridSize) + 1;
    const maxValue = refPos + (gridSize * gridsNumberBigger);
    const newLength = maxValue - minValue;
    minValue *= -1;
    const scaledLength = (gridsNumberSmaller + gridsNumberBigger) * singleGridDim;

    return {minValue, newLength, scaledLength};
}

function drawBiggerCanvas(biggerCanvas, originalCanvas, newWidth, newHeight, minX, minY, originalWidth, originalHeight){
    const biggerCanvasCtx = biggerCanvas.getContext("2d");
    biggerCanvas.width = newWidth;
    biggerCanvas.height = newHeight;

    biggerCanvasCtx.fillStyle = "black";

    biggerCanvasCtx.fillRect(0, 0, newWidth, newHeight);
    biggerCanvasCtx.drawImage(originalCanvas, 0, 0, originalWidth, originalHeight, minX, minY, originalWidth, originalHeight);
}

function scaleBiggerCanvas(biggerCanvas, scaledWidth, scaledHeight) {
    const oldWidth = biggerCanvas.width;
    const oldHeight = biggerCanvas.height;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = oldWidth;
    tempCanvas.height = oldHeight;
    tempCanvas.getContext("2d").drawImage(biggerCanvas, 0, 0);

    biggerCanvas.width = scaledWidth;
    biggerCanvas.height = scaledHeight;

    biggerCanvas.getContext("2d").drawImage(tempCanvas, 0, 0, scaledWidth, scaledHeight);
}

function updateMapButtonClick(ev){
    const canvas = canvasFromEv(ev);
    const defaultName = ev.currentTarget.name;
    const originalWidth = canvas.state.refImgWidth;
    const originalHeight = canvas.state.refImgHeight;
    const baseGridSize = canvas.state.highlightData.gridSquareSize;
    const refX = canvas.state.refIntersectionCoordX;
    const refY = canvas.state.refIntersectionCoordY;
    const distX = canvas.state.distIntersectionCoordX;
    const distY = canvas.state.distIntersectionCoordY;
    const singleGridDim = 100;

    const gridSize = computeExpectedGridSize(baseGridSize, refX, distX, refY, distY);
    const {minValue:minX, newLength:newWidth, scaledLength:scaledWidth} = getMinMaxRefImgPos(refX, originalWidth, gridSize, singleGridDim);
    const {minValue:minY, newLength:newHeight, scaledLength:scaledHeight} = getMinMaxRefImgPos(refY, originalHeight, gridSize, singleGridDim);

    const originalCanvas = document.getElementById(`old-image-content-${defaultName}`);
    const rotatedCanvas = getRotatedCanvas(originalCanvas, canvas.state.rotation);
    const biggerCanvas = document.createElement("canvas");
    drawBiggerCanvas(biggerCanvas, rotatedCanvas, newWidth, newHeight, minX, minY, originalWidth, originalHeight);
    scaleBiggerCanvas(biggerCanvas, scaledWidth, scaledHeight);

    updateImgUrl(defaultName, biggerCanvas);
    updateImgName(defaultName);
}

function generateEditableMap(defaultName, rotation){
    const baseImgEl = document.getElementById(`old-image-content-${defaultName}`);
    const rotatedImgEl = getRotatedCanvas(baseImgEl, rotation);
    const canvas = document.getElementById(`update-map-canvas-${defaultName}`);
    const zoomPlus = document.getElementById(`zoom-value-button-increase-${defaultName}`);
    const zoomMinus = document.getElementById(`zoom-value-button-decrease-${defaultName}`);
    const thicknessPlusFive = document.getElementById(`line-thickness-button-plus-five-${defaultName}`);
    const thicknessPlusOne = document.getElementById(`line-thickness-button-plus-one-${defaultName}`);
    const thicknessMinusOne = document.getElementById(`line-thickness-button-minus-one-${defaultName}`);
    const thicknessMinusFive = document.getElementById(`line-thickness-button-minus-five-${defaultName}`);
    const gridLengthPlusFive = document.getElementById(`grid-length-button-plus-five-${defaultName}`);
    const gridLengthPlusOne = document.getElementById(`grid-length-button-plus-one-${defaultName}`);
    const gridLengthMinusOne = document.getElementById(`grid-length-button-minus-one-${defaultName}`);
    const gridLengthMinusFive = document.getElementById(`grid-length-button-minus-five-${defaultName}`);
    const showGridToggle = document.getElementById(`show-grid-toggle-${defaultName}`);
    const fixGridToggle = document.getElementById(`fix-grid-toggle-${defaultName}`);
    const startPointsSelectionToggle = document.getElementById(`start-points-selection-toggle-${defaultName}`);
    const instructionsDropdown = document.getElementById(`instructions-dropdown-${defaultName}`);
    const referenceIntersectionButtonEl = document.getElementById(`reference-intersection-button-${defaultName}`);
    const distantIntersectionButtonEl = document.getElementById(`distant-intersection-button-${defaultName}`);
    const updateMapButtonEl = document.getElementById(`update-map-button-${defaultName}`);


    zoomMinus.disabled = true;
    thicknessMinusOne.disabled = true;
    thicknessMinusFive.disabled = true;
    startPointsSelectionToggle.disabled = true;
    referenceIntersectionButtonEl.disabled = true;
    distantIntersectionButtonEl.disabled = true;
    updateMapButtonEl.disabled = true;

    firstImageDrawing(canvas, rotatedImgEl, rotation);

    canvas.addEventListener("mouseup", mapMouseUp);
    canvas.addEventListener("mouseover", mapMouseOver);
    canvas.addEventListener("mouseout", mapMouseOut);
    canvas.addEventListener("mousedown", mapMouseDown);
    canvas.addEventListener("mousemove", mapMouseMoving);
    zoomPlus.addEventListener("click", increaseZoom);
    zoomMinus.addEventListener("click", decreaseZoom);
    thicknessPlusFive.addEventListener("click", increaseThicknessByFive);
    thicknessPlusOne.addEventListener("click", increaseThicknessByOne);
    thicknessMinusOne.addEventListener("click", decreaseThicknessByOne);
    thicknessMinusFive.addEventListener("click", decreaseThicknessByFive);
    gridLengthPlusFive.addEventListener("click", increaseGridLengthByFive);
    gridLengthPlusOne.addEventListener("click", increaseGridLengthByOne);
    gridLengthMinusOne.addEventListener("click", decreaseGridLengthByOne);
    gridLengthMinusFive.addEventListener("click", decreaseGridLengthByFive);
    showGridToggle.addEventListener("change", updateShowGridStatus);
    fixGridToggle.addEventListener("change", updateFixGridStatus);
    startPointsSelectionToggle.addEventListener("change", updateStartPointsSelectionStatus);
    instructionsDropdown.addEventListener("click", toggleInstructionsDropdown);
    referenceIntersectionButtonEl.addEventListener("click", populateReferenceIntersection);
    distantIntersectionButtonEl.addEventListener("click", populateDistantIntersection);
    updateMapButtonEl.addEventListener("click", updateMapButtonClick);
}

function generateMapEditBox(defaultName, rotation){
    const parentEl = document.getElementById(`map-adjust-${defaultName}`);
    const html = `
        <div class="flex-2">
            <div class="extracted-img-div col">
                <canvas name="${defaultName}" id="update-map-canvas-${defaultName}"></canvas>
            </div>
        </div>
        <div class="flex-1">
            <div class="extracted-img-div col gap-6">
                <div class="row gap-6 center-align">
                    <div class="text-big-block flex-4">
                        <span>Selected Coordinates (Original)</span>
                    </div>
                    <div class="text-big-block flex-1">
                        <span name="${defaultName}" id="pixel-coords-x-${defaultName}">X: N/A</span>
                    </div>
                    <div class="text-big-block flex-1">
                        <span name="${defaultName}" id="pixel-coords-y-${defaultName}">Y: N/A</span>
                    </div>
                </div>
                <div class="row gap-6 center-align">
                    <div class="flex-2">
                        <button name="${defaultName}" id="zoom-value-button-decrease-${defaultName}" class="increase-size-button red-button-color">N/A</button>
                    </div>
                    <div class="text-big-block flex-3">
                        <span name="${defaultName}" id="zoom-value-${defaultName}" base-name="Zoom" main-value="1">Zoom: 1</span>
                    </div>
                    <div class="flex-2">
                        <button name="${defaultName}" id="zoom-value-button-increase-${defaultName}" class="increase-size-button blue-button-color">+1</button>
                    </div>
                </div>
                <div class="row gap-6 center-align">
                    <div class="flex-1">
                        <button name="${defaultName}" id="line-thickness-button-minus-five-${defaultName}" class="increase-size-button red-button-color">-5</button>
                    </div>
                    <div class="flex-1">
                        <button name="${defaultName}" id="line-thickness-button-minus-one-${defaultName}" class="increase-size-button red-button-color">-1</button>
                    </div>
                    <div class="text-big-block flex-3">
                        <span name="${defaultName}" id="line-thickness-${defaultName}" base-name="Line Thickness" main-value="1.0">Line Thickness: 1</span>
                    </div>
                    <div class="flex-1">
                        <button name="${defaultName}" id="line-thickness-button-plus-one-${defaultName}" class="increase-size-button blue-button-color">+1</button>
                    </div>
                    <div class="flex-1">
                        <button name="${defaultName}" id="line-thickness-button-plus-five-${defaultName}" class="increase-size-button blue-button-color">+5</button>
                    </div>
                </div>
                <div class="row gap-6 center-align">
                    <div class="flex-1">
                        <button name="${defaultName}" id="grid-length-button-minus-five-${defaultName}" class="increase-size-button red-button-color">-5</button>
                    </div>
                    <div class="flex-1">
                        <button name="${defaultName}" id="grid-length-button-minus-one-${defaultName}" class="increase-size-button red-button-color">-1</button>
                    </div>
                    <div class="text-big-block flex-3">
                        <span name="${defaultName}" id="grid-length-${defaultName}" base-name="Grid Length" main-value="10.0">Grid Length: 10</span>
                    </div>
                    <div class="flex-1">
                        <button name="${defaultName}" id="grid-length-button-plus-one-${defaultName}" class="increase-size-button blue-button-color">+1</button>
                    </div>
                    <div class="flex-1">
                        <button name="${defaultName}" id="grid-length-button-plus-five-${defaultName}" class="increase-size-button blue-button-color">+5</button>
                    </div>
                </div>
                <div class="row gap-6 center-align">
                    <div class="flex-1">
                        <label class="toggle-switch">
                            <input type="checkbox" id="show-grid-toggle-${defaultName}" name="${defaultName}">
                            <div class="toggle-content">
                                <span class="toggle-text">Show Grid</span>

                                <div class="toggle-slider">
                                    <div class="toggle-knob"></div>
                                </div>
                            </div>
                        </label>
                    </div>
                    <div class="flex-1">
                        <label class="toggle-switch">
                            <input type="checkbox" id="fix-grid-toggle-${defaultName}" name="${defaultName}">
                            <div class="toggle-content">
                                <span class="toggle-text">Fix Grid On Click</span>

                                <div class="toggle-slider">
                                    <div class="toggle-knob"></div>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
                <div class="divider">
                    <span>Select Points</span>
                </div>
                <div class="row gap-6 center-align">
                    <div class="flex-1">
                        <label class="toggle-switch">
                            <input type="checkbox" id="start-points-selection-toggle-${defaultName}" name="${defaultName}">
                            <div class="toggle-content">
                                <span class="toggle-text">Start Points Selection</span>

                                <div class="toggle-slider">
                                    <div class="toggle-knob"></div>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
                <div class="row gap-6 center-align">
                    <div class="flex-1">
                        <div class="dropdown-help">
                            <button id="instructions-dropdown-${defaultName}" class="dropdown-toggle">
                                Instructions ▼
                            </button>

                            <div class="dropdown-content">
                                <span>
                                    To edit the map you must select some points. Before selecting any points, you must have the "Line Thickness" and "Grid Length" defined and must have both "Show Grid" and "Fix Grid On Click" ticked. You then can click on "Start Points Selection". After this, you'll follow a pattern to select the interest points. First you click on a position in the map, the grid will be highlighted showing you how will the lines behave. You must always click on the intersection of the grids. After you click on the intersection, the highlight of the grid will be fixed until you click again - you can drag the map normally without changing the fixed point - and then if you click on another point it'll be fixed as normal. The position you choose will be shown on "Selected Coordinates (Original)". You'll then start to define the points, the first definition you must make is the "Reference Intersection", and you'll click on it after you have a fixed point. When you click it it'll save the data of the intersection, the "Grid Length" and "Line Thickness". The "Grid Length" doesn't need to be 100% precise, but must be as good as possible. After this, you have another option to select, the "Distant Intersection". The "Distant Intersection" is important to fine tune the "Grid Length", by selecting an intersection that is distant from your "Reference Intersection" you can get a more precise "Grid Length" value.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row gap-6 center-align">
                    <div class="flex-4">
                        <button name="${defaultName}" id="reference-intersection-button-${defaultName}" class="increase-size-button red-button-color">Reference Intersection</button>
                    </div>
                    <div class="text-big-block text-big-block-disabled flex-1">
                        <span name="${defaultName}" id="reference-intersection-coords-x-${defaultName}" main-value="null">X: N/A</span>
                    </div>
                    <div class="text-big-block text-big-block-disabled flex-1">
                        <span name="${defaultName}" id="reference-intersection-coords-y-${defaultName}" main-value="null">Y: N/A</span>
                    </div>
                </div>
                <div class="row gap-6 center-align">
                    <div class="flex-4">
                        <button name="${defaultName}" id="distant-intersection-button-${defaultName}" class="increase-size-button red-button-color">Distant Intersection</button>
                    </div>
                    <div class="text-big-block text-big-block-disabled flex-1">
                        <span name="${defaultName}" id="distant-intersection-coords-x-${defaultName}" main-value="null">X: N/A</span>
                    </div>
                    <div class="text-big-block text-big-block-disabled flex-1">
                        <span name="${defaultName}" id="distant-intersection-coords-y-${defaultName}" main-value="null">Y: N/A</span>
                    </div>
                </div>
                <div class="row gap-6 center-align">
                    <div class="flex-1">
                        <button name="${defaultName}" id="update-map-button-${defaultName}" class="increase-size-button red-button-color">Update Map</button>
                    </div>
                </div>
            </div>
        </div>
    `
    parentEl.innerHTML = html;
    generateEditableMap(defaultName, rotation);
}

function adjustMap(defaultName, rotation) {
    generateMapEditBox(defaultName, rotation);
}