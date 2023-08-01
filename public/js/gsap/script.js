var baseUrl = "https://ik.imagekit.io/ivw8jbdbt/TBLX/";

function getRandomIndex(max) {
  return Math.floor(Math.random() * max) + 1;
}

function populateGallery(imageCount) {
  var itemsContainer = document.querySelector(".items");
  itemsContainer.innerHTML = "";

  var totalAvailableImages = 10;
  var first10Images = 10;

  var randomizedIndexes = [];
  var fixedIndexes = [];

  // Get 10 random indexes for the subsequent images
  while (randomizedIndexes.length < imageCount - first10Images) {
    var randomIndex = getRandomIndex(totalAvailableImages);
    if (!randomizedIndexes.includes(randomIndex) && !fixedIndexes.includes(randomIndex)) {
      randomizedIndexes.push(randomIndex);
    }
  }

  // Get the fixed indexes for the first 10 images
  for (let i = 1; i <= first10Images; i++) {
    fixedIndexes.push(i);
  }

  // Concatenate the fixed and randomized indexes
  var allIndexes = fixedIndexes.concat(randomizedIndexes);

  // Create the item divs with images based on the indexes
  for (let index of allIndexes) {
    var itemDiv = document.createElement("div");
    itemDiv.className = "item";

    itemDiv.setAttribute("itemscope", "");
    itemDiv.setAttribute("itemtype", "https://schema.org/ImageObject");

    // Create a picture element
    var pictureElement = document.createElement("picture");

    // Create the AVIF source element
    var sourceAvifElement = document.createElement("source");
    sourceAvifElement.setAttribute("type", "image/avif");
    sourceAvifElement.setAttribute("srcset", baseUrl + index + ".avif");

    // Create the JPEG fallback source element
    var sourceJpegElement = document.createElement("source");
    sourceJpegElement.setAttribute("type", "image/jpeg");
    sourceJpegElement.setAttribute("srcset", baseUrl + index + ".jpg");

    // Create the img element for browsers that don't support the "picture" element
    var imgElement = document.createElement("img");
    imgElement.setAttribute("src", baseUrl + index + ".jpg");
    imgElement.setAttribute("alt", "The Blacklist Poster " + index);
    
    // Schema
    imgElement.setAttribute("itemprop", "contentUrl");

    var metaUrl = document.createElement("meta");
    var metaCaption = document.createElement("meta");

    metaUrl.setAttribute("content", baseUrl + index + ".avif");
    metaCaption.setAttribute("content", "The Blacklist Poster " + index)

    // Append the source elements to the picture element
    pictureElement.appendChild(sourceAvifElement);
    pictureElement.appendChild(sourceJpegElement);

    // Append the picture element to the item div
    itemDiv.appendChild(pictureElement);

    // Append the img element to the item div (for browsers that don't support "picture")
    itemDiv.appendChild(imgElement);

    // Append the meta element to the item div
    itemDiv.appendChild(metaUrl);
    itemDiv.appendChild(metaCaption);

    // Append the item div to the items container
    itemsContainer.appendChild(itemDiv);
  }

  animateGallery();
}

function animateGallery() {
  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".wrapper",
      pin: true,
      scrub: 2,
      start: "top top",
      end: "50%+=500px",
    },
  });

  tl.to(".items img", { scale: 1 }, 0);
  tl.to(".items", { scale: 2, rotate: 0 }, 0);

  tl.to(".overlay", { height: "100%" }, 0.2);
  tl.to(".overlay h1", { scale: 1 }, 0.6);
  tl.to(".items", { scale: 1, opacity: 0.2 }, 0.6);
}

var numberOfImages = 20;
populateGallery(numberOfImages);