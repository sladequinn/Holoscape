document.addEventListener('DOMContentLoaded', () => {
  const browseBtn = document.getElementById('browseBtn');
  const generateBtn = document.getElementById('generateBtn');

  if (browseBtn) {
    browseBtn.addEventListener('click', () => {
      window.location.href = '/browse.html';
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      window.location.href = '/generate.html';
    });
  }
});
