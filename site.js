const STORAGE_USERS = 'hydroUsers';
const STORAGE_CURRENT = 'hydroCurrentUser';
const STORAGE_FEED = 'hydroFeedPosts';
const STORAGE_ADMIN_LOG = 'hydroAdminLogs';
const STORAGE_PRIVACY_CONSENT = 'hydroPrivacyConsent';
const STORAGE_AUDIT_MIGRATION = 'hydroAuditPrivacyMigration';
const STORAGE_BLOCKED_USERS = 'hydroBlockedUsers';
const STORAGE_COMPLAINTS = 'hydroComplaints';
const STATIC_FEED_JSON = 'data/posts.json';

const defaultUsers = [
    { username: 'HydroAdmin', password: 'admin123', role: 'admin', email: 'admin@hydrobotics.com', location: 'Headquarters', age: '32', gender: 'Not specified', followers: 34, following: 19, posts: 5, likes: 142 },
    { username: 'InventorA', password: 'invent123', role: 'inventor', email: 'inventor@example.com', location: 'Tech City', age: '27', gender: 'Other', followers: 24, following: 18, posts: 9, likes: 58 }
];

const defaultFeedPosts = [
    { author: 'HydroAdmin', title: 'Welcome to HYDROBOTICS', body: 'This is the community feed preview page for the static GitHub Pages site.', timestamp: 'Today • 10:00 AM', likes: 12 },
    { author: 'InventorA', title: 'New Prototype Idea', body: 'Sharing a new design concept for a modular robotics system that adapts to field conditions.', timestamp: 'Today • 9:20 AM', likes: 8 },
    { author: 'HydroAdmin', title: 'Project Update', body: 'Our logistics platform now supports safer scheduling, equipment tracking, and collaboration.', timestamp: 'Yesterday • 5:30 PM', likes: 15 }
];

function getUsers() {
    const raw = localStorage.getItem(STORAGE_USERS);
    if (!raw) {
        const seededUsers = [...defaultUsers];
        localStorage.setItem(STORAGE_USERS, JSON.stringify(seededUsers));
        return seededUsers;
    }
    try {
        const users = JSON.parse(raw) || [];
        if (users.length === 0) {
            const seededUsers = [...defaultUsers];
            localStorage.setItem(STORAGE_USERS, JSON.stringify(seededUsers));
            return seededUsers;
        }
        return users;
    } catch {
        localStorage.removeItem(STORAGE_USERS);
        return [...defaultUsers];
    }
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function getAdminLog() {
    const raw = localStorage.getItem(STORAGE_ADMIN_LOG);
    if (!raw) {
        return [];
    }
    try {
        const logs = JSON.parse(raw) || [];
        return logs;
    } catch {
        localStorage.removeItem(STORAGE_ADMIN_LOG);
        return [];
    }
}

function saveAdminLog(entries) {
    localStorage.setItem(STORAGE_ADMIN_LOG, JSON.stringify(entries));
}

function logAdminEvent(type, summary, details = {}) {
    if (localStorage.getItem(STORAGE_PRIVACY_CONSENT) !== 'granted') return null;
    const logEntry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        type,
        summary,
        details: {},
        username: getCurrentUser()?.username || 'system'
    };
    const logs = getAdminLog();
    logs.unshift(logEntry);
    saveAdminLog(logs.slice(0, 250));
    return logEntry;
}

function setPrivacyConsent(granted) {
    localStorage.setItem(STORAGE_PRIVACY_CONSENT, granted ? 'granted' : 'denied');
    if (!granted) saveAdminLog([]);
    document.getElementById('privacyNotice')?.remove();
    const toggle = document.getElementById('privacyTrackingToggle');
    if (toggle) toggle.checked = granted;
    const status = document.getElementById('privacyTrackingStatus');
    if (status) status.textContent = granted ? 'Optional activity tracking is enabled.' : 'Optional activity tracking is off.';
}

function showPrivacyNotice() {
    if (localStorage.getItem(STORAGE_PRIVACY_CONSENT)) return;
    const notice = document.createElement('section');
    notice.id = 'privacyNotice';
    notice.className = 'privacy-notice';
    notice.setAttribute('aria-label', 'Privacy and storage notice');
    const copy = document.createElement('div');
    copy.innerHTML = '<strong>Privacy notice</strong><p>This demo uses browser storage for account and app features. Optional activity logging is off unless you allow it. <a href="privacy.html">Privacy Policy</a></p>';
    const actions = document.createElement('div');
    actions.className = 'privacy-notice-actions';
    const reject = document.createElement('button');
    reject.type = 'button';
    reject.textContent = 'Use essential only';
    reject.addEventListener('click', () => setPrivacyConsent(false));
    const allow = document.createElement('button');
    allow.type = 'button';
    allow.className = 'btn-secondary';
    allow.textContent = 'Allow activity logging';
    allow.addEventListener('click', () => setPrivacyConsent(true));
    actions.append(reject, allow);
    notice.append(copy, actions);
    document.body.append(notice);
}

function clearLocalPlatformData() {
    if (!window.confirm('Delete all HYDROBOTICS data stored in this browser? This will sign you out and cannot be undone.')) return;
    localStorage.clear();
    window.location.href = 'index.html';
}

function initPrivacyControls() {
    if (localStorage.getItem(STORAGE_AUDIT_MIGRATION) !== '1') {
        saveAdminLog([]);
        localStorage.setItem(STORAGE_AUDIT_MIGRATION, '1');
    }
    showPrivacyNotice();
    const toggle = document.getElementById('privacyTrackingToggle');
    const status = document.getElementById('privacyTrackingStatus');
    if (toggle) {
        toggle.checked = localStorage.getItem(STORAGE_PRIVACY_CONSENT) === 'granted';
        toggle.addEventListener('change', () => setPrivacyConsent(toggle.checked));
    }
    if (status) status.textContent = toggle?.checked ? 'Optional activity tracking is enabled.' : 'Optional activity tracking is off.';
    document.getElementById('clearLocalData')?.addEventListener('click', clearLocalPlatformData);
    document.querySelectorAll('footer .container, footer .footer-content').forEach(footer => {
        const footerLinks = [
            ['privacy.html', 'Privacy Policy and Cookie Notice', 'privacy-policy'],
            ['terms.html', 'Terms of Service', 'terms'],
            ['report.html', 'Report a safety concern', 'safety-report'],
            ['transparency.html', 'Transparency Statement', 'transparency'],
            ['appeal.html', 'Appeal a moderation decision', 'appeal']
        ];
        footerLinks.forEach(([href, label, key]) => {
            if (footer.querySelector(`[data-footer-link="${key}"]`)) return;
            const link = document.createElement('a');
            link.href = href;
            link.textContent = label;
            link.dataset.footerLink = key;
            link.className = 'privacy-footer-link';
            footer.append(link);
        });
    });
}

function getBlockedUsers() {
    const raw = localStorage.getItem(STORAGE_BLOCKED_USERS);
    if (!raw) {
        localStorage.setItem(STORAGE_BLOCKED_USERS, JSON.stringify([]));
        return [];
    }
    try {
        return JSON.parse(raw) || [];
    } catch {
        localStorage.removeItem(STORAGE_BLOCKED_USERS);
        return [];
    }
}

function saveBlockedUsers(list) {
    localStorage.setItem(STORAGE_BLOCKED_USERS, JSON.stringify(list));
}

