// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const button = document.getElementById('imgButton');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const modalCopyright = document.getElementById('modalCopyright');
const closeModalButton = document.getElementById('closeModal');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

function showImageDetails(imageData) {
  modalImage.src = imageData.hdurl || imageData.url;
  modalImage.alt = imageData.title;
  modalTitle.textContent = imageData.title;
  modalDate.textContent = `Date: ${imageData.date}`;
  modalExplanation.textContent = imageData.explanation;
  modalCopyright.textContent = imageData.copyright
    ? `Image credit: ${imageData.copyright}`
    : '';
  imageModal.showModal();
}

async function onButtonPress() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  // Don't send a request until both dates are selected in the right order.
  if (!startDate || !endDate || startDate > endDate) {
    gallery.textContent = 'Please choose a valid start and end date.';
    return;
  }

  const params = new URLSearchParams({
    api_key: 'qfNMNFtTWC9gJTc6PG9Pm7nHHLGCLcmhmMCDNndC',
    start_date: startDate,
    end_date: endDate
  });

  try {
    const response = await fetch(
      `https://api.nasa.gov/planetary/apod?${params}`
    );

    if (!response.ok) {
      throw new Error(`NASA API request failed: ${response.status}`);
    }

    const images = await response.json();

    // A date range should return a list of APOD results.
    if (!Array.isArray(images)) {
      throw new Error('NASA API returned an unexpected response.');
    }

    gallery.replaceChildren();

    const imageResults = images.filter((imageData) => imageData.media_type === 'image');

    if (imageResults.length === 0) {
      gallery.textContent = 'No space images were found for those dates.';
      return;
    }

    // Show only images in the gallery; click an image to open its details.
    imageResults.forEach((imageData) => {
      const imageButton = document.createElement('button');
      const image = document.createElement('img');

      imageButton.className = 'gallery-item';
      imageButton.type = 'button';
      imageButton.setAttribute('aria-label', `View details for ${imageData.title}`);
      image.src = imageData.url;
      image.alt = imageData.title;
      imageButton.append(image);
      imageButton.addEventListener('click', () => showImageDetails(imageData));
      gallery.append(imageButton);
    });
  } catch (error) {
    console.error(error);
    gallery.textContent = 'Could not load the space images. Please try again.';
  }
}

button.addEventListener('click', onButtonPress);
closeModalButton.addEventListener('click', () => imageModal.close());
imageModal.addEventListener('click', (event) => {
  if (event.target === imageModal) {
    imageModal.close();
  }
});
