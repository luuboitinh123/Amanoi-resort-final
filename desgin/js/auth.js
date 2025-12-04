// Authentication utility functions
// This file should be included in all pages that need authentication

// Check if user is authenticated
function isAuthenticated() {
  return !!localStorage.getItem('authToken');
}

// Get current user info
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Require authentication - redirects to login if not authenticated
function requireAuth(redirectUrl = null) {
  if (!isAuthenticated()) {
    const currentUrl = redirectUrl || window.location.href;
    window.location.href = `auth.html?redirect=${encodeURIComponent(currentUrl)}`;
    return false;
  }
  return true;
}

// Check authentication and update UI
async function checkAuthStatus() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    updateHeaderForGuest();
    return false;
  }

  try {
    const response = await AuthAPI.getCurrentUser();
    if (response.success && response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
      updateHeaderForUser(response.user);
      return true;
    } else {
      // Token invalid, clear it
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      updateHeaderForGuest();
      return false;
    }
  } catch (error) {
    // Token invalid or expired
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    updateHeaderForGuest();
    return false;
  }
}

// Update header to show user info
function updateHeaderForUser(user) {
  const headerFlex = document.querySelector('.header .flex');
  if (!headerFlex) return;
  
  // Remove existing auth buttons
  const authButtonsContainer = headerFlex.querySelector('.auth-buttons-container');
  if (authButtonsContainer) {
    authButtonsContainer.innerHTML = '';
  }
  
  // Find or create header actions container
  let headerActions = headerFlex.querySelector('.header-actions');
  if (!headerActions) {
    headerActions = document.createElement('div');
    headerActions.className = 'header-actions';
    headerActions.style.cssText = 'display: flex; align-items: center; gap: 2rem; flex: 1; justify-content: flex-end;';
    
    const menuBtn = headerFlex.querySelector('#menu-btn');
    if (menuBtn) {
      headerFlex.insertBefore(headerActions, menuBtn);
    } else {
      headerFlex.appendChild(headerActions);
    }
  }
  
  // Keep BOOK A ROOM button
  const bookBtn = headerFlex.querySelector('.btn-primary') || headerFlex.querySelector('.btn');
  if (bookBtn && !bookBtn.classList.contains('btn-primary')) {
    bookBtn.classList.add('btn-primary');
  }
  
  // Create user dropdown button
  const userBtn = document.createElement('a');
  userBtn.href = '#';
  userBtn.className = 'btn btn-user';
  userBtn.style.cssText = 'position: relative; margin-top: 0; padding: 1rem 2rem; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.2rem;';
  userBtn.innerHTML = `<i class="fas fa-user-circle" style="margin-right: 0.5rem;"></i> ${user.first_name || 'User'}`;
  
  // Add dropdown menu
  const dropdown = document.createElement('div');
  dropdown.className = 'user-dropdown';
  dropdown.style.cssText = 'position: absolute; top: 100%; right: 0; margin-top: 1rem; background: var(--white); border: var(--border); border-radius: 0.5rem; box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.1); padding: 1rem 0; min-width: 18rem; display: none; z-index: 1000;';
  
  // Build dropdown menu items
  let   dropdownHTML = `
    <div style="padding: 1rem 2rem; border-bottom: var(--border);">
      <div style="font-size: 1.6rem; font-weight: bold; color: var(--text-dark);">${user.first_name} ${user.last_name}</div>
      <div style="font-size: 1.4rem; color: var(--text-light); margin-top: 0.5rem;">${user.email}</div>
      ${user.role === 'admin' ? '<div style="font-size: 1.2rem; color: var(--main-color); margin-top: 0.5rem; font-weight: 600;"><i class="fas fa-shield-alt"></i> Admin</div>' : ''}
    </div>
    <a href="profile.html" onclick="event.stopPropagation();" style="display: block; padding: 1rem 2rem; font-size: 1.6rem; color: var(--text-dark); text-decoration: none; transition: background-color 0.2s;">
      <i class="fas fa-user" style="margin-right: 0.5rem;"></i> Profile
    </a>
  `;
  
  // Add admin panel link if user is admin
  if (user.role === 'admin') {
    dropdownHTML += `
      <a href="admin.html" onclick="event.stopPropagation();" style="display: block; padding: 1rem 2rem; font-size: 1.6rem; color: var(--main-color); text-decoration: none; transition: background-color 0.2s; font-weight: 600;">
        <i class="fas fa-database" style="margin-right: 0.5rem;"></i> Admin Panel
      </a>
    `;
  }
  
  dropdownHTML += `
    <a href="#" onclick="event.stopPropagation(); handleLogout(); return false;" style="display: block; padding: 1rem 2rem; font-size: 1.6rem; color: var(--text-dark); text-decoration: none; transition: background-color 0.2s;">
      <i class="fas fa-sign-out-alt" style="margin-right: 0.5rem;"></i> Logout
    </a>
  `;
  
  dropdown.innerHTML = dropdownHTML;
  
  userBtn.appendChild(dropdown);
  
  // Toggle dropdown
  userBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
  });
  
  // Close dropdown when clicking outside, but allow links to work
  document.addEventListener('click', function(e) {
    // Don't close if clicking inside dropdown links
    if (e.target.closest('a[href]') && dropdown.contains(e.target.closest('a[href]'))) {
      return; // Let the link navigate
    }
    if (!userBtn.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
  
  // Add user button to auth buttons container
  if (authButtonsContainer) {
    authButtonsContainer.appendChild(userBtn);
  } else {
    const newAuthContainer = document.createElement('div');
    newAuthContainer.className = 'auth-buttons-container';
    newAuthContainer.appendChild(userBtn);
    headerActions.appendChild(newAuthContainer);
  }
}

// Update header for guest users - show login/register options
function updateHeaderForGuest() {
  const headerFlex = document.querySelector('.header .flex');
  if (!headerFlex) return;
  
  // Remove existing auth buttons if any
  const existingAuthBtns = headerFlex.querySelectorAll('.auth-buttons');
  existingAuthBtns.forEach(btn => btn.remove());
  
  const headerBtn = headerFlex.querySelector('.btn');
  if (headerBtn) {
    // Keep the "Book a Room" button
    headerBtn.innerHTML = 'Book a Room';
    headerBtn.href = '#reservation';
    headerBtn.onclick = null;
    headerBtn.style.marginRight = '1rem';
  }
  
  // Find or create auth buttons container
  let authButtonsContainer = headerFlex.querySelector('.auth-buttons-container');
  if (!authButtonsContainer) {
    const headerActions = headerFlex.querySelector('.header-actions');
    if (headerActions) {
      authButtonsContainer = headerActions.querySelector('.auth-buttons-container');
    }
  }
  
  if (!authButtonsContainer) {
    // Create header-actions if it doesn't exist
    const headerActions = document.createElement('div');
    headerActions.className = 'header-actions';
    headerActions.style.cssText = 'display: flex; align-items: center; gap: 2rem; flex: 1; justify-content: flex-end;';
    
    // Move BOOK A ROOM button if it exists
    if (headerBtn) {
      headerBtn.classList.add('btn-primary');
      headerActions.appendChild(headerBtn);
    }
    
    authButtonsContainer = document.createElement('div');
    authButtonsContainer.className = 'auth-buttons-container';
    headerActions.appendChild(authButtonsContainer);
    
    const menuBtn = headerFlex.querySelector('#menu-btn');
    if (menuBtn) {
      headerFlex.insertBefore(headerActions, menuBtn);
    } else {
      headerFlex.appendChild(headerActions);
    }
  }
  
  // Create auth buttons
  const authButtons = document.createElement('div');
  authButtons.className = 'auth-buttons';
  
  const loginBtn = document.createElement('a');
  loginBtn.href = 'auth.html?redirect=' + encodeURIComponent(window.location.href);
  loginBtn.className = 'btn btn-login';
  loginBtn.innerHTML = '<i class="fas fa-arrow-right" style="font-size: 1rem;"></i> LOGIN';
  
  const registerBtn = document.createElement('a');
  registerBtn.href = 'auth.html?redirect=' + encodeURIComponent(window.location.href);
  registerBtn.className = 'btn btn-register';
  registerBtn.innerHTML = '<i class="fas fa-user-plus" style="font-size: 1rem;"></i> REGISTER';
  
  authButtons.appendChild(loginBtn);
  authButtons.appendChild(registerBtn);
  
  // Clear and add buttons
  authButtonsContainer.innerHTML = '';
  authButtonsContainer.appendChild(authButtons);
}

// Handle logout
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    AuthAPI.logout();
  }
}

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', function() {
  checkAuthStatus();
});

