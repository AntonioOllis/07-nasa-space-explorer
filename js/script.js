// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const button = document.getElementById('imgButton');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

async function onButtonPress() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  // // Don't send a request until both dates are selected in the right order.
  // if (!startDate || !endDate || startDate > endDate) {
  //   gallery.textContent = 'Please choose a valid start and end date.';
  //   return;
  // }

  const params = new URLSearchParams({
    api_key: 'DEMO_KEY',
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
  
    console.log(images);
  } catch (error) {
    console.error(error);
    gallery.textContent = 'Could not load the space images. Please try again.';
  }
}

button.addEventListener('click', onButtonPress);
