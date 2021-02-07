function formatName(signature) {
  const sigName = signature.anonymous ? 'Nafnlaust' : signature.name;

  return sigName;
}

module.exports = formatName;
