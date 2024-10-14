let video = document.getElementById('videoInput');
let canvas1 = document.getElementById('canvas1');
let canvas = document.getElementById('canvasOutput');
let context = canvas.getContext('2d');
const constraints = {
  video: {
    facingMode: 'environment',
  },
};
let streaming = false;
let width = null;
let height = null;

const FPS = 10;

function onOpenCvReady() {
  console.log('OpenCV.js is ready');
  startCamera();
}

function startCamera() {
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      video.srcObject = stream;
      video.play();
      streaming = true;
    })
    .catch(function (err) {
      console.log('Error: ' + err);
    });

  video.addEventListener(
    'canplay',
    function () {
      if (!streaming) {
        return;
      }

      // Set widths and heights of the video and canvas elements to be equal.
      width = video.videoWidth;
      height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;

      processVideo();
    },
    false,
  );

  width = video.width;
  height = video.height;
}

function processVideo() {
  let src = new cv.Mat(height, width, cv.CV_8UC4);
  let gray = new cv.Mat(height, width, cv.CV_8UC1);
  let blurred = new cv.Mat(height, width, cv.CV_8UC1);
  let edges = new cv.Mat(height, width, cv.CV_8UC1);
  let dilated = new cv.Mat(height, width, cv.CV_8UC1);
  let eroded = new cv.Mat(height, width, cv.CV_8UC1);
  let closed = new cv.Mat(height, width, cv.CV_8UC1);
  let detected = new cv.Mat(height, width, cv.CV_8UC1);

  let M = cv.Mat.ones(5, 5, cv.CV_8U);

  function captureFrame() {
    if (!streaming) return;

    // Draw the video frame to the canvas
    context.drawImage(video, 0, 0, width, height);

    // Read the current frame from canvas
    src.data.set(context.getImageData(0, 0, width, height).data);

    // Convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // Apply gaussian blur
    let ksize = new cv.Size(5, 5);
    cv.GaussianBlur(gray, blurred, ksize, 0, 0);

    // Apply canny edge detection
    let intensityThresholds = calculateIntensityThresholds(gray);
    cv.Canny(blurred, edges, intensityThresholds[0], intensityThresholds[1]);

    // // Apply dilation
    // cv.dilate(edges, dilated, M);

    // // Apply erosion
    // cv.erode(dilated, eroded, M);

    // Apply morphology closing - This function is a substitution for dilation -> erosion. It is useful in closing small holes inside the foreground objects, or small black points on the object.
    cv.morphologyEx(edges, closed, cv.MORPH_CLOSE, M);

    // Find contours
    let hierarchy = new cv.Mat();
    let contours = new cv.MatVector();
    cv.findContours(
      closed,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE,
    );

    // Find the biggest contour
    let polyVector = findBiggestContour(contours, 5000, 0.02);

    // Show the biggest contour
    detected = src.clone();
    cv.drawContours(detected, polyVector, -1, new cv.Scalar(255, 0, 0, 255), 3);
    cv.imshow('canvas1', detected);

    // Get the transformation matrix only if detected contour is quadrilateral
    if (isQuadrilateral(poly.get(0))) {
      let transformed = new cv.Mat();
      let matrix = createPerspectiveTransform(poly);

      // Apply the perspective transformation
    if (isQuadrilateral(polyVector.get(0))) {
      [transformed, matrix] = transformPerspective(polyVector.get(0));
      cv.warpPerspective(src, transformed, matrix, new cv.Size(width, height));

      // Show the transformed image
      cv.imshow('canvasOutput', transformed);
      matrix.delete();
      transformed.delete();
      matrix.delete();
    }

    setTimeout(() => {
      requestAnimationFrame(captureFrame);
    }, 1000 / FPS);
  }

  captureFrame();
}

// Calculates intensity thresholds required for canny filter
function calculateIntensityThresholds(
  canvas,
  lowerScalar = 0.66,
  upperScalar = 1.33,
) {
  let meanIntensity = cv.mean(canvas)[0];
  let lowerThreshold = lowerScalar * meanIntensity;
  let upperThreshold = upperScalar * meanIntensity;

  return [lowerThreshold, upperThreshold];
}

// Finds the biggest contour
// epsilon parameter specifies the approximation accuracy. This the maximum distance between the original curve and its approximation.
function findBiggestContour(contours, minAreaThreshold, epsilon) {
  let maxArea = 0;
  let largestContourIndex = -1;
  let polyVector = new cv.MatVector();

  for (let i = 0; i < contours.size(); ++i) {
    let contour = contours.get(i);
    let area = cv.contourArea(contour);
    if (area < minAreaThreshold) continue;
    let peri = cv.arcLength(contour, true);
    let tmp = new cv.Mat();
    cv.approxPolyDP(contour, tmp, epsilon * peri, true);

    // Push only quadrilateral polygons
    if (area > maxArea && isQuadrilateral(tmp)) {
      maxArea = area;
      largestContourIndex = i;
      polyVector.push_back(tmp);
    }

    tmp.delete();
    contour.delete();
  }

  return polyVector;
}

// Checks if the contour is a quadrilateral
function isQuadrilateral(contour) {
  return contour && contour.rows === 4;
}

// Calculates destination corners
function getDestinationCorners(padding, width, height) {
  return [
    { x: padding, y: padding }, // Top-left
    { x: width - padding, y: padding }, // Top-right
    { x: width - padding, y: height - padding }, // Bottom-right
    { x: padding, y: height - padding }, // Bottom-left
  ];
}

// Calculates perspecive matrix
function calculatePerspectiveMatrix(srcCorners, dstCorners) {
  let srcMat = cv.matFromArray(4, 1, cv.CV_32FC2, flattenCorners(srcCorners));
  let dstMat = cv.matFromArray(4, 1, cv.CV_32FC2, flattenCorners(dstCorners));

  let matrix = cv.getPerspectiveTransform(srcMat, dstMat);

  srcMat.delete();
  dstMat.delete();

  return matrix;
}

function flattenCorners(corners) {
  return corners.reduce((arr, corner) => arr.concat([corner.x, corner.y]), []);
}

window.onOpenCvReady = onOpenCvReady;
