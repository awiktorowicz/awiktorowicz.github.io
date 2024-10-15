function getFourMostDistantPoints(contour) {
  let points = [];
  for (let i = 0; i < contour.rows; i++) {
    points.push({ x: contour.data32S[i * 2], y: contour.data32S[i * 2 + 1] });
  }
  points.sort((a, b) => a.y - b.y);

  if (points.length >= 4) {
    let top = points.slice(0, 2).sort((a, b) => a.x - b.x);
    let bottom = points.slice(2, 4).sort((a, b) => a.x - b.x);
    return [top[0], top[1], bottom[1], bottom[0]];
  } else {
    return [];
  }
}
