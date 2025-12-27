var baseUrl = "https://ik.imagekit.io/ivw8jbdbt/TBLX/";

// ========================================
// GLITCH EFFECT (Optional JS Enhancements)
// ========================================

// No JS needed for basic CSS glitch, but we can add random triggers here if desired.


function getRandomIndex(max) {
  return Math.floor(Math.random() * max) + 1;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function createItemElement(index) {
  var itemDiv = document.createElement("div");
  itemDiv.className = "item";
  itemDiv.setAttribute("itemscope", "");
  itemDiv.setAttribute("itemtype", "https://schema.org/ImageObject");

  var pictureElement = document.createElement("picture");

  var sourceAvifElement = document.createElement("source");
  sourceAvifElement.setAttribute("type", "image/avif");
  sourceAvifElement.setAttribute("srcset", baseUrl + index + ".avif");

  var sourceJpegElement = document.createElement("source");
  sourceJpegElement.setAttribute("type", "image/jpeg");
  sourceJpegElement.setAttribute("srcset", baseUrl + index + ".jpg");

  var imgElement = document.createElement("img");
  imgElement.setAttribute("src", baseUrl + index + ".jpg");
  imgElement.setAttribute("alt", "The Blacklist Poster " + index);
  imgElement.setAttribute("loading", "lazy");
  imgElement.setAttribute("itemprop", "contentUrl");

  var metaUrl = document.createElement("meta");
  var metaCaption = document.createElement("meta");

  metaUrl.setAttribute("itemprop", "url");
  metaUrl.setAttribute("content", baseUrl + index + ".avif");
  metaCaption.setAttribute("itemprop", "caption");
  metaCaption.setAttribute("content", "The Blacklist Poster " + index)

  pictureElement.appendChild(sourceAvifElement);
  pictureElement.appendChild(sourceJpegElement);
  itemDiv.appendChild(pictureElement);
  itemDiv.appendChild(imgElement);
  itemDiv.appendChild(metaUrl);
  itemDiv.appendChild(metaCaption);

  return itemDiv;
}

function validNoAdjacent(array) {
  for (let i = 0; i < array.length - 1; i++) {
    if (array[i] === array[i + 1]) {
      for (let j = i + 2; j < array.length; j++) {
        if (array[j] !== array[i] && array[j] !== array[i + 2]) {
          [array[i + 1], array[j]] = [array[j], array[i + 1]];
          break;
        }
      }
    }
  }
}

function populateGallery() {
  var itemsContainer = document.querySelector(".items");
  itemsContainer.innerHTML = "";

  var totalAvailableImages = 20;
  // Create 7 rows
  for (let r = 0; r < 7; r++) {
    let rowDiv = document.createElement("div");
    rowDiv.className = "row";

    // Items per row: 20 images
    let itemsPerSet = 20;
    let baseIndexes = [];

    for (let i = 0; i < itemsPerSet; i++) {
      baseIndexes.push((i % totalAvailableImages) + 1);
    }

    shuffleArray(baseIndexes);
    validNoAdjacent(baseIndexes);

    // Triplicate for seamless loop and gap prevention: [A][A][A]
    let fullRowIndexes = [...baseIndexes, ...baseIndexes, ...baseIndexes];

    fullRowIndexes.forEach(index => {
      rowDiv.appendChild(createItemElement(index));
    });

    itemsContainer.appendChild(rowDiv);
  }

  requestAnimationFrame(() => animateGallery());
}

function animateGallery() {
  // 1. Scroll Zoom Effect (Preserved)
  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".wrapper",
      pin: true,
      scrub: 2,
      start: "top top",
      end: "50%+=500px",
    },
  });

  tl.to(".row img", { scale: 1 }, 0);
  // Scale down to show more rows/fit 2-3 rows nicely. 0.8 scale usually fits ~3 rows on desktop
  tl.to(".items", { scale: 0.8, rotate: 0 }, 0);
  // Fade in semi-transparent background for text readability
  tl.to(".overlay", { height: "100%", backgroundColor: "rgba(0, 0, 0, 0.6)" }, 0.2);
  // Slide up title with fade-in and scale for cinematic entrance
  tl.to(".overlay h1", {
    scale: 1,
    y: 0,
    opacity: 1,
    ease: "power2.out"
  }, 0.6);
  // Dim images slightly when text appears
  tl.to(".items", { opacity: 0.3 }, 0.6);

  // 2. Marquee Animation (Rows moving opposite directions)
  // Rows inside .items (which is rotated 45deg)
  // Row 1 & 3: Move Left (or Right)
  // Row 2: Move Opposite

  // We need to animate 'x' percent. 
  // Loop logic: width of one set is 33.33% of the total row width (since we have 3 sets).
  // Move from 0 to -33.33% (Left) OR -33.33% to 0 (Right) to loop perfectly

  document.querySelectorAll('.row').forEach((row, i) => {
    // Determine direction: Odd rows left, Even rows right
    let isEven = i % 2 === 0;

    // One set is 1/3 of the width (since we tripled it)
    // -33.333% is the width of one full set of 20 images
    let moveDistance = 100 / 3;

    let startX = isEven ? 0 : -moveDistance;
    let endX = isEven ? -moveDistance : 0;

    // Set initial with some random offset to make rows look different
    // We can use gsap's negative delay or progress to offset the starting point of the loop
    // BUT simply setting x to a random value might break the loop seam.
    // Better strategy: Animate normally, but seek to a random time.

    // Create the tween
    let tween = gsap.fromTo(row,
      { xPercent: startX },
      {
        xPercent: endX,
        ease: "none",
        repeat: -1,
        duration: isEven ? 40 : 50, // Slight speed variation
        force3D: true
      }
    );

    // Randomize start position while keeping the loop valid
    // progress(0..1) effectively fast-forwards the animation
    // Deterministic offsets for 5 rows: 0, 0.4, 0.8, 0.2, 0.6
    let startProgress = 0;
    const offsets = [0, 0.4, 0.8, 0.2, 0.6];

    if (i < offsets.length) {
      startProgress = offsets[i];
    } else {
      startProgress = Math.random();
    }

    tween.progress(startProgress);
  });
}

populateGallery();
