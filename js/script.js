document.addEventListener("DOMContentLoaded", init, false);

var grayOut = document.getElementById("grayout");
var photos = document.getElementsByClassName('photos');
var zoom = document.getElementById('zoom');
var border = document.getElementById('border');
var album = document.getElementById('album');
var prev = document.getElementById('prev');
var next = document.getElementById('next');

var currentImageIndex = 0;
var imgNumber = 0;
var url;

async function init() {
    url = await getUrl("../images/images.json");
    imgNumber = url.image.length;

	drawAlbum(url);

	for(let i = 0; i < photos.length; i++) {
		photos[i].addEventListener("click", function() { showImage(i); }, false);
	}

	prev.addEventListener("click", showPrev, false);
	next.addEventListener("click", showNext, false);

	document.body.addEventListener("keydown", (e) => {
        if(e.key == "ArrowRight") {
            showNext();
        } else if(e.key == "ArrowLeft") {
            showPrev();
        }
    });

	grayOut.addEventListener("click", close, false);
}

async function getUrl(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Échec du chargement du fichier JSON : ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur lors du chargement du fichier JSON :', error);
        throw error;
    }
}

function showImage(index) {
	let img = new Image();
	img.src = url.image[index].url;

	let imageSize = size(document.documentElement.clientWidth, document.documentElement.clientHeight, img.width, img.height);

	zoom.style.backgroundImage = "url('" + url.image[index].url + "')";
	border.style.display = "flex";

	zoom.style.width = imageSize.x + "px";
	zoom.style.height = imageSize.y + "px";

	border.style.width = (imageSize.x + 8) + "px";
	border.style.height = (imageSize.y + 8) + "px";

	grayOut.style.display = "block";

	currentImageIndex = index;
}

function close() {
	grayOut.style.display = "none";
	border.style.display = "none";
	border.style.width = "340px";
	border.style.height = "340px";
}

function drawAlbum() {
	for (var i = 0; i < url.image.length; i++) {

		let photo = document.createElement("a");

		photo.name = url.image[i].nom + ".jpg";
		photo.style.backgroundImage = "url('" + url.image[i].url + "')";
		photo.classList.add("photos");

		album.appendChild(photo);
	}
}

function showPrev() {
    currentImageIndex--;
    if(currentImageIndex < 0) {
        currentImageIndex = imgNumber - 1;
    }
    showImage(currentImageIndex);
}

function showNext() {
    currentImageIndex++;
    if(currentImageIndex >= imgNumber) {
        currentImageIndex = 0;
    }
    showImage(currentImageIndex);
}

function size(vWidth, vHeight, iWidth, iHeight) {
	let x = 0;
	let y = 0;

	let ratio = iHeight / iWidth;
	let iRatio = iWidth / iHeight;

	if(isMobile(vWidth)) {
		x = vWidth - 25;
		y = x * ratio;
		if(y >= vHeight) {
			y = vHeight - 75;
			x = y * iRatio;
		}
	} else {
		y = vHeight - 200;
		x = y * iRatio;
		if(x >= vWidth) {
			x = vWidth - 200;
			y = x * ratio;
		}
	}

	return {x, y};
}

function isMobile(width) {
	return width <= 1079;
}