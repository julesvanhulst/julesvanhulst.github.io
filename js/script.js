document.addEventListener("DOMContentLoaded", init, false);

let imgList = [];

const GRAYOUT = document.getElementById("grayout");
const ZOOM = document.getElementById('zoom');
const BORDER = document.getElementById('border');

let currentImgIndex = 0;
let isFlip = false;
let isZoom = false;
let viewWidth = window.innerWidth;
let viewHeight = window.innerHeight;

async function loadManifest() {
    const response = await fetch('./images/photos/manifest.json');
    const files = await response.json();
    imgList = files.map(filename => ({
        nom: filename.replace('.jpg', ''),
        url: `https://julesvanhulst.github.io/images/photos/${filename}`
    }));
}

async function init() {
    await loadManifest();
    drawAlbum();
    addListenerToAlbum();

    document.getElementById('prev').addEventListener("click", showPrev, false);
    document.getElementById('next').addEventListener("click", showNext, false);

    document.body.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") showNext();
        else if (e.key === "ArrowLeft") showPrev();
        else if (e.key === "Escape") closeImage();
    });

    GRAYOUT.addEventListener("click", closeImage, false);

    window.addEventListener("resize", () => {
        viewWidth = window.innerWidth;
        viewHeight = window.innerHeight;
        if (isZoom) {
            closeImage();
            showImage(currentImgIndex);
        }
    });
}

function showImage(index) {
    GRAYOUT.style.display = "block";

    const img = new Image();
    img.src = imgList[index].url;

    img.onload = () => {
        const imageSize = getImageSize(img.naturalWidth, img.naturalHeight);
        ZOOM.style.backgroundImage = "url(" + imgList[index].url + ")";
        BORDER.style.display = "flex";
        setSize(ZOOM, imageSize.w, imageSize.h);
        setSize(BORDER, imageSize.w + 8, imageSize.h + 8);
    };

    currentImgIndex = index;
    isZoom = true;
}

function closeImage() {
    GRAYOUT.style.display = "none";
    BORDER.style.display = "none";
    isZoom = false;
}

function drawAlbum() {
    const album = document.getElementById('album');
    for (let i = 0; i < imgList.length; i++) {
        const photo = document.createElement("a");
        photo.id = imgList[i].nom + ".jpg";
        photo.style.backgroundImage = "url(" + imgList[i].url + ")";
        photo.classList.add("photos");
        album.appendChild(photo);
    }
}

function addListenerToAlbum() {
    const photos = document.getElementsByClassName("photos");
    if (!isFlip) {
        for (let i = 0; i < photos.length; i++)
            photos[i].addEventListener("click", function () { showImage(i); }, false);
    } else {
        for (let i = photos.length - 1; i >= 0; i--)
            photos[i].addEventListener("click", function () { showImage(i); }, false);
    }
}

function showPrev() {
    currentImgIndex = (currentImgIndex - 1 + imgList.length) % imgList.length;
    closeImage();
    showImage(currentImgIndex);
}

function showNext() {
    currentImgIndex = (currentImgIndex + 1) % imgList.length;
    closeImage();
    showImage(currentImgIndex);
}

function setSize(element, eWidth, eHeight) {
    if (typeof eWidth === 'string') {
        element.style.width = eWidth;
        element.style.height = eHeight;
    } else {
        element.style.width = eWidth + "px";
        element.style.height = eHeight + "px";
    }
}

function getImageSize(imgWidth, imgHeight) {
    let finalWidth, finalHeight;
    const margin = 125;
    const vMargin = 50;
    const hMargin = 50;
    const ratio = imgHeight / imgWidth;
    const invertRatio = imgWidth / imgHeight;

    if (isMobile()) {
        finalWidth = viewWidth - hMargin;
        finalHeight = finalWidth * ratio;
        if (finalHeight >= viewHeight * 0.75) {
            finalHeight = viewHeight * 0.75;
            finalWidth = finalHeight * invertRatio;
        }
    } else {
        finalHeight = viewHeight - margin;
        finalWidth = finalHeight * invertRatio;
        if (finalWidth >= viewWidth) {
            finalWidth = viewWidth - margin;
            finalHeight = finalWidth * ratio;
        }
    }
    return { w: finalWidth, h: finalHeight };
}

function isMobile() {
    return viewWidth <= 1079;
}

function changeOrder() {
    const date = document.getElementById("date-arrow");
    flip(date);
    imgList = imgList.reverse();
    setTimeout(() => {
        document.getElementById('album').innerHTML = '';
        drawAlbum();
        addListenerToAlbum();
    }, 200);
}

function flip(element) {
    if (element.classList.contains("flip")) {
        isFlip = false;
        element.classList.remove("flip");
    } else {
        isFlip = true;
        element.classList.add("flip");
    }
}