function isUserBlocked(username) {
    if (!username) return false;
    return getBlockedUsers().some(item => item.username && item.username.toLowerCase() === username.toLowerCase());
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

function getComplaints() {
    const raw = localStorage.getItem(STORAGE_COMPLAINTS);
    if (!raw) {
        localStorage.setItem(STORAGE_COMPLAINTS, JSON.stringify([]));
        return [];
    }
    try {
        return JSON.parse(raw) || [];
    } catch {
        localStorage.removeItem(STORAGE_COMPLAINTS);
        return [];
    }
}

function saveComplaints(list) {
    localStorage.setItem(STORAGE_COMPLAINTS, JSON.stringify(list));
}

function getModerationActions() {
    try { return JSON.parse(localStorage.getItem('hydroModerationActions') || '[]') || []; }
    catch { return []; }
}

function saveModerationActions(actions) {
    localStorage.setItem('hydroModerationActions', JSON.stringify(actions));
}

function getModerationAppeals() {
    try { return JSON.parse(localStorage.getItem('hydroModerationAppeals') || '[]') || []; }
    catch { return []; }
}

function saveModerationAppeals(appeals) {
    localStorage.setItem('hydroModerationAppeals', JSON.stringify(appeals));
}

function saveUserReport({ category, targetType = 'platform', target = '', author = '', reference = '', details }) {
    const complaint = {
        id: Date.now() + Math.random(),
        username: getCurrentUser()?.username || 'guest',
        category,
        targetType,
        target,
        author,
        reference,
        message: String(details || '').trim().slice(0, 3000),
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    const complaints = getComplaints();
    complaints.unshift(complaint);
    saveComplaints(complaints);
    logAdminEvent('complaint', 'A safety report was submitted');
    return complaint;
}

function recordModerationAction(type, author, reference, snapshot = null) {
    const actions = getModerationActions();
    const action = {
        id: `MOD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        author,
        reference,
        snapshot,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    actions.unshift(action);
    saveModerationActions(actions);
    return action;
}

function renderModerationDecisions() {
    const container = document.getElementById('moderationDecisionList');
    const user = getCurrentUser();
    if (!container || !user) return;
    const decisions = getModerationActions().filter(action => action.author?.toLowerCase() === user.username.toLowerCase());
    const appeals = getModerationAppeals();
    container.innerHTML = decisions.map(action => `
        <li class="notification-item">
            <span class="notification-dot alert"></span>
            <div>
                <strong>${escapeHtml(action.type === 'content_removed' ? 'Content removed' : 'Account restricted')} · ${escapeHtml(action.status)}</strong>
                <small>Case ${escapeHtml(action.id)} · ${escapeHtml(new Date(action.createdAt).toLocaleString())}</small>
                <p>${escapeHtml(action.reference || 'Moderation decision')}</p>
                ${appeals.filter(appeal => appeal.caseId === action.id).map(appeal => `<small>Appeal ${escapeHtml(appeal.status)}${appeal.outcome ? ` · ${escapeHtml(appeal.outcome)}` : ''}</small>`).join('')}
                ${action.status === 'active' ? `<a class="btn-secondary" href="appeal.html?case=${encodeURIComponent(action.id)}">Appeal this decision</a>` : ''}
            </div>
        </li>
    `).join('') || '<li class="notification-item"><div><strong>No moderation decisions</strong><small>There are no active decisions for this account.</small></div></li>';
}

function initAppealPage() {
    const form = document.getElementById('appealForm');
    if (!form) return;
    const user = getCurrentUser();
    const loginPrompt = document.getElementById('appealLoginPrompt');
    if (!user) {
        form.hidden = true;
        if (loginPrompt) loginPrompt.hidden = false;
        return;
    }
    const caseId = new URLSearchParams(window.location.search).get('case') || '';
    const action = getModerationActions().find(item => item.id === caseId && item.author?.toLowerCase() === user.username.toLowerCase() && item.status === 'active');
    if (!action) {
        form.hidden = true;
        showAlert('appealAlert', 'No active moderation decision for this account matches that case ID.', 'error');
        return;
    }
    document.getElementById('appealCaseId').value = caseId;
    document.getElementById('appealDecisionSummary').textContent = `${action.type === 'content_removed' ? 'Content removed' : 'Account restricted'}: ${action.reference}`;
    form.addEventListener('submit', event => {
        event.preventDefault();
        const appeals = getModerationAppeals();
        if (appeals.some(appeal => appeal.caseId === caseId && appeal.status === 'pending')) {
            showAlert('appealAlert', 'An appeal for this decision is already awaiting review.', 'info');
            return;
        }
        appeals.unshift({
            id: `APL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            caseId,
            username: user.username,
            reason: document.getElementById('appealReason').value.trim().slice(0, 2000),
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        saveModerationAppeals(appeals);
        form.hidden = true;
        showAlert('appealAlert', 'Your appeal has been submitted for administrator review.', 'success');
    });
}

function initTransparencyPage() {
    const actions = getModerationActions();
    const appeals = getModerationAppeals();
    const reports = getComplaints();
    const values = {
        transparencyRemoved: actions.filter(action => action.type === 'content_removed').length,
        transparencyBlocked: actions.filter(action => action.type === 'user_blocked').length,
        transparencyReceived: reports.length,
        transparencyReviewed: reports.filter(report => report.status === 'reviewed').length,
        transparencyAppeals: appeals.filter(appeal => appeal.status === 'resolved').length
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value);
    });
}

function getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_CURRENT);
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem(STORAGE_CURRENT);
        return null;
    }
}

function setCurrentUser(user) {
    localStorage.setItem(STORAGE_CURRENT, JSON.stringify(user));
}

function logoutUser() {
    localStorage.removeItem(STORAGE_CURRENT);
    const userChip = document.getElementById('userChip');
    const authLink = document.getElementById('authLink');
    const signOutLink = document.getElementById('signOutLink');

    if (userChip) userChip.hidden = true;
    if (authLink) {
        authLink.textContent = 'Login';
        authLink.href = 'login.html';
        authLink.onclick = null;
    }
    if (signOutLink) signOutLink.remove();

    window.location.href = 'index.html';
}

function applyDarkMode(enabled = localStorage.getItem('hydroDarkMode') === 'true') {
    document.body.classList.toggle('dark-mode', enabled);
    return enabled;
}

function getFeedPosts() {
    const raw = localStorage.getItem(STORAGE_FEED);
    if (!raw) {
        const seededPosts = [...defaultFeedPosts];
        localStorage.setItem(STORAGE_FEED, JSON.stringify(seededPosts));
        return seededPosts;
    }
    try {
        const posts = JSON.parse(raw) || [];
        return posts;
    } catch {
        localStorage.removeItem(STORAGE_FEED);
        return [];
    }
}

function ensurePlatformSeedData() {
    getUsers();
    getFeedPosts();
    getAdminLog();
    getBlockedUsers();
    getComplaints();
}

function saveFeedPosts(posts) {
    localStorage.setItem(STORAGE_FEED, JSON.stringify(posts));
}

function escapeHtml(text) {
    return String(text || '').replace(/[&<>"]+/g, match => {
        const replacements = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
        return replacements[match] || match;
    });
}

function formatPostText(text) {
    if (!text) return '';
    return escapeHtml(text).replace(/\n/g, '<br>');
}

