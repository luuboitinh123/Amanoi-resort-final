// Calendar Booking Interface
// This script handles the calendar date selection with prices

class CalendarBooking {
   constructor() {
      this.currentMonth = new Date();
      this.selectedCheckIn = null;
      this.selectedCheckOut = null;
      this.roomPrice = 220; // Default price, will be updated from room data
      this.unavailableDates = this.generateUnavailableDates();
      this.datePrices = this.generateDatePrices();
      
      this.init();
   }
   
   init() {
      // Get room price from page or global room data
      const priceElement = document.getElementById('total-price');
      if (priceElement) {
         const priceText = priceElement.textContent.replace('$', '').trim();
         this.roomPrice = parseInt(priceText) || 220;
      } else if (window.roomData) {
         // Try to get price from room data
         const urlParams = new URLSearchParams(window.location.search);
         const roomType = urlParams.get('room') || 'deluxe';
         if (window.roomData[roomType]) {
            this.roomPrice = window.roomData[roomType].price;
         }
      }
      
      // No need to pre-generate prices - we'll calculate them dynamically
      
      // Set current month to today
      this.currentMonth = new Date();
      this.currentMonth.setDate(1); // Set to first day of month for consistent navigation
      
      // Render calendars
      this.renderCalendars();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Update price display
      this.updatePriceDisplay();
   }
   
   generateUnavailableDates() {
      // Return empty array - we'll generate unavailable dates dynamically
      // This allows for real-time checking for any date range
      return [];
   }
   
   // Check if a specific date is unavailable (real-time generation)
   isDateUnavailable(dateStr) {
      const date = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Past dates are unavailable
      if (date < today) return true;
      
      // Generate unavailable dates based on a deterministic pattern
      // This ensures consistency while appearing random
      const daysFromToday = Math.floor((date - today) / (1000 * 60 * 60 * 24));
      
      // Use a hash-like function for consistent "randomness"
      const seed = daysFromToday + date.getFullYear() * 1000 + date.getMonth() * 100;
      const random = ((seed * 9301 + 49297) % 233280) / 233280;
      
      // About 15-20% of dates are unavailable (excluding first week)
      if (daysFromToday > 7 && random < 0.18) {
         return true;
      }
      
      return false;
   }
   
   generateDatePrices() {
      // Return empty object - we'll generate prices dynamically
      // This allows for real-time price calculation for any date
      return {};
   }
   
   // Get price for a specific date (real-time generation)
   getDatePrice(dateStr) {
      const date = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysFromToday = Math.floor((date - today) / (1000 * 60 * 60 * 24));
      
      if (daysFromToday < 0) return this.roomPrice;
      
      // Use a deterministic function for consistent pricing
      const seed = daysFromToday + date.getFullYear() * 1000 + date.getMonth() * 100;
      const random = ((seed * 9301 + 49297) % 233280) / 233280;
      
      // Vary prices slightly (±20%) based on season and day
      const month = date.getMonth();
      let seasonMultiplier = 1.0;
      
      // Peak season (summer months: June, July, August)
      if (month >= 5 && month <= 7) {
         seasonMultiplier = 1.15;
      }
      // Low season (winter months: November, December, January)
      else if (month === 10 || month === 11 || month === 0) {
         seasonMultiplier = 0.90;
      }
      
      // Weekend pricing (Friday, Saturday)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 5 || dayOfWeek === 6) {
         seasonMultiplier *= 1.10;
      }
      
      // Add some variation based on the date
      const variation = (random - 0.5) * 0.3;
      const finalPrice = Math.round(this.roomPrice * seasonMultiplier * (1 + variation));
      
