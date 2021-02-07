/**
 * Hjálparfall til að birta nafn á réttu formi.
 *
 * @param {object} signature Undirskrift hlut
 * @returns {string} Strengur sem inniheldur nafn ef ekki nafnlaust, annars Nafnlaust
 */
function formatName(signature) {
  const sigName = signature.anonymous ? 'Nafnlaust' : signature.name;

  return sigName;
}

export { formatName };
