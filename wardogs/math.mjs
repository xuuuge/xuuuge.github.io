export function parseCoordinates(value) {
  const text = value.trim().replace(/^[\s"'“”‘’`(]+|[\s"'“”‘’`)]+$/g, '').replace(/，/g, ',');
  const number = '([+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+))';
  const labeled = new RegExp('^x\\s*[:=]?\\s*' + number + '\\s*[,;]?\\s*y\\s*[:=]?\\s*' + number + '$', 'i');
  const plain = new RegExp('^' + number + '(?:\\s*[,;]\\s*|\\s+)' + number + '$');
  const match = text.match(labeled) || text.match(plain);
  if (!match || ![Number(match[1]), Number(match[2])].every(Number.isFinite)) throw new Error('Use coordinates like x97.89, y62.94 or 97.89, 62.94.');
  return { x: Number(match[1]), y: Number(match[2]) };
}
export function solve(gx, gy, tx, ty, scale) {
  if (![gx, gy, tx, ty, scale].every(Number.isFinite) || scale <= 0) throw new Error('Use finite coordinates and a positive scale.');
  const dx = (tx - gx) * scale, dy = (ty - gy) * scale;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance)) throw new Error('Coordinates are too large.');
  const bearing = distance === 0 ? null : (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
  return { distance, bearing, direction: bearing === null ? '' : ['N','NE','E','SE','S','SW','W','NW'][Math.round(bearing / 45) % 8] };
}
export function calibrate(a, b, metres) {
  const pixels = Math.hypot(b.x - a.x, b.y - a.y);
  if (!Number.isFinite(pixels) || pixels < 10) throw new Error('Pick calibration points at least 10 image pixels apart.');
  if (!Number.isFinite(metres) || metres <= 0) throw new Error('Enter a positive known span in metres.');
  return metres / pixels;
}
export function fromMap(gun, target, scale) {
  return solve(gun.x, -gun.y, target.x, -target.y, scale);
}
