//TODO: Change polyCorners to polyMat to reduce confusion

let interactiveCanvas = document.getElementById('interactiveCanvas');
let interactiveCanvasContext = interactiveCanvas.getContext('2d');

let transformedCanvas = document.getElementById('transformedCanvas');

function setupInteractivePolygon(src, polyCorners) {
  const corners = getSortedCorners(polyCorners);
  const pointRadius = 10;
  let selectedPoint = null;

  draw();

  function draw() {
    drawPolygon(corners, src);
    drawCorners(corners, pointRadius);
  }

  function drawPolygon(corners, src) {
    // Draw the quadrilateral
    cv.imshow(interactiveCanvas, src);
    interactiveCanvasContext.beginPath();
    interactiveCanvasContext.moveTo(corners[0].x, corners[0].y);

    for (let i = 1; i < corners.length; i++) {
      interactiveCanvasContext.lineTo(corners[i].x, corners[i].y);
    }

    interactiveCanvasContext.closePath();
    interactiveCanvasContext.stroke();
  }

  function drawCorners(corners, radius) {
    // Draw draggable corners
    for (let corner of corners) {
      interactiveCanvasContext.beginPath();
      interactiveCanvasContext.arc(corner.x, corner.y, radius, 0, Math.PI * 2);
      interactiveCanvasContext.fillStyle = 'blue';
      interactiveCanvasContext.fill();
      interactiveCanvasContext.stroke();
    }
  }

  function isPointOnCircle(x, y, point) {
    let dist = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
    return dist < pointRadius;
  }

  function handleMouseDown(event) {
    const mouseX = getMousePos(event);
    selectPoint(mouseX);
  }

  function handleMouseMove(event) {
    if (selectedPoint) {
      const mouseX = getMousePos(event);
      // Update the position of the selected point
      selectedPoint.x = mouseX.x;
      selectedPoint.y = mouseX.y;
      draw();
    }
  }

  function handleMouseUp() {
    selectedPoint = null;
    updatePolygon();
  }

  function handleTouchStart(event) {
    event.preventDefault(); // Prevent scrolling
    const touchX = getTouchPos(event);
    selectPoint(touchX);
  }

  function handleTouchMove(event) {
    event.preventDefault(); // Prevent scrolling
    if (selectedPoint) {
      const touchX = getTouchPos(event);
      // Update the position of the selected point
      selectedPoint.x = touchX.x;
      selectedPoint.y = touchX.y;
      draw();
    }
  }

  function handleTouchEnd() {
    selectedPoint = null;
    updatePolygon();
  }

  function getMousePos(event) {
    const rect = interactiveCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    return { x: mouseX, y: mouseY };
  }

  function getTouchPos(event) {
    const rect = interactiveCanvas.getBoundingClientRect();
    const touch = event.touches[0]; // Get the first touch point
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    return { x: touchX, y: touchY };
  }

  function selectPoint(pos) {
    // Check if any point is selected
    for (let corner of corners) {
      if (isPointOnCircle(pos.x, pos.y, corner)) {
        selectedPoint = corner;
        break;
      }
    }
  }

  function updatePolygon() {
    let transformed = new cv.Mat();

    // Convert the points to cv.Point format
    let polyArray = corners.map((corner) => new cv.Point(corner.x, corner.y));

    // Create a cv.Mat from the points array
    let polygonMat = cv.matFromArray(
      polyArray.length,
      1,
      cv.CV_32SC2,
      polyArray.flatMap((p) => [p.x, p.y]),
    );

    // Apply the perspective transformation
    [transformed, matrix] = transformPerspective(polygonMat);
    cv.warpPerspective(src, transformed, matrix, new cv.Size(width, height));

    // Show the transformed image
    cv.imshow(transformedCanvas, transformed);
    matrix.delete();
    transformed.delete();
  }

  // Event listeners
  interactiveCanvas.addEventListener('mousedown', handleMouseDown);
  interactiveCanvas.addEventListener('mousemove', handleMouseMove);
  interactiveCanvas.addEventListener('mouseup', handleMouseUp);
  interactiveCanvas.addEventListener('touchstart', handleTouchStart);
  interactiveCanvas.addEventListener('touchmove', handleTouchMove);
  interactiveCanvas.addEventListener('touchend', handleTouchEnd);
}
