/** @param {number} correct @param {number} attempts */
export function accuracy(correct, attempts) {
  return attempts ? Math.round((correct / attempts) * 100) : 100;
}
/** @param {number} characters @param {number} milliseconds */
export function wordsPerMinute(characters, milliseconds) {
  return milliseconds > 0
    ? Math.round(characters / 5 / (milliseconds / 60000))
    : 0;
}
