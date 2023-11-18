document.addEventListener("DOMContentLoaded", init, false);

let imgList = {
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

imgList = imgList.image;

const GRAYOUT = document.getElementById("grayout");
const ZOOM = document.getElementById('zoom');
const BORDER = document.getElementById('border');
const TOTAL_IMG = imgList.length;

let currentImageIndex = 0;

function init() {
	drawAlbum();

    let photos = document.getElementsByClassName('photos');
	for(let i = 0; i < photos.length; i++)
		photos[i].addEventListener("click", function() { showImage(i); }, false);

    document.getElementById('prev').addEventListener("click", showPrev, false);
    document.getElementById('next').addEventListener("click", showNext, false);

	document.body.addEventListener("keydown", (e) => {
        if(e.key === "ArrowRight")
            showNext();
        else if(e.key === "ArrowLeft")
            showPrev();
    });

	GRAYOUT.addEventListener("click", closeImage, false);
}

function showImage(index) {
	GRAYOUT.style.display = "block";

	let img = new Image();
	img.src = imgList[index].url;

	let imageSize = getImageSize(GRAYOUT.clientWidth, GRAYOUT.clientHeight, img.width, img.height);

	ZOOM.style.backgroundImage = "url(" + imgList[index].url + ")";
	BORDER.style.display = "flex";

    setSize(ZOOM, imageSize.w, imageSize.h);
    setSize(BORDER, imageSize.w + 8, imageSize.h + 8)

	currentImageIndex = index;
}

function closeImage() {
	GRAYOUT.style.display = "none";
	BORDER.style.display = "none";
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

function showPrev() {
    currentImageIndex--;
    if(currentImageIndex < 0)
        currentImageIndex = TOTAL_IMG - 1;
    showImage(currentImageIndex);
}

function showNext() {
    currentImageIndex++;
    if(currentImageIndex >= TOTAL_IMG)
        currentImageIndex = 0;
    showImage(currentImageIndex);
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

function getImageSize(viewWidth, viewHeight, imgWidth, imgHeight) {
    let finalWidth;
    let finalHeight;

    let margin = 125;
    let vMargin = 50;
    let hMargin = 25;

    let ratio = imgHeight / imgWidth;
    let invertRatio = imgWidth / imgHeight;

    if(isMobile(viewWidth)) {
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

function isMobile(width) {
	return width <= 1079;
}