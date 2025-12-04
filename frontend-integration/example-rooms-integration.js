// Example: How to load rooms dynamically in rooms.html
// Add this script to rooms.html

document.addEventListener('DOMContentLoaded', async () => {
  await loadRooms();
});

async function loadRooms() {
  try {
    const response = await RoomsAPI.getAll();
    if (response.success && response.rooms) {
      displayRooms(response.rooms);
    } else {
      console.error('Failed to load rooms');
    }
  } catch (error) {
    console.error('Error loading rooms:', error);
    // Fallback to static content if API fails
  }
}

function displayRooms(rooms) {
  const container = document.querySelector('.rooms .box-container');
  if (!container) return;

  container.innerHTML = rooms.map(room => {
    const amenities = typeof room.amenities === 'string' 
      ? JSON.parse(room.amenities) 
      : room.amenities || [];
    const images = typeof room.images === 'string' 
      ? JSON.parse(room.images) 
      : room.images || [];

    return `
      <div class="box">
        <div class="image">
          <img src="${images[0] || 'images/home-img-1.jpg'}" alt="${room.name}">
        </div>
        <div class="content">
          <div style="font-size: 1.4rem; color: var(--accent-brown); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.1rem;">${room.category}</div>
          <h3 style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--main-color);">${room.name}</h3>
          <p style="margin-bottom: 2rem; color: var(--text-light);">${room.description || ''}</p>
          <div class="amenities">
            ${amenities.map(amenity => 
              `<span><i class="fas fa-check"></i> ${amenity}</span>`
            ).join('')}
          </div>
          <div class="price" style="margin-bottom: 2rem;">
            <div style="font-size: 1.4rem; color: var(--text-light); margin-bottom: 0.5rem;">Starting from</div>
            <div style="font-size: 3rem; font-weight: bold; color: var(--main-color);">$${room.price_per_night} <span style="font-size: 1.8rem; font-weight: normal; color: var(--text-light);">/ night</span></div>
          </div>
          <a href="room-details.html?room=${room.slug}" class="btn">Book now</a>
        </div>
      </div>
    `;
  }).join('');
}


