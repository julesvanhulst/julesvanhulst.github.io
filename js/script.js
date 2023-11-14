document.addEventListener("DOMContentLoaded", init, false);

var grayOut = document.getElementById("grayout");
var photos = document.getElementsByClassName('photos');
var zoom = document.getElementById('zoom');
var border = document.getElementById('border');
var cross = document.getElementById('cross');
var album = document.getElementById('album');
var prev = document.getElementById('prev');
var next = document.getElementById('next');
var currentImageIndex = 0;

const imgNumber = 15;

function init() {
	drawAlbum();

	for(let i = 0; i < photos.length; i++) {
		photos[i].addEventListener("click", function() { showImage(i); }, false);
	}

	prev.addEventListener("click", showPrev, false);
	next.addEventListener("click", showNext, false);

	cross.addEventListener("click", close, false);
}

function showImage(index) {
	let img = new Image();
	img.src = "./images/photos/IMG_" + (index + 1) + ".jpg";

	let imageSize = size(document.documentElement.clientWidth, document.documentElement.clientHeight, img.width, img.height);

	zoom.style.backgroundImage = "url('./images/photos/IMG_" + (index + 1) + ".jpg')";
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

	for (var i = 1; i <= imgNumber; i++) {

		let photo = document.createElement("a");
		let url = "url('./images/photos/IMG_" + i + ".jpg')";
		
		photo.name = "IMG_" + i + ".jpg";
		photo.classList.add("photos");
		photo.style.backgroundImage = url;
		
		album.appendChild(photo);
	}
}

function showPrev() {
	currentImageIndex = Math.max(0, currentImageIndex - 1); // Make sure it doesn't go below 0
	showImage(currentImageIndex);
}

function showNext() {
	currentImageIndex = Math.min(imgNumber - 1, currentImageIndex + 1); // Make sure it doesn't go above imgNumber - 1
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