      return finalPrice;
   }
   
   formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
   }
   
   formatDateDisplay(date) {
      const day = date.getDate();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const month = monthNames[date.getMonth()];
      return { day, month };
   }
   
   renderCalendars() {
      const month1 = document.getElementById('calendar-month-1');
      const month2 = document.getElementById('calendar-month-2');
      const prevBtn = document.getElementById('prev-month-btn');
      
      if (!month1 || !month2) return;
      
      // Render first month (current)
      const firstMonth = new Date(this.currentMonth);
      this.renderMonth(month1, firstMonth);
      
      // Render second month (next)
      const secondMonth = new Date(this.currentMonth);
      secondMonth.setMonth(secondMonth.getMonth() + 1);
      this.renderMonth(month2, secondMonth);
      
      // Update previous button state
      if (prevBtn) {
         const today = new Date();
         today.setDate(1);
         const currentMonthStart = new Date(this.currentMonth);
         currentMonthStart.setDate(1);
         
         if (currentMonthStart <= today) {
            prevBtn.style.opacity = '0.5';
            prevBtn.style.cursor = 'not-allowed';
            prevBtn.disabled = true;
         } else {
            prevBtn.style.opacity = '1';
            prevBtn.style.cursor = 'pointer';
            prevBtn.disabled = false;
         }
      }
   }
   
   renderMonth(container, date) {
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      
      // Get first day of month and number of days
      // Adjust for Monday as first day (0 = Monday, 6 = Sunday)
      let firstDay = new Date(year, month, 1).getDay();
      firstDay = firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to 6, others shift by 1
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Create calendar HTML
      let html = `
         <div class="calendar-month-header" style="text-align: center; margin-bottom: 1.5rem;">
            <h4 style="font-size: 1.6rem; color: var(--text-dark); font-weight: 500;">
               ${monthNames[month]} ${year}
            </h4>
         </div>
         <div class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem;">
      `;
      
      // Day headers
      const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      dayHeaders.forEach(day => {
         html += `<div style="text-align: center; font-size: 1.2rem; color: var(--text-dark-alt); font-weight: 500; padding: 0.5rem;">${day}</div>`;
      });
      
      // Empty cells for days before month starts
      for (let i = 0; i < firstDay; i++) {
         html += `<div></div>`;
      }
      
      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
         const currentDate = new Date(year, month, day);
         const dateStr = this.formatDate(currentDate);
         const isUnavailable = this.isDateUnavailable(dateStr);
         const isPast = currentDate < new Date(new Date().setHours(0, 0, 0, 0));
         const price = this.getDatePrice(dateStr);
         
         // Check if date is selected
         const isCheckIn = this.selectedCheckIn === dateStr;
         const isCheckOut = this.selectedCheckOut === dateStr;
         const isInRange = this.selectedCheckIn && this.selectedCheckOut && 
                          dateStr > this.selectedCheckIn && dateStr < this.selectedCheckOut;
         
         let cellClass = 'calendar-day';
         let cellStyle = 'padding: 1rem 0.5rem; text-align: center; border: 1px solid rgba(143, 159, 4, 0.2); border-radius: 0.3rem; cursor: pointer; transition: all 0.2s; min-height: 6rem; display: flex; flex-direction: column; justify-content: center;';
         
         if (isPast || isUnavailable) {
            cellStyle += 'background: #f5f5f5; color: #999; cursor: not-allowed; opacity: 0.5;';
            if (isUnavailable) {
               cellStyle += 'position: relative;';
            }
         } else {
            cellStyle += 'background: var(--white); color: var(--text-dark);';
         }
         
         if (isCheckIn || isCheckOut || isInRange) {
            cellStyle += 'background: var(--accent-yellow); color: var(--text-dark); border-color: var(--main-color);';
            if (isCheckIn || isCheckOut) {
               cellStyle += 'font-weight: bold; border-width: 2px;';
            }
         }
         
         html += `
            <div class="calendar-day" 
                 data-date="${dateStr}" 
                 style="${cellStyle}"
                 ${isPast || isUnavailable ? '' : 'onclick="calendarBooking.selectDate(\'' + dateStr + '\')"'}>
               <div style="font-size: 1.6rem; font-weight: 500; margin-bottom: 0.5rem;">${day}</div>
               ${isUnavailable ? '<div style="font-size: 1.2rem; color: #999; font-weight: bold;">✕</div>' : 
                 !isPast ? `<div style="font-size: 1.1rem; color: var(--text-dark-alt); font-weight: 400;">$${price}</div>` : ''}
            </div>
         `;
      }
      
      html += '</div>';
      container.innerHTML = html;
   }
   
   selectDate(dateStr) {
      if (this.isDateUnavailable(dateStr)) return;
      
      const selectedDate = new Date(dateStr);
      const today = new Date(new Date().setHours(0, 0, 0, 0));
      
      if (selectedDate < today) return;
      
      if (!this.selectedCheckIn || (this.selectedCheckIn && this.selectedCheckOut)) {
         // Start new selection
         this.selectedCheckIn = dateStr;
         this.selectedCheckOut = null;
      } else if (this.selectedCheckIn && !this.selectedCheckOut) {
         // Complete selection
         if (selectedDate > new Date(this.selectedCheckIn)) {
            this.selectedCheckOut = dateStr;
         } else {
            // If selected date is before check-in, swap them
            this.selectedCheckOut = this.selectedCheckIn;
            this.selectedCheckIn = dateStr;
         }
      }
      
      // Update displays
      this.updateDateDisplays();
      this.renderCalendars(); // Re-render to show updated selection
      this.updatePriceDisplay();
   }
   
   // Method to update room price and refresh calendar
   updateRoomPrice(newPrice) {
      this.roomPrice = newPrice;
      this.renderCalendars(); // Re-render with new prices
   }
   
   updateDateDisplays() {
      const checkInDisplay = document.getElementById('display-checkin');
      const checkOutDisplay = document.getElementById('display-checkout');
      const checkInInput = document.getElementById('check-in-input');
      const checkOutInput = document.getElementById('check-out-input');
      
      if (this.selectedCheckIn) {
         const checkInDate = new Date(this.selectedCheckIn);
         const checkInFormatted = this.formatDateDisplay(checkInDate);
         if (checkInDisplay) {
            checkInDisplay.innerHTML = `
               <div style="font-size: 2.5rem; font-weight: bold; color: var(--text-dark);">${checkInFormatted.day}</div>
               <div style="font-size: 1.4rem; color: var(--text-dark-alt); margin-top: 0.5rem;">${checkInFormatted.month}</div>
            `;
         }
         if (checkInInput) checkInInput.value = this.selectedCheckIn;
      } else {
         if (checkInDisplay) {
            checkInDisplay.innerHTML = `
               <div style="font-size: 2.5rem; font-weight: bold; color: var(--text-dark);">-</div>
               <div style="font-size: 1.4rem; color: var(--text-dark-alt); margin-top: 0.5rem;">Select date</div>
            `;
         }
         if (checkInInput) checkInInput.value = '';
      }
      
      if (this.selectedCheckOut) {
         const checkOutDate = new Date(this.selectedCheckOut);
         const checkOutFormatted = this.formatDateDisplay(checkOutDate);
         if (checkOutDisplay) {
            checkOutDisplay.innerHTML = `
               <div style="font-size: 2.5rem; font-weight: bold; color: var(--text-dark);">${checkOutFormatted.day}</div>
               <div style="font-size: 1.4rem; color: var(--text-dark-alt); margin-top: 0.5rem;">${checkOutFormatted.month}</div>
            `;
         }
         if (checkOutInput) checkOutInput.value = this.selectedCheckOut;
      } else {
         if (checkOutDisplay) {
            checkOutDisplay.innerHTML = `
               <div style="font-size: 2.5rem; font-weight: bold; color: var(--text-dark);">-</div>
               <div style="font-size: 1.4rem; color: var(--text-dark-alt); margin-top: 0.5rem;">Select date</div>
            `;
         }
         if (checkOutInput) checkOutInput.value = '';
      }
   }
   
   updatePriceDisplay() {
      // Price display removed - only show dates and guests in sidebar
      // Price calculation will happen at checkout
   }
   
   navigateMonth(direction) {
      // direction: 1 for next, -1 for previous
      const newMonth = new Date(this.currentMonth);
      newMonth.setMonth(newMonth.getMonth() + direction);
      
      // Don't allow navigation to past months (before current month)
      const today = new Date();
      today.setDate(1); // Set to first day of month for comparison
      newMonth.setDate(1);
      
      // Only allow navigation forward, or backward if not going before current month
      if (direction > 0 || (direction < 0 && newMonth >= today)) {
         this.currentMonth = newMonth;
         this.renderCalendars();
      }
   }
   
   setupEventListeners() {
      const nextBtn = document.getElementById('next-month-btn');
      const prevBtn = document.getElementById('prev-month-btn');
      
      if (nextBtn) {
         nextBtn.addEventListener('click', () => {
            this.navigateMonth(1);
         });
      }
      
      if (prevBtn) {
         prevBtn.addEventListener('click', () => {
            this.navigateMonth(-1);
         });
      }
      
      // Form validation
      const bookingForm = document.getElementById('booking-form');
      if (bookingForm) {
         bookingForm.addEventListener('submit', (e) => {
            if (!this.selectedCheckIn || !this.selectedCheckOut) {
               e.preventDefault();
               alert('Please select both check-in and check-out dates.');
               return false;
            }
         });
      }
   }
}

// Initialize calendar when DOM is ready
let calendarBooking;
document.addEventListener('DOMContentLoaded', function() {
   // Wait a bit for room data to be loaded
   setTimeout(function() {
      const bookingForm = document.getElementById('booking-form');
      if (bookingForm) {
         calendarBooking = new CalendarBooking();
      }
   }, 100);
});

