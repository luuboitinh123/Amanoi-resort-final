// Example: How to integrate booking creation in room-details.html
// Update the booking form submission

async function handleBookingSubmit(event) {
  event.preventDefault();
  
  // Check if user is logged in
  const token = getAuthToken();
  if (!token) {
    alert('Please login to make a booking');
    window.location.href = 'auth.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const roomSlug = urlParams.get('room') || 'deluxe';

  // Get room ID from slug (you might need to load room data first)
  let roomId;
  try {
    const roomResponse = await RoomsAPI.getBySlug(roomSlug);
    if (roomResponse.success) {
      roomId = roomResponse.room.id;
    } else {
      throw new Error('Room not found');
    }
  } catch (error) {
    alert('Failed to load room information');
    return;
  }

  const bookingData = {
    room_id: roomId,
    check_in: event.target.check_in.value,
    check_out: event.target.check_out.value,
    adults: parseInt(event.target.adults.value),
    children: parseInt(event.target.children.value) || 0,
    special_requests: event.target.special_requests?.value || null
  };

  // Validate dates
  const checkIn = new Date(bookingData.check_in);
  const checkOut = new Date(bookingData.check_out);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkIn < today) {
    alert('Check-in date cannot be in the past');
    return;
  }

  if (checkOut <= checkIn) {
    alert('Check-out date must be after check-in date');
    return;
  }

  try {
    // Check availability first
    const availability = await RoomsAPI.checkAvailability(
      roomId, 
      bookingData.check_in, 
      bookingData.check_out
    );

    if (!availability.success || !availability.available) {
      alert(availability.message || 'Room is not available for selected dates');
      return;
    }

    // Create booking
    const response = await BookingsAPI.create(bookingData);
    
    if (response.success) {
      // Redirect to payment page with booking ID
      window.location.href = `payment.html?booking_id=${response.booking.id}`;
    }
  } catch (error) {
    alert('Booking failed: ' + error.message);
  }
}

// Attach to form
document.addEventListener('DOMContentLoaded', () => {
  const bookingForm = document.querySelector('.booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', handleBookingSubmit);
  }
});


