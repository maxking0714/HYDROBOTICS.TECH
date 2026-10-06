(function () {
  const adminForm = document.getElementById('adminLoginForm');
  if (!adminForm) return;

  adminForm.addEventListener('submit', event => {
    event.preventDefault();
    const code = document.getElementById('adminCode')?.value.trim();
    const password = document.getElementById('adminPassword')?.value;
    const alertBox = document.getElementById('adminLoginAlert');
    const isValid = code === 'hydro1234' && password === 'admin123';

    if (!isValid) {
      if (alertBox) {
        alertBox.innerHTML = '<div class="alert alert-error">Invalid admin credentials.</div>';
      }
      return;
    }

    const currentUser = {
      username: 'HydroAdmin',
      password: 'admin123',
      role: 'admin',
      email: 'admin@hydrobotics.com',
      location: 'Headquarters',
      age: '32',
      gender: 'Not specified',
      followers: 34,
      following: 19,
      posts: 5,
      likes: 142
    };

    localStorage.setItem('hydroCurrentUser', JSON.stringify(currentUser));
    localStorage.setItem('hydroUsers', JSON.stringify([...(JSON.parse(localStorage.getItem('hydroUsers') || '[]')), currentUser].filter((user, idx, arr) => arr.findIndex(item => item.username === user.username) === idx)));
    window.location.href = 'admin.html';
  });
})();
