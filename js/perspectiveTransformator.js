function transformPerspective(poly) {
  if (!isQuadrilateral(poly)) return [];

  let transformed = new cv.Mat();
  let matrix = createPerspectiveTransform(poly);

  return [transformed, matrix];
}

// Perspective transformation - for quadrilateral polygons only
function createPerspectiveTransform(polyCorners, padding = 50) {
  let rect = getFourMostDistantPoints(polyCorners);
  let dstCorners = getDestinationCorners(padding, width, height);
  let matrix = calculatePerspectiveMatrix(rect, dstCorners);
  return matrix;
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

// Flatens the strucutre of the corners
function flattenCorners(corners) {
  return corners.reduce((arr, corner) => arr.concat([corner.x, corner.y]), []);
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
