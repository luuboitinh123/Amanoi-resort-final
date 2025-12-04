// Navigation active state management
document.addEventListener('DOMContentLoaded', function() {
   const currentPage = window.location.pathname.split('/').pop() || 'index.html';
   const navLinks = document.querySelectorAll('.navbar a[data-page]');
   
   navLinks.forEach(link => {
      const page = link.getAttribute('data-page');
      const href = link.getAttribute('href');
      
      // Remove active class from all links
      link.classList.remove('active');
      
      // Check if current page matches
      if (currentPage === 'index.html' || currentPage === '') {
         if (page === 'home' || href === 'index.html' || href === '#home') {
            link.classList.add('active');
         }
      } else if (currentPage.includes(page) || href.includes(currentPage)) {
         link.classList.add('active');
      }
   });
   
   // Special handling for hash links on index.html
   if (currentPage === 'index.html' || currentPage === '') {
      const hash = window.location.hash;
      if (hash) {
         navLinks.forEach(link => {
            if (link.getAttribute('href') === hash) {
               link.classList.add('active');
            }
         });
      }
   }
});


