/**
 * Hjálparfall sem skilar dagsetningu á lesanlegu formi.
 *
 * @param {string} sigDate dagsetning
 * @returns {string} dagsetning sem hefur verið hreinsað
 */
function formatDate(sigDate) {
  return ((sigDate.toISOString().substring(0, 10)).split('-')).reverse()
    .join('.');
}

export { formatDate };
