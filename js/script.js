// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const button = document.getElementById('imgButton');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalVideoLink = document.getElementById('modalVideoLink');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const modalCopyright = document.getElementById('modalCopyright');
const closeModalButton = document.getElementById('closeModal');
const spaceFactContent = document.getElementById('spaceFactContent');
const spaceFacts = [
  'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
  'A year on Mercury lasts only 88 Earth days.',
  'The Milky Way and Andromeda galaxies are moving toward each other.',
  'A day on Venus is longer than its year: Venus rotates once in about 243 Earth days and orbits the Sun in about 225.',
  'Jupiter is the largest planet in our solar system.',
  'Mars is home to Olympus Mons, the largest known volcano in the solar system.',
  'The Moon is moving away from Earth by about 3.8 centimeters each year.',
  'The International Space Station orbits Earth about once every 90 minutes.',
  'Saturn is less dense than water, though there is no ocean large enough to hold it.',
  "The Sun contains more than 99 percent of the solar system's total mass.",
  'Neptune was the first planet discovered through mathematical predictions before it was directly observed.',
  'A neutron star can pack more mass than the Sun into a sphere about the size of a city.',
  'The footprints left by Apollo astronauts on the Moon can last for millions of years because the Moon has no wind or rain.',
  'The observable universe is about 93 billion light-years across.',
  'One day on Jupiter lasts just under 10 hours, making it the shortest day of any planet in our solar system.',
  'Earth is the only planet in our solar system not named after a Roman or Greek god.'
];

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

async function fetchNasaMediaPage(params) {
  const response = await fetch(
    `https://images-api.nasa.gov/search?${params}`
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error('NASA returned a response that was not valid JSON.');
  }

  if (!response.ok) {
    throw new Error(data.reason || `NASA API request failed: ${response.status}`);
  }

  return data;
}

async function searchNasaMedia(startDate, endDate) {
  const params = new URLSearchParams({
    q: 'space',
    media_type: 'image,video',
    year_start: startDate.slice(0, 4),
    year_end: endDate.slice(0, 4),
    page_size: '1000',
    page: '1'
  });

  const firstPage = await fetchNasaMediaPage(params);
  const collection = firstPage.collection;

  if (!collection || !Array.isArray(collection.items)) {
    throw new Error('NASA returned an unexpected media search response.');
  }

  const totalHits = Number(collection.metadata && collection.metadata.total_hits);
  const totalPages = Math.ceil(totalHits / 1000);

  if (!Number.isFinite(totalPages)) {
    throw new Error('NASA did not provide a valid result count.');
  }

  if (totalPages > 12) {
    throw new Error('That date range has too many results to search at once. Try a shorter range.');
  }

  const otherPages = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => {
      const pageParams = new URLSearchParams(params);
      pageParams.set('page', String(index + 2));
      return fetchNasaMediaPage(pageParams);
    })
  );

  const allItems = [
    ...collection.items,
    ...otherPages.flatMap((pageData) => pageData.collection.items)
  ];

  return allItems.filter((item) => {
    const dateCreated = item.data && item.data[0] && item.data[0].date_created;
    const mediaDate = dateCreated && dateCreated.slice(0, 10);
    return mediaDate && mediaDate >= startDate && mediaDate <= endDate;
  });
}

function showBackupSpaceFact() {
  const randomFact = spaceFacts[
    Math.floor(Math.random() * spaceFacts.length)
  ];
  spaceFactContent.textContent = `Quick fact: ${randomFact}`;
}

function getPreviewLink(mediaItem) {
  const links = Array.isArray(mediaItem.links) ? mediaItem.links : [];
  return links.find((link) => link.rel === 'preview')
    || links.find((link) => link.render === 'image');
}

function showImageDetails(mediaItem) {
  const mediaData = mediaItem.data[0];
  const isVideo = mediaData.media_type === 'video';
  const preview = getPreviewLink(mediaItem);
  modalImage.hidden = isVideo || !preview;
  modalVideoLink.hidden = !isVideo;

  if (isVideo) {
    modalVideoLink.href = `https://images.nasa.gov/details/${encodeURIComponent(mediaData.nasa_id)}`;
  } else if (preview) {
    modalImage.src = preview.href;
    modalImage.alt = mediaData.title;
  }

  modalTitle.textContent = mediaData.title;
  modalDate.textContent = `Date: ${mediaData.date_created.slice(0, 10)}`;
  modalExplanation.textContent = mediaData.description || 'No description is available.';
  modalCopyright.textContent = mediaData.photographer
    ? `Image credit: ${mediaData.photographer}`
    : `NASA center: ${mediaData.center || 'Not specified'}`;
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

  const loadingMessage = document.createElement('p');
  loadingMessage.className = 'gallery-status';
  loadingMessage.setAttribute('role', 'status');
  loadingMessage.textContent = 'Loading images...';
  gallery.replaceChildren(loadingMessage);
  button.disabled = true;

  try {
    const mediaResults = await searchNasaMedia(startDate, endDate);
    gallery.replaceChildren();

    if (mediaResults.length === 0) {
      gallery.textContent = 'No NASA images or videos were found for those dates.';
      return;
    }

    // Click a NASA image or video card to open its details.
    mediaResults.forEach((mediaItem) => {
      const mediaData = mediaItem.data[0];
      const mediaButton = document.createElement('button');
      mediaButton.className = 'gallery-item';
      mediaButton.type = 'button';
      mediaButton.setAttribute('aria-label', `View details for ${mediaData.title}`);

      const preview = getPreviewLink(mediaItem);
      if (preview) {
        const image = document.createElement('img');
        image.src = preview.href;
        image.alt = mediaData.title;
        mediaButton.append(image);
      } else if (mediaData.media_type === 'image') {
        mediaButton.textContent = mediaData.title;
      }

      if (mediaData.media_type === 'video') {
        const videoLabel = document.createElement('span');
        videoLabel.className = 'video-label';
        videoLabel.textContent = 'NASA Video';
        mediaButton.append(videoLabel);
      }

      mediaButton.addEventListener('click', () => showImageDetails(mediaItem));
      gallery.append(mediaButton);
    });
  } catch (error) {
    console.error(error);
    gallery.textContent = `Could not load the space images: ${error.message}`;
  } finally {
    button.disabled = false;
  }
}

button.addEventListener('click', onButtonPress);
closeModalButton.addEventListener('click', () => imageModal.close());
showBackupSpaceFact();
imageModal.addEventListener('click', (event) => {
  if (event.target === imageModal) {
    imageModal.close();
  }
});
