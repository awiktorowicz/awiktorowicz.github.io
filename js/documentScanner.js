let video = document.getElementById('videoInput');
let previewCanvas = document.getElementById('previewCanvas');
let previewCanvasContext = previewCanvas.getContext('2d');
let areaText = document.getElementById('area');
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
    previewCanvasContext.drawImage(video, 0, 0, width, height);

    // Read the current frame from canvas
    src.data.set(previewCanvasContext.getImageData(0, 0, width, height).data);

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
    cv.imshow(previewCanvas, detected);

    // Interactive polygons
    if (isQuadrilateral(polyVector.get(0))) {
      // Stop Streaming
      streaming = false;
      setupInteractivePolygon(src, polyVector.get(0));

      // Calculate area of the quadrilateral
      let area = cv.contourArea(polyVector.get(0));
      areaText.innerHTML = `Area: ${area.toFixed(2)} px`;
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

window.onOpenCvReady = onOpenCvReady;
