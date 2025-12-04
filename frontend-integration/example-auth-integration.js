// Example: How to integrate authentication in auth.html
// Replace the existing handleLogin and handleRegister functions with these:

async function handleLogin(event) {
  event.preventDefault();
  const email = event.target.email.value;
  const password = event.target.password.value;

  try {
    const response = await AuthAPI.login(email, password);
    if (response.success) {
      alert('Login successful!');
      // Store user data if needed
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      window.location.href = 'index.html';
    }
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const formData = {
    email: event.target.email.value,
    password: event.target.password.value,
    first_name: event.target.first_name.value,
    last_name: event.target.last_name.value,
    phone: event.target.phone.value || null
  };

  const confirmPassword = event.target.confirm_password.value;
  
  if (formData.password !== confirmPassword) {
    alert('Passwords do not match!');
    return;
  }

  if (formData.password.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }

  try {
    const response = await AuthAPI.register(formData);
    if (response.success) {
      alert('Registration successful! Please login.');
      switchTab('login');
    }
  } catch (error) {
    alert('Registration failed: ' + error.message);
  }
}


