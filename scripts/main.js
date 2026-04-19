document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("file-upload");
    const dropZone = document.getElementById("drop-zone");
    const cancelExtraction = document.getElementById("cancel-extraction");
    const approveExtraction = document.getElementById("approve-extraction");
    const downloadZip = document.getElementById("download-zip");


    dropZone.addEventListener("drop", dropZoneHandler);
    fileInput.addEventListener("change", changeFile);
    cancelExtraction.addEventListener("click", handleCancelExtraction);
    approveExtraction.addEventListener("click", handleApproveExtraction);

    downloadZip.addEventListener("click",handleDownloadZip);
    window.addEventListener("drop", windowDrop);
    dropZone.addEventListener("dragover", dropZoneDragover);
    dropZone.addEventListener("dragleave", dropZoneDragleave);
    window.addEventListener("dragover", windowDragover);

});
