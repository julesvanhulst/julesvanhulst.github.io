document.addEventListener("DOMContentLoaded", init, false);

let imgList = [];
let metadataMap = {};

const GRAYOUT = document.getElementById("grayout");
const ZOOM = document.getElementById('zoom');
const BORDER = document.getElementById('border');

let currentImgIndex = 0;
let isFlip = false;
let isZoom = false;
let viewWidth = window.innerWidth;
let viewHeight = window.innerHeight;

async function loadManifest() {
    const response = await fetch('./images/photos/metadata.json');
    metadataMap = await response.json();
    imgList = Object.keys(metadataMap)
        .sort((a, b) => {
            const n = s => parseInt(s.replace('IMG_', '').replace('.jpg', ''));
            return n(a) - n(b);
        })
        .map(filename => ({
            nom: filename.replace('.jpg', ''),
            url: `https://julesvanhulst.github.io/images/photos/${filename}`,
            filename
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
        updateExifPanel(metadataMap[imgList[index].filename] || null);
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
        const photo = document.createElement("div");
        photo.classList.add("photos");

        const img = document.createElement("img");
        img.src = imgList[i].url;
        img.loading = "lazy";
        img.alt = imgList[i].nom;

        photo.appendChild(img);
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

function updateExifPanel(meta) {
    const panel = document.getElementById('exif-info');
    panel.innerHTML = '';

    if (!meta) {
        panel.style.display = 'none';
        return;
    }

    const items = [];

    if (meta.location) {
        const url = meta.gps ? `https://www.google.com/maps?q=${meta.gps.lat},${meta.gps.lon}` : null;
        items.push({ text: meta.location, url });
    }

    if (meta.date) {
        const d = new Date(meta.date + 'T12:00:00');
        items.push({ text: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) });
    }

    const settings = [
        meta.aperture,
        meta.shutter,
        meta.iso ? `ISO\u00A0${meta.iso}` : null,
        meta.focal_length
    ].filter(Boolean);
    if (settings.length) items.push({ text: settings.join(' · ') });

    if (meta.camera) items.push({ text: meta.camera });

    if (items.length === 0) {
        panel.style.display = 'none';
        return;
    }

    items.forEach((item, i) => {
        if (i > 0) {
            const sep = document.createElement('span');
            sep.className = 'exif-sep';
            sep.textContent = '·';
            panel.appendChild(sep);
        }
        if (item.url) {
            const a = document.createElement('a');
            a.href = item.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = item.text;
            panel.appendChild(a);
        } else {
            const span = document.createElement('span');
            span.textContent = item.text;
            panel.appendChild(span);
        }
    });

    panel.style.display = 'flex';
}