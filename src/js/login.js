const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const voter_id = document.getElementById('voter-id').value;
  const password = document.getElementById('password').value;
  // Call backend login endpoint; credentials are passed as query params per existing API.
  fetch(`http://127.0.0.1:8000/login?voter_id=${encodeURIComponent(voter_id)}&password=${encodeURIComponent(password)}`)
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Login failed');
    }
  })
  .then(data => {
    if (data.role === 'admin') {
      console.log(data.role)
      localStorage.setItem('jwtTokenAdmin', data.token);
      // Use query param for existing server-side authorizeUser middleware
      window.location.replace(`http://127.0.0.1:8080/admin.html?Authorization=Bearer%20${data.token}`);
    } else if (data.role === 'user'){
      localStorage.setItem('jwtTokenVoter', data.token);
      window.location.replace(`http://127.0.0.1:8080/index.html?Authorization=Bearer%20${data.token}`);
    }
  })
  .catch(error => {
    console.error('Login failed:', error.message);
  });
});