function normalizeFeedPost(post) {
    const mediaFile = post.media_file || post.image || '';
    const mediaType = post.media_type || (post.image ? 'image' : '');
    const normalizedMediaSrc = mediaFile && (mediaFile.startsWith('data:') || mediaFile.startsWith('blob:'))
        ? mediaFile
        : mediaFile ? `data/uploads/${mediaFile}` : '';
    return {
        author: post.author || post.username || 'HYDROBOTICS',
        title: post.title || 'Untitled Post',
        body: post.content || post.body || '',
        timestamp: post.created_at || post.timestamp || 'Unknown time',
        likes: Array.isArray(post.likes) ? post.likes.length : (typeof post.likes === 'number' ? post.likes : 0),
        comments: Array.isArray(post.comments) ? post.comments.length : 0,
        shares: post.shares || 0,
        reposts: post.reposts || 0,
        mediaSrc: normalizedMediaSrc,
        mediaType,
        imageText: post.image_text || '',
    };
}

function getStaticFeedPosts() {
    if (window.staticFeedPosts && Array.isArray(window.staticFeedPosts)) {
        return Promise.resolve(window.staticFeedPosts);
    }

    return fetch(STATIC_FEED_JSON)
        .then(response => {
            if (!response.ok) throw new Error('Feed data not available');
            return response.json();
        })
        .then(data => Array.isArray(data) ? data : [])
        .catch(() => {
            return window.staticFeedPosts && Array.isArray(window.staticFeedPosts)
                ? window.staticFeedPosts
                : [];
        });
}

function renderPostMedia(post) {
    if (!post.mediaSrc) return '';
    if (post.mediaType === 'video') {
        return `
            <div class="post-media">
                <video controls preload="metadata" src="${escapeHtml(post.mediaSrc)}"></video>
                ${post.imageText ? `<p class="text-muted">${escapeHtml(post.imageText)}</p>` : ''}
            </div>
        `;
    }
    return `
        <div class="post-media">
            <img src="${escapeHtml(post.mediaSrc)}" alt="${escapeHtml(post.imageText || post.title)}">
            ${post.imageText ? `<p class="text-muted">${escapeHtml(post.imageText)}</p>` : ''}
        </div>
    `;
}

function showNavUser() {
    const authLink = document.getElementById('authLink');
    if (!authLink) return;

    let userChip = document.getElementById('userChip');
    if (!userChip) {
        userChip = document.createElement('span');
        userChip.id = 'userChip';
        userChip.className = 'user-chip';
        userChip.hidden = true;
        authLink.parentElement.insertBefore(userChip, authLink);
    }

    let signOutLink = document.getElementById('signOutLink');
    const user = getCurrentUser();

    if (user) {
        if (!signOutLink) {
            signOutLink = document.createElement('a');
            signOutLink.id = 'signOutLink';
            signOutLink.className = 'btn-secondary sign-out-link';
            signOutLink.href = '#';
            signOutLink.textContent = 'Sign out';
            signOutLink.addEventListener('click', event => {
                event.preventDefault();
                logoutUser();
            });
            authLink.parentElement.appendChild(signOutLink);
        }

        userChip.hidden = false;
        userChip.textContent = `Logged in as ${user.username}`;
        authLink.textContent = 'Account';
        authLink.href = 'account.html';
        authLink.onclick = null;
        signOutLink.hidden = false;
    } else {
        if (signOutLink) signOutLink.remove();
        userChip.remove();
        authLink.textContent = 'Login';
        authLink.href = 'login.html';
        authLink.onclick = null;
    }
}

let lastScrollPosition = 0;

function updateHeaderActionVisibility() {
    const authLink = document.getElementById('authLink');
    const navRight = authLink?.parentElement;
    if (!authLink || !navRight) return;

    const currentScroll = window.scrollY || 0;
    const scrollingUp = currentScroll < lastScrollPosition;

    if (currentScroll <= 12) {
        document.body.classList.remove('header-actions-hidden');
        document.body.classList.add('header-actions-visible');
        navRight.classList.remove('is-hidden');
        navRight.style.opacity = '1';
        navRight.style.visibility = 'visible';
    } else if (scrollingUp) {
        document.body.classList.remove('header-actions-hidden');
        document.body.classList.add('header-actions-visible');
        navRight.classList.remove('is-hidden');
        navRight.style.opacity = '1';
        navRight.style.visibility = 'visible';
    } else {
        document.body.classList.add('header-actions-hidden');
        document.body.classList.remove('header-actions-visible');
        navRight.classList.add('is-hidden');
        navRight.style.opacity = '0';
        navRight.style.visibility = 'hidden';
    }

    lastScrollPosition = currentScroll;
}

function showAlert(containerId, message, type = 'info') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function clearAlert(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}

function switchAuthTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (!loginTab || !registerTab || !loginForm || !registerForm) return;

    if (tab === 'register') {
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        loginForm.hidden = true;
        registerForm.hidden = false;
    } else {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.hidden = false;
        registerForm.hidden = true;
    }
}

function handleLoginForm(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (!user) {
        showAlert('loginAlert', 'Login failed. Please check your username and password.', 'error');
        return;
    }
    setCurrentUser(user);
    logAdminEvent('login', 'User logged in', { role: user.role });
    showNavUser();
    window.location.href = 'index.html';
}

function handleRegisterForm(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername')?.value.trim();
    const password = document.getElementById('registerPassword')?.value;
    const email = document.getElementById('registerEmail')?.value.trim();
    const location = document.getElementById('registerLocation')?.value.trim();
    const role = document.getElementById('registerRole')?.value;
    if (!username || !password || !email) {
        showAlert('loginAlert', 'Please complete every required field to register.', 'error');
        return;
    }
    const users = getUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        showAlert('loginAlert', 'That username is already taken. Please choose another.', 'error');
        return;
    }
    const newUser = {
        username,
        password,
        email,
        location: location || 'Not specified',
        role: role || 'member',
        age: document.getElementById('registerAge')?.value || 'Not specified',
        gender: document.getElementById('registerGender')?.value || 'Not specified',
        followers: 0,
        following: 0,
        posts: 0,
        likes: 0
    };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);
    logAdminEvent('register', 'Account registered', { role: newUser.role });
    window.location.href = 'inventor.html';
}

