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
    var imgElement = document.createElement("img");

    // Use data-src attribute for lazy loading
    imgElement.setAttribute("data-src", "https://ik.imagekit.io/ivw8jbdbt/TBLX/" + index + ".jpg");

    imgElement.alt = "Image " + index;
    itemDiv.appendChild(imgElement);
    itemsContainer.appendChild(itemDiv);
  }

    startLazyLoading();
    animateGallery();
  }
  
  function startLazyLoading() {
    // Find all images with data-src attribute
    var lazyImages = document.querySelectorAll("img[data-src]");
  
    // Intersection Observer configuration
    var ioConfig = {
      rootMargin: "200px", // Load images 200px before they enter the viewport
    };
  
    // Intersection Observer callback
    var ioCallback = function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          var src = img.getAttribute("data-src");
          img.setAttribute("src", src);
          img.removeAttribute("data-src");
          observer.unobserve(img); // Stop observing after loading the image
        }
      });
    };
  
    // Create Intersection Observer
    var io = new IntersectionObserver(ioCallback, ioConfig);
  
    // Observe all lazy images
    lazyImages.forEach(function (lazyImage) {
      io.observe(lazyImage);
    });
  }

  function animateGallery() {
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".wrapper",
        pin: true,
        scrub: 2,
        start: "top top",
        end: "50%+=500px",
      }
    });
  
    tl.to(".items img", { scale: 1 }, 0);
    tl.to(".items", { scale: 2, rotate: 0 }, 0);
  
    tl.to(".overlay", { height: "100%" }, 0.2);
    tl.to(".overlay h1", { scale: 1 }, 0.6);
    tl.to(".items", { scale: 1, opacity: 0.2 }, 0.6);
  }
  
  var numberOfImages = 19;
  populateGallery(numberOfImages);