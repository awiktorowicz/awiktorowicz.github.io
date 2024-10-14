// Sorts corners of a quadrilateral
function getSortedCorners(quad) {
  let corners = [];
  for (let i = 0; i < quad.rows; i++) {
    corners.push({ x: quad.data32S[i * 2], y: quad.data32S[i * 2 + 1] });
  }

  // Sort by y-coordinate (top two first, then bottom two)
  corners.sort((a, b) => a.y - b.y);

  // Sort the top two by x-coordinate (leftmost first), and the bottom two by x-coordinate
  let top = corners.slice(0, 2).sort((a, b) => a.x - b.x);
  let bottom = corners.slice(2, 4).sort((a, b) => a.x - b.x);

  // Return sorted corners: [top-left, top-right, bottom-right, bottom-left]
  return [top[0], top[1], bottom[1], bottom[0]];
}

function getFourMostDistantPoints(contour) {
  let points = [];
  for (let i = 0; i < contour.rows; i++) {
    points.push({ x: contour.data32S[i * 2], y: contour.data32S[i * 2 + 1] });
  }

  // Implement logic to find the 4 most distant points (e.g., pairwise Euclidean distance)
  // This is a placeholder; implement your own logic or use clustering
  if (points.length >= 4) {
    return points.slice(0, 4); // Placeholder: pick first 4 points (need better logic)
  } else {
    return [];
  }
}