function renderFeedPage() {
    const feedContainer = document.getElementById('feedPosts');
    const formSection = document.getElementById('newPostSection');
    const user = getCurrentUser();
    if (!feedContainer) return;

    if (!user) {
        showAlert('feedAlert', 'You are not logged in. Please log in to create posts and save activity in the site preview.', 'info');
        if (formSection) formSection.hidden = true;
    } else {
        clearAlert('feedAlert');
        if (formSection) formSection.hidden = false;
    }

    feedContainer.innerHTML = '<div class="panel"><p class="text-muted">Loading feed posts…</p></div>';

    getStaticFeedPosts().then(staticPosts => {
        const localPosts = getFeedPosts();
        let feedPosts = [];

        if (staticPosts.length) {
            feedPosts = [...localPosts, ...staticPosts];
        } else if (localPosts.length) {
            feedPosts = localPosts;
        } else {
            feedPosts = defaultFeedPosts;
        }

        const blockedUsers = getBlockedUsers();
        const visiblePosts = feedPosts.filter(post => {
            const authorName = post.author || post.username || 'HYDROBOTICS';
            return !blockedUsers.some(blocked => blocked.username && blocked.username.toLowerCase() === authorName.toLowerCase());
        });

        if (visiblePosts.length === 0) {
            feedContainer.innerHTML = '<div class="panel"><p class="text-muted">No posts are available yet.</p></div>';
            return;
        }

        feedContainer.innerHTML = visiblePosts.map(rawPost => {
            const post = normalizeFeedPost(rawPost);
            const metaParts = [];
            if (post.likes) metaParts.push(`${post.likes} likes`);
            if (post.comments) metaParts.push(`${post.comments} comments`);
            if (post.shares) metaParts.push(`${post.shares} shares`);
            if (post.reposts) metaParts.push(`${post.reposts} reposts`);
            const metaText = metaParts.length ? `<p class="post-meta">${metaParts.join(' • ')}</p>` : '<p class="post-meta text-muted">No reactions yet.</p>';

            return `
                <article class="post-card">
                    <h3>${escapeHtml(post.title)}</h3>
                    <p class="text-muted">${escapeHtml(post.author)} • ${escapeHtml(post.timestamp)}</p>
                    ${post.body ? `<p>${formatPostText(post.body)}</p>` : ''}
                    ${renderPostMedia(post)}
                    ${metaText}
                    <div class="post-actions" role="group" aria-label="Post actions">
                        <button class="post-action" type="button" data-feed-action="like">Like</button>
                        <button class="post-action" type="button" data-feed-action="comment">Comment</button>
                        <button class="post-action" type="button" data-feed-action="share">Share</button>
                        <a class="post-action" href="report.html?type=post&amp;target=${encodeURIComponent(post.title)}&amp;author=${encodeURIComponent(post.author)}">Report</a>
                    </div>
                </article>
            `;
        }).join('');
    }).catch(() => {
        const fallbackPosts = getFeedPosts().length ? getFeedPosts() : defaultFeedPosts;
        feedContainer.innerHTML = fallbackPosts.map(rawPost => {
            const post = normalizeFeedPost(rawPost);
            return `
                <article class="post-card">
                    <h3>${escapeHtml(post.title)}</h3>
                    <p class="text-muted">${escapeHtml(post.author)} • ${escapeHtml(post.timestamp)}</p>
                    ${post.body ? `<p>${formatPostText(post.body)}</p>` : ''}
                    ${renderPostMedia(post)}
                    <p class="post-meta text-muted">${post.likes} likes • ${post.comments} comments</p>
                    <div class="post-actions" role="group" aria-label="Post actions">
                        <button class="post-action" type="button" data-feed-action="like">Like</button>
                        <button class="post-action" type="button" data-feed-action="comment">Comment</button>
                        <button class="post-action" type="button" data-feed-action="share">Share</button>
                        <a class="post-action" href="report.html?type=post&amp;target=${encodeURIComponent(post.title)}&amp;author=${encodeURIComponent(post.author)}">Report</a>
                    </div>
                </article>
            `;
        }).join('');
    });
}

function initSocialFeedActions() {
    const feedContainer = document.getElementById('feedPosts');
    if (!feedContainer || feedContainer.dataset.actionsBound) return;
    feedContainer.dataset.actionsBound = 'true';
    feedContainer.addEventListener('click', event => {
        const action = event.target.closest('[data-feed-action]');
        if (!action) return;
        const actionName = action.dataset.feedAction;
        if (actionName === 'like') {
            action.classList.toggle('active');
            action.textContent = action.classList.contains('active') ? 'Liked' : 'Like';
        } else if (actionName === 'comment') {
            action.classList.add('active');
            action.textContent = 'Commenting';
        } else if (actionName === 'share') {
            action.classList.add('active');
            action.textContent = 'Shared';
        }
    });
}

function handleFeedPost(event) {
    event.preventDefault();
    const title = document.getElementById('postTitle')?.value.trim();
    const body = document.getElementById('postBody')?.value.trim();
    const user = getCurrentUser();
    if (!user) {
        showAlert('feedAlert', 'Please login before creating a post.', 'error');
        return;
    }
    if (!title || !body) {
        showAlert('feedAlert', 'Please provide both a title and body for your post.', 'error');
        return;
    }
    if (!canSharePersonalInfo(user) && containsPersonalInfo(`${title} ${body}`)) {
        showAlert('feedAlert', 'Personal contact information is hidden until identity verification and admin sharing approval. Request review in Settings > Privacy.', 'error');
        return;
    }
    const posts = getFeedPosts();
    const newPost = {
        author: user.username,
        title,
        body,
        timestamp: 'Just now',
        likes: 0
    };
    posts.unshift(newPost);
    saveFeedPosts(posts);
    logAdminEvent('post', 'Feed post published', {});
    const users = getUsers();
    const userIndex = users.findIndex(u => u.username === user.username);
    if (userIndex !== -1) {
        users[userIndex].posts = (users[userIndex].posts || 0) + 1;
        saveUsers(users);
        setCurrentUser(users[userIndex]);
        showNavUser();
    }
    document.getElementById('postTitle').value = '';
    document.getElementById('postBody').value = '';
    showAlert('feedAlert', 'Your post is now visible in the feed.', 'success');
    renderFeedPage();
}

