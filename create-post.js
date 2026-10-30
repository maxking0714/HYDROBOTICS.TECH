(function () {
  const MEDIA_STORAGE_KEY = 'hydroNotifications';

  function getCurrentUser() {
    const raw = localStorage.getItem('hydroCurrentUser');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem('hydroCurrentUser');
      return null;
    }
  }

  function canSharePersonalInfo(user) {
    if (!user?.username) return false;
    const currentRecord = getUsers().find(item => item.username.toLowerCase() === user.username.toLowerCase()) || user;
    return Boolean(currentRecord.identityVerified && currentRecord.personalInfoSharingApproved);
  }

  function containsPersonalInfo(text) {
    const value = String(text || '');
    return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value)
      || /(?:\+?\d[\d\s().-]{7,}\d)/.test(value)
      || /\b(?:my\s+)?(?:home\s+)?address\s+(?:is|:)\b/i.test(value);
  }

  function getFeedPosts() {
    const raw = localStorage.getItem('hydroFeedPosts');
    if (!raw) return [];
    try {
      return JSON.parse(raw) || [];
    } catch {
      localStorage.removeItem('hydroFeedPosts');
      return [];
    }
  }

  function saveFeedPosts(posts) {
    localStorage.setItem('hydroFeedPosts', JSON.stringify(posts));
  }

  function getUsers() {
    const raw = localStorage.getItem('hydroUsers');
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw) || [];
    } catch {
      localStorage.removeItem('hydroUsers');
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem('hydroUsers', JSON.stringify(users));
  }

  function addNotification(message, type = 'info') {
    const notifications = JSON.parse(localStorage.getItem(MEDIA_STORAGE_KEY) || '[]');
    notifications.unshift({
      id: Date.now(),
      title: message,
      message,
      type,
      time: 'Just now'
    });
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(notifications.slice(0, 12)));
  }

  function setPreview(file) {
    const preview = document.getElementById('mediaPreview');
    if (!preview) return;

    if (!file) {
      preview.classList.remove('has-content');
      preview.innerHTML = 'No media selected';
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = () => {
      preview.classList.add('has-content');
      const mediaMarkup = isVideo
        ? `<video controls src="${reader.result}"></video>`
        : `<img src="${reader.result}" alt="Selected upload preview">`;
      preview.innerHTML = mediaMarkup;
    };
    reader.readAsDataURL(file);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createPostForm');
    const mediaInput = document.getElementById('mediaInput');
    const openCameraBtn = document.getElementById('openCameraBtn');
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const preview = document.getElementById('mediaPreview');

    if (!form || !mediaInput || !openCameraBtn || !selectFilesBtn) {
      return;
    }

    let selectedMedia = null;

    const triggerMediaPicker = (captureMode) => {
      if (captureMode) {
        mediaInput.setAttribute('capture', 'environment');
      } else {
        mediaInput.removeAttribute('capture');
      }
      mediaInput.click();
    };

    openCameraBtn.addEventListener('click', () => triggerMediaPicker(true));
    selectFilesBtn.addEventListener('click', () => triggerMediaPicker(false));

    mediaInput.addEventListener('change', event => {
      const file = event.target.files && event.target.files[0];
      selectedMedia = file || null;
      if (!file) {
        setPreview(null);
        return;
      }
      setPreview(file);
      preview.setAttribute('data-file-name', file.name);
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      const user = getCurrentUser();
      if (!user) {
        window.location.href = 'login.html';
        return;
      }

      const title = document.getElementById('contentTitle').value.trim();
      const body = document.getElementById('contentBody').value.trim();

      if (!canSharePersonalInfo(user) && (containsPersonalInfo(`${title} ${body}`) || selectedMedia)) {
        if (preview) {
          preview.innerHTML = '<span>Personal contact details and unscanned media are blocked until identity verification and admin sharing approval. Request review in Settings &gt; Privacy.</span>';
        }
        return;
      }

      if (!title || !body) {
        if (preview) {
          preview.innerHTML = '<span>Please add a title and content before publishing.</span>';
        }
        return;
      }

      const posts = getFeedPosts();
      const newPost = {
        author: user.username,
        title,
        body,
        timestamp: 'Just now',
        likes: 0,
        media_file: selectedMedia ? '' : '',
        media_type: selectedMedia && selectedMedia.type.startsWith('video/') ? 'video' : 'image',
        image_text: selectedMedia ? selectedMedia.name : ''
      };

      if (selectedMedia) {
        const reader = new FileReader();
        reader.onload = () => {
          newPost.media_file = reader.result;
          newPost.image = reader.result;
          posts.unshift(newPost);
          saveFeedPosts(posts);

          const users = getUsers();
          const index = users.findIndex(item => item.username === user.username);
          if (index !== -1) {
            users[index].posts = (users[index].posts || 0) + 1;
            saveUsers(users);
          }

          addNotification(`${user.username} posted “${title}” to the feed.`, 'success');
          window.location.href = 'feed.html';
        };
        reader.readAsDataURL(selectedMedia);
        return;
      }

      posts.unshift(newPost);
      saveFeedPosts(posts);

      const users = getUsers();
      const index = users.findIndex(item => item.username === user.username);
      if (index !== -1) {
        users[index].posts = (users[index].posts || 0) + 1;
        saveUsers(users);
      }

      addNotification(`${user.username} posted “${title}” to the feed.`, 'success');
      window.location.href = 'feed.html';
    });
  });
})();
