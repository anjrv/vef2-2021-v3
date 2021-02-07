function formatDate(sigDate) {
  return ((sigDate.toISOString().substring(0, 10)).split('-')).reverse()
    .join('.');
}

module.exports = formatDate;