function renderDashboardPage() {
    const user = getCurrentUser();
    const summaryContainer = document.getElementById('dashboardSummary');
    const detailsContainer = document.getElementById('dashboardDetails');
    if (!summaryContainer || !detailsContainer) return;

    if (!user) {
        summaryContainer.innerHTML = '<p class="text-muted">Log in to see your personal dashboard stats, recent activity, and account summary.</p>';
        detailsContainer.innerHTML = '<div class="panel"><p class="text-muted">Dashboard preview only. Create an account and log in to personalize the experience.</p></div>';
        return;
    }

    const users = getUsers();
    const totalUsers = users.length;
    const totalPosts = getFeedPosts().length;
    summaryContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-box"><strong>${totalUsers}</strong>Total Users</div>
            <div class="stat-box"><strong>${totalPosts}</strong>Feed Posts</div>
            <div class="stat-box"><strong>${user.posts || 0}</strong>Your Posts</div>
            <div class="stat-box"><strong>${user.likes || 0}</strong>Total Likes</div>
        </div>
    `;
    detailsContainer.innerHTML = `
        <div class="panel">
            <h2>Recent Activity</h2>
            <p>Welcome, ${user.username}. Your dashboard shows your account activity, post counts, and community engagement.</p>
        </div>
        <div class="panel">
            <h2>Quick Links</h2>
            <p><a href="feed.html">Go to Social Feed</a> | <a href="account.html">Profile</a> | <a href="settings.html">Settings</a> | <a href="videos.html">Videos</a></p>
        </div>
    `;
}

function renderAccountPage() {
    const user = getCurrentUser();
    const accountContainer = document.getElementById('accountContent');
    if (!accountContainer) return;

    if (!user) {
        accountContainer.innerHTML = '<div class="panel"><p class="text-muted">Login to view your account profile, follower counts, and recent posts.</p></div>';
        return;
    }

    accountContainer.innerHTML = `
        <div class="panel">
            <h1>${user.username}</h1>
            <p class="text-muted">${user.role.toUpperCase()} • ${canSharePersonalInfo(user) ? escapeHtml(user.email || 'No email') : 'Personal details private'}</p>
            <div class="stats-grid" style="margin-top:1.5rem;">
                <div class="stat-box"><strong>${user.posts || 0}</strong>Posts</div>
                <div class="stat-box"><strong>${user.followers || 0}</strong>Followers</div>
                <div class="stat-box"><strong>${user.following || 0}</strong>Following</div>
                <div class="stat-box"><strong>${user.likes || 0}</strong>Likes</div>
            </div>
        </div>
        <div class="panel">
            <h2>Profile Summary</h2>
            <p>Location: ${canSharePersonalInfo(user) ? escapeHtml(user.location || 'Not specified') : 'Private until approval'}</p>
            <p>Age: ${canSharePersonalInfo(user) ? escapeHtml(user.age || 'Not specified') : 'Private until approval'}</p>
            <p>Gender: ${canSharePersonalInfo(user) ? escapeHtml(user.gender || 'Not specified') : 'Private until approval'}</p>
        </div>
        <div class="panel">
            <h2>Your Latest Post</h2>
            <p>Use the feed page to publish updates, ideas, and recruiter messages for the HYDROBOTICS community.</p>
        </div>
    `;
}

function initSettingsPage() {
    const user = getCurrentUser();
    renderModerationDecisions();
    if (!user) {
        showAlert('settingsMessage', 'Log in to update your settings and save profile preferences.', 'info');
        document.getElementById('settingsForm')?.querySelectorAll('input, select')?.forEach(input => input.disabled = true);
        return;
    }
    document.getElementById('settingsGender').value = user.gender || 'Not specified';
    document.getElementById('settingsAge').value = user.age || '';
    document.getElementById('settingsLocation').value = user.location || '';
    document.getElementById('settingsEmail').value = user.email || '';
    document.getElementById('settingsPhone').value = user.phone || '';
    const reviewStatus = document.getElementById('privacyReviewStatus');
    const requestButton = document.getElementById('requestPrivacyReview');
    if (reviewStatus) {
        reviewStatus.textContent = canSharePersonalInfo(user)
            ? 'Identity verified and personal-info sharing approved.'
            : user.privacyReviewRequested
                ? 'Review requested. Personal details remain private until both admin checks are complete.'
                : 'Personal details are private by default.';
    }
    if (requestButton) {
        requestButton.disabled = Boolean(user.privacyReviewRequested || canSharePersonalInfo(user));
        requestButton.textContent = user.privacyReviewRequested ? 'Review Requested' : canSharePersonalInfo(user) ? 'Approved' : 'Request Review';
    }
}

function handleSettingsSubmit(event) {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user) {
        showAlert('settingsMessage', 'Please log in to update your settings.', 'error');
        return;
    }
    const users = getUsers();
    const index = users.findIndex(u => u.username === user.username);
    if (index === -1) return;
    users[index].gender = document.getElementById('settingsGender')?.value || user.gender;
    users[index].age = document.getElementById('settingsAge')?.value || user.age;
    users[index].location = document.getElementById('settingsLocation')?.value || user.location;
    users[index].email = document.getElementById('settingsEmail')?.value || user.email;
    users[index].phone = document.getElementById('settingsPhone')?.value || user.phone || '';
    saveUsers(users);
    setCurrentUser(users[index]);
    logAdminEvent('profile_update', 'Profile settings updated', {});
    showNavUser();
    showAlert('settingsMessage', 'Your settings have been saved locally in this browser.', 'success');
}

function requestPrivacyReview() {
    const user = getCurrentUser();
    if (!user) return;
    const users = getUsers();
    const index = users.findIndex(item => item.username === user.username);
    if (index === -1 || canSharePersonalInfo(users[index])) return;
    users[index].privacyReviewRequested = true;
    users[index].privacyReviewRequestedAt = new Date().toISOString();
    saveUsers(users);
    setCurrentUser(users[index]);
    logAdminEvent('privacy_review_requested', `${user.username} requested identity and personal-info sharing review`, { username: user.username });
    initSettingsPage();
    showAlert('settingsMessage', 'Review requested. Do not upload identity documents in this demo; arrange verification with an administrator through a secure channel.', 'success');
}

function initSettingsOptions() {
    const sections = document.querySelectorAll('.settings-section');
    const menuItems = document.querySelectorAll('[data-settings-section]');
    const showSection = sectionId => {
        sections.forEach(section => section.classList.toggle('active', section.id === sectionId));
        menuItems.forEach(item => item.classList.toggle('active', item.dataset.settingsSection === sectionId));
    };
    menuItems.forEach(item => item.addEventListener('click', () => showSection(item.dataset.settingsSection)));
    document.querySelectorAll('[data-settings-link]').forEach(link => link.addEventListener('click', event => {
        event.preventDefault();
        showSection(link.dataset.settingsLink);
    }));

    const darkMode = applyDarkMode();
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = darkMode;
        darkModeToggle.addEventListener('change', () => {
            localStorage.setItem('hydroDarkMode', String(darkModeToggle.checked));
            applyDarkMode(darkModeToggle.checked);
        });
    }

    document.getElementById('settingsLogout')?.addEventListener('click', logoutUser);
    document.getElementById('saveLanguage')?.addEventListener('click', () => {
        localStorage.setItem('hydroLanguage', document.getElementById('settingsLanguage').value);
        showAlert('settingsMessage', 'Language preference saved.', 'success');
    });
    const savedLanguage = localStorage.getItem('hydroLanguage');
    if (savedLanguage && document.getElementById('settingsLanguage')) document.getElementById('settingsLanguage').value = savedLanguage;
    document.getElementById('passwordForm')?.addEventListener('submit', event => {
        event.preventDefault();
        const user = getCurrentUser();
        const current = document.getElementById('currentPassword').value;
        const next = document.getElementById('newPassword').value;
        const confirmation = document.getElementById('confirmPassword').value;
        if (!user || current !== user.password) return showAlert('settingsMessage', 'Current password is incorrect.', 'error');
        if (next !== confirmation) return showAlert('settingsMessage', 'New passwords do not match.', 'error');
        const users = getUsers();
        const index = users.findIndex(item => item.username === user.username);
        users[index].password = next;
        saveUsers(users);
        setCurrentUser(users[index]);
        logAdminEvent('password_change', 'Password changed', {});
        event.target.reset();
        showAlert('settingsMessage', 'Password updated successfully.', 'success');
    });
    document.getElementById('reportForm')?.addEventListener('submit', event => {
        event.preventDefault();
        const form = event.currentTarget;
        saveUserReport({
            category: document.getElementById('reportCategory')?.value,
            targetType: 'platform',
            target: document.getElementById('reportTarget')?.value.trim(),
            details: document.getElementById('reportDetails')?.value
        });
        form.reset();
        showAlert('settingsMessage', 'Your report was submitted for administrator review.', 'success');
    });
}

function initReportPage() {
    const form = document.getElementById('safetyReportForm');
    if (!form) return;
    const params = new URLSearchParams(window.location.search);
    const targetType = params.get('type') || 'platform';
    const target = params.get('target') || '';
    const author = params.get('author') || '';
    document.getElementById('reportType').value = targetType;
    document.getElementById('reportTarget').value = targetType === 'chat' ? target : [author, target].filter(Boolean).join(' - ');
    document.getElementById('reportReference').value = `${targetType === 'community' ? 'inventor-community.html' : targetType === 'chat' ? 'chat-thread.html' : 'feed.html'}`;
    form.addEventListener('submit', event => {
        event.preventDefault();
        const details = document.getElementById('safetyReportDetails').value.trim();
        if (details.length < 10) {
            showAlert('reportPageAlert', 'Please add at least 10 characters so an administrator can review the report.', 'error');
            return;
        }
        saveUserReport({
            category: document.getElementById('safetyReportCategory').value,
            targetType: document.getElementById('reportType').value,
            target: document.getElementById('reportTarget').value.trim(),
            author,
            reference: document.getElementById('reportReference').value,
            details
        });
        form.reset();
        showAlert('reportPageAlert', 'Report submitted. It is now in the administrator review queue.', 'success');
    });
}

function initInventorPage() {
    const profileForm = document.getElementById('inventorProfileForm');
    const profileMessage = document.getElementById('inventorProfileMessage');
    if (!profileForm || !profileMessage) return;

    profileForm.addEventListener('submit', event => {
        event.preventDefault();
        const profile = {
            name: document.getElementById('inventorName').value.trim(),
            type: document.getElementById('inventorType').value,
            focus: document.getElementById('inventorFocus').value.trim(),
            support: document.getElementById('inventorSupport').value.trim(),
            contact: document.getElementById('inventorContact').value.trim(),
            closedDeal: document.getElementById('closedDealConsent').checked,
            copyright: document.getElementById('copyrightConsent').checked,
            createdAt: new Date().toISOString()
        };
        const user = getCurrentUser();
        const profiles = JSON.parse(localStorage.getItem('hydroInventorProfiles') || '[]');
        profiles.push({ ...profile, username: user?.username || 'guest' });
        localStorage.setItem('hydroInventorProfiles', JSON.stringify(profiles));
        finishInventorProfile(profile, user);
    });

    document.getElementById('proposalForm')?.addEventListener('submit', event => {
        event.preventDefault();
        const user = getCurrentUser();
        const message = document.getElementById('proposalDetails').value.trim();
        const request = { action: 'help_request', username: user?.username || 'guest', message };
        const requests = JSON.parse(localStorage.getItem('hydroHelpRequests') || '[]');
        requests.push({ ...request, status: 'pending', createdAt: new Date().toISOString() });
        localStorage.setItem('hydroHelpRequests', JSON.stringify(requests));
        event.target.reset();
        profileMessage.innerHTML = '<div class="alert alert-success">Your proposal request was saved in this browser.</div>';
    });
}

function finishInventorProfile(profile, user) {
    const username = user?.username || profile.name.replace(/\s+/g, '').toLowerCase() || `member${Date.now()}`;
    const users = getUsers();
    let account = users.find(item => item.username.toLowerCase() === username.toLowerCase());
    if (!account) {
        account = { username, password: '', email: profile.contact, location: 'Not specified', role: profile.type, posts: 0, likes: 0, followers: 0, following: 0 };
        users.push(account);
        saveUsers(users);
    }
    setCurrentUser(account);
    window.location.href = 'inventor-community.html';
}

const communitySeedPosts = [
    { author: 'HYDROBOTICS Lab', role: 'business', type: 'proposal', title: 'Looking for a robotics enclosure partner', body: 'We are looking for a manufacturer who can help turn a field robotics prototype into a small production run.', contact: 'Reply with your capabilities and lead time.', closedDeal: false, timestamp: 'Today' },
    { author: 'Parts Network', role: 'partner', type: 'special', title: 'Prototype assembly special', body: 'Special pricing for first-time board assembly orders and small-batch component sourcing.', contact: 'Visit the supplier page for current details.', closedDeal: false, timestamp: 'Yesterday' },
    { author: 'CAD Helper', role: 'partner', type: 'help', title: 'CAD and design review available', body: 'I can help review manufacturability, tolerances, and 3D-print-ready files.', contact: 'Message through your agreed project channel.', closedDeal: true, timestamp: 'Yesterday' },
    { author: 'Northstar Ventures', role: 'investor', type: 'proposal', title: 'Seeking practical climate-tech prototypes', body: 'We are looking for early-stage teams with a working prototype and a clear path to field testing.', contact: 'Share a short overview and traction summary.', closedDeal: false, timestamp: 'Today' }
];

let activeCommunityFilter = 'all';

function getCommunityPosts() {
    const raw = localStorage.getItem('hydroCommunityPosts');
    if (!raw) return [...communitySeedPosts];
    try { return JSON.parse(raw) || []; } catch { return [...communitySeedPosts]; }
}

function renderCommunityPosts() {
    const container = document.getElementById('communityPosts');
    if (!container) return;
    const posts = getCommunityPosts().filter(post => activeCommunityFilter === 'all' || post.role === activeCommunityFilter || (activeCommunityFilter === 'partner' && ['manufacturer', 'technical partner', 'partner'].includes(post.role)));
    container.innerHTML = posts.map(post => `
        <article class="community-post panel">
            <div class="community-post-top"><span class="post-type-badge post-type-${escapeHtml(post.type)}">${escapeHtml(post.type)}</span><span class="community-role">${escapeHtml(post.role || 'community member')}</span><span class="text-muted">${escapeHtml(post.timestamp || 'Just now')}</span></div>
            <h3>${escapeHtml(post.title)}</h3>
            <p class="text-muted">${escapeHtml(post.author)} is open to new conversations</p>
            <p>${formatPostText(post.body)}</p>
            <div class="community-contact-row"><p><strong>Contact route:</strong> ${escapeHtml(post.contact)}</p><button class="btn-secondary community-contact-button" type="button" data-contact-name="${escapeHtml(post.author)}">Contact</button><a class="btn-secondary community-contact-button" href="report.html?type=community&amp;target=${encodeURIComponent(post.title)}&amp;author=${encodeURIComponent(post.author)}">Report</a></div>
            ${post.closedDeal ? '<p class="closed-deal-note">Closed-deal conversation: agree on confidentiality before sharing protected information.</p>' : ''}
        </article>
    `).join('') || '<div class="panel"><p class="text-muted">No community posts yet.</p></div>';
}

function initCommunityPage() {
    renderCommunityPosts();
    document.getElementById('refreshCommunityFeed')?.addEventListener('click', renderCommunityPosts);
    document.querySelectorAll('[data-community-filter]').forEach(button => button.addEventListener('click', () => {
        activeCommunityFilter = button.dataset.communityFilter;
        document.querySelectorAll('[data-community-filter]').forEach(item => item.classList.toggle('active', item === button));
        renderCommunityPosts();
    }));
    document.getElementById('communityPosts')?.addEventListener('click', event => {
        const button = event.target.closest('[data-contact-name]');
        if (button) window.location.href = `chat-thread.html?contact=${encodeURIComponent(button.dataset.contactName)}`;
    });
    document.getElementById('communityPostForm')?.addEventListener('submit', event => {
        event.preventDefault();
        const user = getCurrentUser();
        if (!user) return showAlert('communityMessage', 'Create an account before publishing to the community.', 'error');
        const post = {
            author: user.username,
            role: document.getElementById('communityPostRole').value,
            type: document.getElementById('communityPostType').value,
            title: document.getElementById('communityPostTitle').value.trim(),
            body: document.getElementById('communityPostBody').value.trim(),
            contact: document.getElementById('communityPostContact').value.trim(),
            closedDeal: document.getElementById('communityPostClosed').checked,
            timestamp: 'Just now'
        };
        const posts = getCommunityPosts();
        posts.unshift(post);
        localStorage.setItem('hydroCommunityPosts', JSON.stringify(posts));
        event.target.reset();
        showAlert('communityMessage', 'Your post is now visible in the community feed.', 'success');
        renderCommunityPosts();
    });
}

const CHAT_CONTACTS_KEY = 'hydroChatContacts';
const CHAT_MESSAGES_KEY = 'hydroChatMessages';
const CHAT_REQUESTS_KEY = 'hydroChatRequests';
const CHAT_SCHEMA_KEY = 'hydroChatSchema';
const chatDirectoryCompanies = [
    { name: 'BlueLift Logistics', role: 'Company', detail: 'Contracting and freight services' },
    { name: 'EarthGear Systems', role: 'Company', detail: 'Industrial automation and equipment' },
    { name: 'HydroTech Partners', role: 'Company', detail: 'Sponsorship and recruitment' },
    { name: 'PCBWay', role: 'Manufacturing partner', detail: 'PCB, CNC, and 3D printing' }
];
const chatSeedContacts = [
    { name: 'HydroAdmin', role: 'HYDROBOTICS team', detail: 'Review the new project update.', status: 'online' }
];
const chatSeedMessages = {
    HydroAdmin: [
        { sender: 'HydroAdmin', message: 'Welcome to HYDROBOTICS. Send me a message whenever you need help with your account or project.', timestamp: 'Today · 09:15' },
        { sender: 'HydroAdmin', message: 'Here are the latest project resources.', timestamp: 'Today · 09:16', attachments: [
            { name: 'HYDROBOTICS project brief.pdf', type: 'document', size: '2.4 MB', url: 'inventor.html' },
            { name: 'prototype-walkthrough.mp4', type: 'video', size: '18.6 MB', url: 'data/uploads/media_6a12d62d166f64.55657666.mp4' },
            { name: 'prototype-reference.jpg', type: 'image', size: '860 KB', url: 'data/uploads/media_6a1420a3505a66.05577161.jpeg' }
        ] }
    ]
};
const chatSeedRequests = [
    { name: 'Flatha', role: 'Inventor', detail: 'Would like to connect about a new idea.' },
    { name: 'Northstar Ventures', role: 'Investor', detail: 'Interested in practical climate-tech prototypes.' }
];
let activeChatName = '';

function readChatStorage(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw) || fallback; } catch { return fallback; }
}

function writeChatStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function migrateChatStorage() {
    if (localStorage.getItem(CHAT_SCHEMA_KEY) === '2') return;
    writeChatStorage(CHAT_CONTACTS_KEY, [...chatSeedContacts]);
    writeChatStorage(CHAT_MESSAGES_KEY, JSON.parse(JSON.stringify(chatSeedMessages)));
    writeChatStorage(CHAT_REQUESTS_KEY, [...chatSeedRequests]);
    localStorage.setItem(CHAT_SCHEMA_KEY, '2');
}

function getChatContacts() {
    return readChatStorage(CHAT_CONTACTS_KEY, [...chatSeedContacts]);
}

function getChatMessages() {
    return readChatStorage(CHAT_MESSAGES_KEY, JSON.parse(JSON.stringify(chatSeedMessages)));
}

function getChatRequests() {
    return readChatStorage(CHAT_REQUESTS_KEY, [...chatSeedRequests]);
}

function chatInitial(name) {
    return (name || '?').trim().charAt(0).toUpperCase();
}

function renderChatContacts() {
    const container = document.getElementById('conversationList');
    const count = document.getElementById('conversationCount');
    if (!container || !count) return;
    const contacts = document.body.dataset.page === 'chat'
        ? getChatContacts().filter(contact => contact.name === 'HydroAdmin')
        : getChatContacts();
    count.textContent = contacts.length;
    container.innerHTML = contacts.map(contact => `
        <a class="conversation-item ${contact.name === activeChatName ? 'active' : ''}" href="chat-thread.html?contact=${encodeURIComponent(contact.name)}" data-chat-name="${escapeHtml(contact.name)}">
            <span class="avatar avatar-small">${escapeHtml(chatInitial(contact.name))}</span>
            <span class="conversation-copy"><strong>${escapeHtml(contact.name)}</strong><small>${escapeHtml(contact.detail || contact.role)}</small></span>
            <span class="status ${escapeHtml(contact.status || 'online')}"></span>
        </a>
    `).join('') || '<p class="text-muted small-note">No conversations yet.</p>';
}

function renderChatRequests() {
    const container = document.getElementById('requestList');
    const count = document.getElementById('requestCount');
    if (!container || !count) return;
    const requests = getChatRequests();
    count.textContent = requests.length;
    container.innerHTML = requests.map(request => `
        <div class="request-item"><span class="avatar avatar-small">${escapeHtml(chatInitial(request.name))}</span><div class="conversation-copy"><strong>${escapeHtml(request.name)}</strong><small>${escapeHtml(request.detail || request.role)}</small><button class="request-action" type="button" data-accept-request="${escapeHtml(request.name)}">Accept</button></div></div>
    `).join('') || '<p class="text-muted small-note">No pending requests.</p>';
}

function getChatDirectory() {
    const users = getUsers().map(user => ({ name: user.username, role: user.role || 'Community member', detail: canSharePersonalInfo(user) ? (user.email || user.location || 'HYDROBOTICS member') : 'Personal details private' }));
    return [...users, ...chatDirectoryCompanies].filter((item, index, list) => list.findIndex(candidate => candidate.name.toLowerCase() === item.name.toLowerCase()) === index);
}

function renderChatDirectory(query = '') {
    const container = document.getElementById('directoryResults');
    if (!container) return;
    const normalizedQuery = query.trim().toLowerCase();
    const results = normalizedQuery ? getChatDirectory().filter(item => `${item.name} ${item.role} ${item.detail}`.toLowerCase().includes(normalizedQuery)).slice(0, 8) : [];
    container.innerHTML = results.map(item => `
        <a class="directory-item" href="chat-thread.html?contact=${encodeURIComponent(item.name)}" data-directory-name="${escapeHtml(item.name)}" data-directory-role="${escapeHtml(item.role)}" data-directory-detail="${escapeHtml(item.detail)}">
            <span class="avatar avatar-small">${escapeHtml(chatInitial(item.name))}</span><span class="conversation-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.role)} · ${escapeHtml(item.detail)}</small></span>
        </a>
    `).join('') || `<p class="text-muted small-note">${normalizedQuery ? 'No matching people or companies.' : 'Search to find people and companies.'}</p>`;
}

function renderActiveChat() {
    const contact = getChatContacts().find(item => item.name === activeChatName);
    const emptyChat = document.getElementById('emptyChat');
    const activeChat = document.getElementById('activeChat');
    if (!contact || !emptyChat || !activeChat) return;
    emptyChat.hidden = true;
    activeChat.hidden = false;
    document.getElementById('threadAvatar').textContent = chatInitial(contact.name);
    document.getElementById('threadName').textContent = contact.name;
    document.getElementById('threadMeta').textContent = contact.role;
    const reportContact = document.getElementById('reportChatContact');
    if (reportContact) reportContact.href = `report.html?type=chat&target=${encodeURIComponent(contact.name)}`;
    const messages = getChatMessages()[contact.name] || [];
    document.getElementById('messageList').innerHTML = messages.map(message => `
        <div class="message-bubble ${message.sender === contact.name ? 'incoming' : 'outgoing'}"><p>${formatPostText(message.message)}</p>${renderChatAttachments(message.attachments)}<small>${escapeHtml(message.timestamp || 'Just now')}</small></div>
    `).join('') || '<p class="text-muted empty-thread">Start the conversation.</p>';
    document.querySelectorAll('[data-chat-name]').forEach(item => item.classList.toggle('active', item.dataset.chatName === activeChatName));
    document.getElementById('messageList').scrollTop = document.getElementById('messageList').scrollHeight;
}

function renderChatAttachments(attachments = []) {
    if (!Array.isArray(attachments) || !attachments.length) return '';
    return `<div class="message-attachments">${attachments.map(attachment => `
        <a class="attachment-card" href="${escapeHtml(attachment.url || '#')}" target="_blank" rel="noopener"><span class="attachment-icon">${attachment.type === 'video' ? '▶' : attachment.type === 'image' ? '▧' : '▤'}</span><span><strong>${escapeHtml(attachment.name)}</strong><small>${escapeHtml(attachment.type)} · ${escapeHtml(attachment.size || 'Attached file')}</small></span></a>
    `).join('')}</div>`;
}

function openChat(name, role = 'Community member', detail = 'New conversation') {
    const contacts = getChatContacts();
    if (!contacts.some(contact => contact.name === name)) {
        contacts.unshift({ name, role, detail, status: 'online' });
        writeChatStorage(CHAT_CONTACTS_KEY, contacts);
    }
    activeChatName = name;
    renderChatContacts();
    renderActiveChat();
}

function initChatPage() {
    migrateChatStorage();
    renderChatContacts();
    renderChatRequests();
    renderChatDirectory();
    document.getElementById('directorySearch')?.addEventListener('input', event => renderChatDirectory(event.target.value));
    document.getElementById('requestList')?.addEventListener('click', event => {
        const button = event.target.closest('[data-accept-request]');
        if (!button) return;
        const requestName = button.dataset.acceptRequest;
        const request = getChatRequests().find(item => item.name === requestName);
        writeChatStorage(CHAT_REQUESTS_KEY, getChatRequests().filter(item => item.name !== requestName));
        window.location.href = `chat-thread.html?contact=${encodeURIComponent(requestName)}`;
    });
}

function initChatThreadPage() {
    migrateChatStorage();
    const contact = new URLSearchParams(window.location.search).get('contact') || 'HydroAdmin';
    openChat(contact);
    document.getElementById('messageForm')?.addEventListener('submit', event => {
        event.preventDefault();
        const input = document.getElementById('messageInput');
        const attachmentInput = document.getElementById('messageAttachment');
        const message = input.value.trim();
        const files = Array.from(attachmentInput?.files || []);
        if ((!message && !files.length) || !activeChatName) return;
        const sender = getCurrentUser();
        if (!canSharePersonalInfo(sender) && (containsPersonalInfo(message) || files.length)) {
            showAlert('chatPrivacyAlert', 'Personal contact details and unscanned attachments are blocked until identity verification and admin sharing approval. Request review in Settings > Privacy.', 'error');
            return;
        }
        const messages = getChatMessages();
        messages[activeChatName] = messages[activeChatName] || [];
        messages[activeChatName].push({
            sender: sender?.username || 'You',
            message,
            timestamp: 'Just now',
            attachments: files.map(file => ({ name: file.name, type: file.type.split('/')[0] || 'file', size: `${Math.max(1, Math.round(file.size / 1024))} KB` }))
        });
        writeChatStorage(CHAT_MESSAGES_KEY, messages);
        logAdminEvent('interaction', 'A chat message was sent', { attachmentCount: files.length });
        input.value = '';
        if (attachmentInput) attachmentInput.value = '';
        renderActiveChat();
    });
}

function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const linkPage = (link.getAttribute('href') || '').split('/').pop().toLowerCase() || 'index.html';
        if (linkPage === currentPage) {
            link.classList.add('active-link');
        } else {
            link.classList.remove('active-link');
        }
    });
}

function triggerEmojiRain() {
    const layer = document.getElementById('emojiRainLayer');
    const main = document.querySelector('.page');
    if (!layer || !main) return;

    const emojis = ['✨', '🚀', '💡', '💬', '🎉', '🤝', '🌟', '🔥'];
    layer.innerHTML = '';
    main.style.opacity = '0';
    main.style.transform = 'translateY(14px)';
    main.style.transition = 'opacity 0.35s ease, transform 0.35s ease';

    window.setTimeout(() => {
        for (let i = 0; i < 22; i++) {
            const emoji = document.createElement('span');
            emoji.className = 'emoji-fall';
            emoji.textContent = emojis[i % emojis.length];
            emoji.style.left = `${(Math.random() * 100)}vw`;
            emoji.style.animationDelay = `${(Math.random() * 0.7).toFixed(2)}s`;
            emoji.style.animationDuration = `${(2.2 + Math.random() * 1.7).toFixed(2)}s`;
            emoji.style.setProperty('--drift', `${(Math.random() * 120 - 60).toFixed(0)}px`);
            emoji.style.fontSize = `${(1.3 + Math.random() * 1.7).toFixed(2)}rem`;
            layer.appendChild(emoji);
        }
    }, 180);

    window.setTimeout(() => {
        main.style.opacity = '1';
        main.style.transform = 'translateY(0)';
    }, 1200);

    window.setTimeout(() => {
        layer.innerHTML = '';
    }, 4200);
}

function initPage() {
    ensurePlatformSeedData();
    initPrivacyControls();
    showNavUser();
    const page = document.body.dataset.page;
    if (!page) return;
    switch (page) {
        case 'login':
            switchAuthTab('login');
            document.getElementById('loginForm')?.addEventListener('submit', handleLoginForm);
            document.getElementById('registerForm')?.addEventListener('submit', handleRegisterForm);
            document.getElementById('loginTab')?.addEventListener('click', () => switchAuthTab('login'));
            document.getElementById('registerTab')?.addEventListener('click', () => switchAuthTab('register'));
            break;
        case 'feed':
            triggerEmojiRain();
            renderFeedPage();
            initSocialFeedActions();
            document.getElementById('feedForm')?.addEventListener('submit', handleFeedPost);
            break;
        case 'chat':
            initChatPage();
            break;
        case 'chat-thread':
            initChatThreadPage();
            break;
        case 'dashboard':
            renderDashboardPage();
            break;
        case 'account':
            renderAccountPage();
            break;
        case 'settings':
            initSettingsPage();
            initSettingsOptions();
            document.getElementById('settingsForm')?.addEventListener('submit', handleSettingsSubmit);
            document.getElementById('requestPrivacyReview')?.addEventListener('click', requestPrivacyReview);
            break;
        case 'report':
            initReportPage();
            break;
        case 'appeal':
            initAppealPage();
            break;
        case 'transparency':
            initTransparencyPage();
            break;
        case 'inventor':
            initInventorPage();
            break;
        case 'inventor-community':
            initCommunityPage();
            break;
        default:
            break;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    applyDarkMode();
    initPage();
    highlightActiveNav();
    updateHeaderActionVisibility();
    window.addEventListener('scroll', updateHeaderActionVisibility, { passive: true });
});
