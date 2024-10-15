let feedbackParagraph = document.getElementById('feedbackParagraph');
let smallFrameCorners = null;
let bigFrameCorners = null;

function displayGuidanceFrames(
  src,
  outputCanvas,
  minArea,
  maxArea,
  colorMin,
  colorMax,
) {
  cv.imshow(outputCanvas, src);
  smallFrameCorners = drawCardFrame(outputCanvas, minArea, colorMin);
  bigFrameCorners = drawCardFrame(outputCanvas, maxArea, colorMax);
}

function drawCardFrame(outputCanvas, area, color) {
  const ctx = outputCanvas.getContext('2d');

  // Define credit card dimensions (proportional to a typical credit card)
  let cardWidth = 280;
  let cardHeight = 180;
  let cornerRadius = 15;

  const scale = Math.sqrt(area / (cardHeight * cardWidth));

  cardWidth *= scale;
  cardHeight *= scale;
  cornerRadius *= scale;

  // Calculate the center position of the canvas
  const centerX = outputCanvas.width / 2;
  const centerY = outputCanvas.height / 2;

  // Calculate the top-left corner position to center the credit card
  const x = centerX - cardWidth / 2;
  const y = centerY - cardHeight / 2;

  // Draw the credit card placeholder (rounded rectangle)
  ctx.beginPath();
  ctx.moveTo(x + cornerRadius, y);
  ctx.lineTo(x + cardWidth - cornerRadius, y);
  ctx.quadraticCurveTo(x + cardWidth, y, x + cardWidth, y + cornerRadius);
  ctx.lineTo(x + cardWidth, y + cardHeight - cornerRadius);
  ctx.quadraticCurveTo(
    x + cardWidth,
    y + cardHeight,
    x + cardWidth - cornerRadius,
    y + cardHeight,
  );
  ctx.lineTo(x + cornerRadius, y + cardHeight);
  ctx.quadraticCurveTo(x, y + cardHeight, x, y + cardHeight - cornerRadius);
  ctx.lineTo(x, y + cornerRadius);
  ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
  ctx.closePath();

  // Style the placeholder
  ctx.strokeStyle = `#${color}`; // Darker outline
  ctx.lineWidth = 3;
  ctx.stroke();

  // Return the corner coordinates
  // Top-Left, Top-Right, Bottom-Right, Bottom-Left
  const corners = [
    { x: x, y: y },
    { x: x + cardWidth, y: y },
    { x: x + cardWidth, y: y + cardHeight },
    { x: x, y: y + cardHeight },
  ];

  return corners;
}

function validateContour(contour, minArea, maxArea) {
  console.log('Checking');

  // Validate Area
  let isAreaInRange = validateArea(contour, minArea, maxArea);

  // Validate Position
  if (!isAreaInRange) return false;
  let contourCorners = getFourMostDistantPoints(contour);
  let isPositionInRange = validatePosition(
    contourCorners,
    smallFrameCorners,
    bigFrameCorners,
  );

  return isAreaInRange && isPositionInRange;
}

function validateArea(contour, minArea, maxArea) {
  let contourArea = cv.contourArea(contour);

  if (contourArea < minArea) {
    updateFeedbackParagraph(
      `Object Detected. Please zoom in. current area: ${contourArea}`,
    );
  }

  if (contourArea > maxArea) {
    updateFeedbackParagraph(
      `Object Detected. Please zoom out. current area: ${contourArea}`,
    );
  }

  if (minArea <= contourArea && contourArea <= maxArea) {
    updateFeedbackParagraph(`Object detected in range.`);
    return true;
  }
  return false;
}

function validatePosition(contourCorners, smallFrameCorners, bigFrameCorners) {
  const smallFrameBounds = getContourBounds(smallFrameCorners);
  const bigFrameBounds = getContourBounds(bigFrameCorners);
  const contourBounds = getContourBounds(contourCorners);

  // Check left-right
  if (contourBounds.minX < bigFrameBounds.minX) {
    updateFeedbackParagraph('Move right');
    return false;
  }

  if (contourBounds.bigX > bigFrameBounds.maxX) {
    updateFeedbackParagraph('Move left');
    return false;
  }

  // Check up-down
  if (contourBounds.minY < bigFrameBounds.minY) {
    updateFeedbackParagraph('Move up');
    return false;
  }

  if (contourBounds.maxY > bigFrameBounds.maxY) {
    updateFeedbackParagraph('Move down');
    return false;
  }

  return true;
}

function getContourBounds(contourCorners) {
  const minX = Math.min(...contourCorners.map((corner) => corner.x));
  const maxX = Math.max(...contourCorners.map((corner) => corner.x));
  const minY = Math.min(...contourCorners.map((corner) => corner.y));
  const maxY = Math.max(...contourCorners.map((corner) => corner.y));

  return { minX, maxX, minY, maxY };
}

function updateFeedbackParagraph(text) {
  feedbackParagraph.innerText = text;
}
