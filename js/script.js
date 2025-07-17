document.addEventListener("DOMContentLoaded", init, false);

let imgList = generateImageList(22);

const GRAYOUT = document.getElementById("grayout");
const ZOOM = document.getElementById('zoom');
const BORDER = document.getElementById('border');
const TOTAL_IMG = imgList.length;

let currentImgIndex = 0;
let isFlip = false;
let isZoom = false;

let viewWidth = window.innerWidth;
let viewHeight = window.innerHeight;

function init() {
    drawAlbum();
    addListenerToAlbum();

    document.getElementById('prev').addEventListener("click", showPrev, false);
    document.getElementById('next').addEventListener("click", showNext, false);

    document.body.addEventListener("keydown", (e) => {
        if(e.key === "ArrowRight")
            showNext();
        else if(e.key === "ArrowLeft")
            showPrev();
    });

    GRAYOUT.addEventListener("click", closeImage, false);

    window.addEventListener("resize", () => {
        viewWidth = window.innerWidth;
        viewHeight = window.innerHeight;
        if(isZoom) {
            closeImage();
            showImage(currentImgIndex);
        }
    });
}

function showImage(index) {
    GRAYOUT.style.display = "block";

    let img = new Image();
    img.src = imgList[index].url;

    let imageSize = getImageSize(img.width, img.height);

    ZOOM.style.backgroundImage = "url(" + imgList[index].url + ")";
    BORDER.style.display = "flex";

    setSize(ZOOM, imageSize.w, imageSize.h);
    setSize(BORDER, imageSize.w + 8, imageSize.h + 8)

	currentImgIndex = index;
    isZoom = true;
}

function closeImage() {
    GRAYOUT.style.display = "none";
    BORDER.style.display = "none";
    isZoom = false;
}

function drawAlbum() {
    let album = document.getElementById('album');
    for (let i = 0; i < imgList.length; i++) {
        let photo = document.createElement("a");

        photo.id = imgList[i].nom + ".jpg";
        photo.style.backgroundImage = "url(" + imgList[i].url + ")";
        photo.classList.add("photos");

        album.appendChild(photo);
    }
}

function removeAlbum() {
    let oldAlbum = document.getElementById('album');
    let newAlbum = document.createElement("div");
    newAlbum.id = "album";
    oldAlbum.after(newAlbum);
    oldAlbum.remove();
}

function addListenerToAlbum() {
    let photos = document.getElementsByClassName("photos");
    if(!isFlip) {
        for(let i = 0; i < photos.length; i++)
            photos[i].addEventListener("click", function() { showImage(i); }, false);
    } else {
        for(let i = photos.length - 1; i >= 0; i--)
            photos[i].addEventListener("click", function() { showImage(i); }, false);
    }
}

function showPrev() {
    currentImgIndex--;
    if(currentImgIndex < 0)
        currentImgIndex = TOTAL_IMG - 1;
    closeImage();
    showImage(currentImgIndex);
}

function showNext() {
    currentImgIndex++;
    if(currentImgIndex >= TOTAL_IMG)
        currentImgIndex = 0;
    closeImage();
    showImage(currentImgIndex);
}

function setSize(element, eWidth, eHeight) {
    if(typeof eWidth === 'string') {
        element.style.width = eWidth;
        element.style.height = eHeight;
    } else {
        element.style.width = eWidth + "px";
        element.style.height = eHeight + "px";
    }
}

function getImageSize(imgWidth, imgHeight) {
    let finalWidth;
    let finalHeight;

    let margin = 125;
    let vMargin = 50;
    let hMargin = 50;

    let ratio = imgHeight / imgWidth;
    let invertRatio = imgWidth / imgHeight;

    if(isMobile()) {
        finalWidth = viewWidth - hMargin;
        finalHeight = finalWidth * ratio;

        if(finalHeight >= viewHeight) {
            finalHeight = viewHeight - vMargin;
            finalWidth = finalHeight * invertRatio;
        }
    } else {
        finalHeight = viewHeight - margin;
        finalWidth = finalHeight * invertRatio;

        if(finalWidth >= viewWidth) {
            finalWidth = viewWidth - margin;
            finalHeight = finalWidth * ratio;
        }
    }
    return {w: finalWidth, h: finalHeight};
}

function isMobile() {
	return viewWidth <= 1079;
}

function changeOrder() {
    let date = document.getElementById("date-arrow");
    flip(date);
    imgList = imgList.reverse();

    setTimeout(function () {
        removeAlbum();
        drawAlbum();
        addListenerToAlbum()
    }, 200);
}

function flip(element) {
    if(element.classList.contains("flip")) {
        isFlip = false;
        element.classList.remove("flip");
    } else {
        isFlip = true;
        element.classList.add("flip");
    }
}

function generateImageList(nbPhotos) {
    const images = [];
    for (let i = 0; i < nbPhotos; i++) {
    images.push({
        nom: `IMG_${i}`,
        url: `https://julesvanhulst.github.io/images/photos/IMG_${i}.jpg`
    });
    }
    return images;
}