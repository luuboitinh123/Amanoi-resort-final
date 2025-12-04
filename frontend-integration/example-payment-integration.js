// Example: How to integrate payment processing in payment.html
// Update the confirmReservation function

function collectBillingInfo() {
  return {
    first_name: document.querySelector('input[name="first_name"]')?.value || '',
    last_name: document.querySelector('input[name="last_name"]')?.value || '',
    email: document.querySelector('input[name="email"]')?.value || '',
    phone: document.querySelector('input[name="phone"]')?.value || '',
    address: document.querySelector('input[name="address"]')?.value || '',
    city: document.querySelector('input[name="city"]')?.value || '',
    country: document.querySelector('input[name="country"]')?.value || '',
    zip_code: document.querySelector('input[name="zip_code"]')?.value || ''
  };
}

function collectPaymentInfo(method) {
  const info = {};
  
  if (method === 'vnpay_qr') {
    info.payer_name = document.querySelector('input[name="vnpay_payer_name"]')?.value || '';
    info.phone = document.querySelector('input[name="vnpay_phone"]')?.value || '';
    info.email = document.querySelector('input[name="vnpay_email"]')?.value || '';
    info.note = document.querySelector('input[name="vnpay_note"]')?.value || '';
  } else if (method === 'bank_transfer') {
    info.payer_name = document.querySelector('input[name="bank_payer_name"]')?.value || '';
    info.bank_name = document.querySelector('input[name="bank_name"]')?.value || '';
    info.account_number = document.querySelector('input[name="account_number"]')?.value || '';
    info.account_holder_name = document.querySelector('input[name="account_holder_name"]')?.value || '';
    info.phone = document.querySelector('input[name="bank_phone"]')?.value || '';
    info.email = document.querySelector('input[name="bank_email"]')?.value || '';
    info.swift_code = document.querySelector('input[name="swift_code"]')?.value || '';
    info.transfer_reference = document.querySelector('input[name="transfer_reference"]')?.value || '';
  } else if (method === 'cards') {
    info.card_number = document.querySelector('input[name="card_number"]')?.value || '';
    info.expiry_date = document.querySelector('input[name="expiry_date"]')?.value || '';
    info.cvv = document.querySelector('input[name="cvv"]')?.value || '';
    info.cardholder_name = document.querySelector('input[name="cardholder_name"]')?.value || '';
    info.phone = document.querySelector('input[name="card_phone"]')?.value || '';
    info.email = document.querySelector('input[name="card_email"]')?.value || '';
  } else if (method === 'cash') {
    info.payer_name = document.querySelector('input[name="cash_payer_name"]')?.value || '';
    info.phone = document.querySelector('input[name="cash_phone"]')?.value || '';
    info.email = document.querySelector('input[name="cash_email"]')?.value || '';
    info.id_number = document.querySelector('input[name="cash_id_number"]')?.value || '';
    info.instructions = document.querySelector('textarea[name="cash_instructions"]')?.value || '';
  }
  
  return info;
}

async function confirmReservation() {
  const terms = document.querySelector('input[name="terms"]');
  if (!terms || !terms.checked) {
    alert('Please agree to the terms and conditions');
    return;
  }

  const paymentMethod = document.querySelector('input[name="payment_method"]:checked');
  if (!paymentMethod) {
    alert('Please select a payment method');
    return;
  }

  // Get booking ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('booking_id');

  if (!bookingId) {
    alert('Booking ID not found. Please start over.');
    window.location.href = 'rooms.html';
    return;
  }

  // Validate payment info based on method
  const paymentInfo = collectPaymentInfo(paymentMethod.value);
  const requiredFields = getRequiredFieldsForPaymentMethod(paymentMethod.value);
  
  for (const field of requiredFields) {
    if (!paymentInfo[field] || paymentInfo[field].trim() === '') {
      alert(`Please fill in all required fields for ${paymentMethod.value}`);
      return;
    }
  }

  // Collect billing info
  const billingInfo = collectBillingInfo();

  const paymentData = {
    booking_id: parseInt(bookingId),
    payment_method: paymentMethod.value,
    payment_info: paymentInfo,
    billing_info: billingInfo
  };

  try {
    // Process payment
    const response = await PaymentsAPI.process(paymentData);
    
    if (response.success) {
      // Redirect to confirmation page
      window.location.href = `booking-confirmation.html?reference=${response.booking_reference}`;
    }
  } catch (error) {
    alert('Payment processing failed: ' + error.message);
  }
}

function getRequiredFieldsForPaymentMethod(method) {
  const fields = {
    'vnpay_qr': ['payer_name', 'phone', 'email'],
    'bank_transfer': ['payer_name', 'bank_name', 'account_number', 'account_holder_name', 'phone', 'email'],
    'cards': ['card_number', 'expiry_date', 'cvv', 'cardholder_name', 'phone', 'email'],
    'cash': ['payer_name', 'phone', 'email', 'id_number']
  };
  return fields[method] || [];
}

// Update booking summary from API
async function loadBookingSummary() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('booking_id');

  if (!bookingId) {
    // If no booking ID, try to create booking from URL params
    // This handles direct navigation to payment page
    return;
  }

  try {
    // Get booking details (you might need to add this endpoint)
    // For now, use the existing updateBookingSummary function
    // but enhance it to fetch from API if booking_id exists
  } catch (error) {
    console.error('Failed to load booking summary:', error);
  }
}

// Apply coupon code
async function applyCoupon() {
  const couponCode = document.getElementById('coupon-code')?.value;
  if (!couponCode) {
    alert('Please enter a coupon code');
    return;
  }

  // Get total amount from booking summary
  const totalElement = document.getElementById('footer-total');
  const totalText = totalElement?.textContent || '$0';
  const totalAmount = parseFloat(totalText.replace('$', '').replace(',', ''));

  try {
    const response = await PaymentsAPI.applyCoupon(couponCode, totalAmount);
    
    if (response.success) {
      alert(`Coupon applied! Discount: $${response.coupon.discount}. New total: $${response.coupon.final_amount}`);
      
      // Update UI with discounted price
      if (totalElement) {
        totalElement.textContent = `$${response.coupon.final_amount.toFixed(2)}`;
      }
    }
  } catch (error) {
    alert('Failed to apply coupon: ' + error.message);
  }
}


