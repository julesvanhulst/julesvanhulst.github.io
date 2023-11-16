document.addEventListener("DOMContentLoaded", init, false);

var url = {
            "image": [
              {
                "nom": "IMG_0",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075578106773576/IMG_0.jpg"
              },
              {
                "nom": "IMG_1",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075778938449920/IMG_1.jpg"
              },
              {
                "nom": "IMG_2",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075797326270544/IMG_2.jpg"
              },
              {
                "nom": "IMG_3",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075805303840909/IMG_3.jpg"
              },
              {
                "nom": "IMG_4",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075816678797332/IMG_4.jpg"
              },
              {
                "nom": "IMG_5",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075826443124868/IMG_5.jpg"
              },
              {
                "nom": "IMG_6",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075837629333565/IMG_6.jpg"
              },
              {
                "nom": "IMG_7",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075845363638402/IMG_7.jpg"
              },
              {
                "nom": "IMG_8",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075853043400754/IMG_8.jpg"
              },
              {
                "nom": "IMG_9",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075860995809410/IMG_9.jpg"
              },
              {
                "nom": "IMG_10",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075871880019978/IMG_10.jpg"
              },
              {
                "nom": "IMG_11",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075877638811759/IMG_11.jpg"
              },
              {
                "nom": "IMG_12",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075887822569583/IMG_12.jpg"
              },
              {
                "nom": "IMG_13",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075899268841492/IMG_13.jpg"
              },
              {
                "nom": "IMG_14",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075906214613113/IMG_14.jpg"
              },
              {
                "nom": "IMG_15",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075913638527026/IMG_15.jpg"
              },
              {
                "nom": "IMG_16",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075926108192778/IMG_16.jpg"
              },
              {
                "nom": "IMG_17",
                "url": "https://cdn.discordapp.com/attachments/706768779086135337/1174075935608291388/IMG_17.jpg"
              }
            ]
          };

var grayOut = document.getElementById("grayout");
var photos = document.getElementsByClassName('photos');
var zoom = document.getElementById('zoom');
var border = document.getElementById('border');
var album = document.getElementById('album');
var prev = document.getElementById('prev');
var next = document.getElementById('next');

var currentImageIndex = 0;
var imgNumber = url.image.length;

function init() {
	drawAlbum();

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