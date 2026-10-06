(function () {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = 'admin_login.html';
    return;
  }

  function renderStats() {
    const users = getUsers();
    const posts = getFeedPosts();
    const complaints = getComplaints();
    const blockedUsers = getBlockedUsers();

    document.getElementById('adminStatUsers')?.replaceChildren(document.createTextNode(String(users.length)));
    document.getElementById('adminStatPosts')?.replaceChildren(document.createTextNode(String(posts.length)));
    document.getElementById('adminStatComplaints')?.replaceChildren(document.createTextNode(String(complaints.length)));
    document.getElementById('adminStatBlocked')?.replaceChildren(document.createTextNode(String(blockedUsers.length)));
  }

  function renderLogs() {
    const list = document.getElementById('adminLogList');
    if (!list) return;
    const logs = getAdminLog();
    list.innerHTML = logs.slice(0, 12).map(log => `
      <li class="notification-item">
        <span class="notification-dot ${log.type === 'complaint' ? 'alert' : log.type === 'password_change' ? 'purple' : log.type === 'user_blocked' ? 'purple' : 'info'}"></span>
        <div>
          <strong>${escapeHtml(log.summary || 'Platform event')}</strong>
          <small>${escapeHtml(new Date(log.timestamp).toLocaleString())}</small>
        </div>
      </li>
    `).join('') || '<li class="notification-item"><span class="notification-dot info"></span><div><strong>No admin activity yet</strong><small>Platform events will appear here.</small></div></li>';
  }

  function renderComplaints() {
    const list = document.getElementById('adminComplaintList');
    if (!list) return;
    const complaints = getComplaints().sort((first, second) => (first.status === 'pending' ? 0 : 1) - (second.status === 'pending' ? 0 : 1));
    list.innerHTML = complaints.slice(0, 20).map(item => `
      <li class="notification-item">
        <span class="notification-dot alert"></span>
        <div>
          <strong>${escapeHtml(item.category || item.subject || 'General report')} · ${escapeHtml(item.status || 'pending')}</strong>
          <small>Reported by ${escapeHtml(item.username || 'guest')} • ${escapeHtml(item.targetType || 'platform')}${item.target ? ` · ${escapeHtml(item.target)}` : ''} • ${escapeHtml(new Date(item.timestamp).toLocaleString())}</small>
          <p>${escapeHtml(item.message || 'No message provided')}</p>
          ${item.status === 'pending' || !item.status ? `<button class="btn-secondary" type="button" data-report-reviewed="${escapeHtml(item.id)}">Mark reviewed</button>` : ''}
        </div>
      </li>
    `).join('') || '<li class="notification-item"><span class="notification-dot success"></span><div><strong>No complaints</strong><small>All clear.</small></div></li>';
  }

  function renderModerationQueue() {
    const container = document.getElementById('adminModerationBody');
    if (!container) return;

    const posts = getFeedPosts();
    const users = getUsers().filter(user => user.role !== 'admin');
    const blocked = getBlockedUsers();

    const cards = [
      ...posts.map(post => {
        const author = post.author || 'Unknown';
        const isBlocked = isUserBlocked(author);
        return `
          <div class="panel moderation-item ${isBlocked ? 'muted' : ''}">
            <div class="section-head">
              <h3>${escapeHtml(post.title || 'Untitled post')}</h3>
              <span class="badge">${isBlocked ? 'Blocked' : 'Active'}</span>
            </div>
            <p class="text-muted">By ${escapeHtml(author)} • ${escapeHtml(post.timestamp || 'Just now')}</p>
            <p>${escapeHtml(post.body || 'No content')}</p>
            <div class="form-actions">
              <button class="btn-danger" type="button" data-remove-post="${escapeHtml(post.title || post.body || 'post')}">Remove content</button>
              <button class="btn-secondary" type="button" data-block-user="${escapeHtml(author)}">Block user</button>
            </div>
          </div>
        `;
      }),
      ...users.map(user => `
        <div class="panel moderation-item ${blocked.some(item => item.username === user.username) ? 'muted' : ''}">
          <div class="section-head">
            <h3>${escapeHtml(user.username)}</h3>
            <span class="badge">${blocked.some(item => item.username === user.username) ? 'Blocked' : 'Allowed'}</span>
          </div>
          <p class="text-muted">${escapeHtml(user.role || 'member')} • ${user.privacyReviewRequested ? 'Privacy review requested' : 'No privacy review requested'}</p>
          <p class="text-muted">Identity: ${user.identityVerified ? 'Verified' : 'Not verified'} • Sharing: ${user.personalInfoSharingApproved ? 'Approved' : 'Private'}</p>
          <div class="form-actions">
            <button class="btn-secondary" type="button" data-block-user="${escapeHtml(user.username)}">Block user</button>
            <button class="btn-secondary" type="button" data-privacy-action="identity" data-username="${escapeHtml(user.username)}">${user.identityVerified ? 'Revoke verification' : 'Mark identity verified'}</button>
            <button class="btn-secondary" type="button" data-privacy-action="sharing" data-username="${escapeHtml(user.username)}" ${user.identityVerified ? '' : 'disabled'}>${user.personalInfoSharingApproved ? 'Revoke sharing approval' : 'Approve personal-info sharing'}</button>
          </div>
        </div>
      `)
    ];

    container.innerHTML = cards.join('') || '<div class="panel"><p class="text-muted">No moderation items found.</p></div>';
  }

  function renderAppeals() {
    const list = document.getElementById('adminAppealList');
    if (!list) return;
    const appeals = getModerationAppeals().sort((first, second) => (first.status === 'pending' ? 0 : 1) - (second.status === 'pending' ? 0 : 1));
    list.innerHTML = appeals.map(appeal => `
      <li class="notification-item">
        <span class="notification-dot ${appeal.status === 'pending' ? 'alert' : 'info'}"></span>
        <div>
          <strong>${escapeHtml(appeal.caseId)} · ${escapeHtml(appeal.status)}${appeal.outcome ? ` (${escapeHtml(appeal.outcome)})` : ''}</strong>
          <small>${escapeHtml(appeal.username)} · ${escapeHtml(new Date(appeal.createdAt).toLocaleString())}</small>
          <p>${escapeHtml(appeal.reason)}</p>
          ${appeal.status === 'pending' ? `<div class="form-actions"><button class="btn-secondary" type="button" data-resolve-appeal="${escapeHtml(appeal.id)}" data-appeal-outcome="upheld">Uphold decision</button><button class="btn-secondary" type="button" data-resolve-appeal="${escapeHtml(appeal.id)}" data-appeal-outcome="reversed">Reverse decision</button></div>` : ''}
        </div>
      </li>
    `).join('') || '<li class="notification-item"><div><strong>No appeals</strong><small>There are no pending moderation appeals.</small></div></li>';
  }

  function removePostByTitle(titleValue) {
    const posts = getFeedPosts();
    const removedPosts = posts.filter(post => post.title === titleValue || `${post.title || ''}` === titleValue);
    const nextPosts = posts.filter(post => !removedPosts.includes(post));
    localStorage.setItem(STORAGE_FEED, JSON.stringify(nextPosts));
    removedPosts.forEach(post => recordModerationAction('content_removed', post.author || 'Unknown', post.title || 'Untitled post', post));
    logAdminEvent('content_removed', 'Admin removed feed content');
    renderStats();
    renderModerationQueue();
  }

  function blockUser(username) {
    const trimmed = String(username || '').trim();
    if (!trimmed) return;
    const blocked = getBlockedUsers();
    if (!blocked.some(item => item.username && item.username.toLowerCase() === trimmed.toLowerCase())) {
      blocked.unshift({ username: trimmed, reason: 'Admin moderation', blockedAt: new Date().toISOString() });
      saveBlockedUsers(blocked);
      recordModerationAction('user_blocked', trimmed, 'Account blocked');
    }
    logAdminEvent('user_blocked', 'Admin blocked a user');
    renderStats();
    renderModerationQueue();
  }

  function updatePrivacyStatus(username, action) {
    const users = getUsers();
    const index = users.findIndex(user => user.username.toLowerCase() === username.toLowerCase());
    if (index === -1) return;
    const user = users[index];
    if (action === 'identity') {
      user.identityVerified = !user.identityVerified;
      user.identityVerifiedAt = user.identityVerified ? new Date().toISOString() : '';
      if (!user.identityVerified) user.personalInfoSharingApproved = false;
    } else if (action === 'sharing') {
      if (!user.identityVerified) return;
      user.personalInfoSharingApproved = !user.personalInfoSharingApproved;
      user.personalInfoSharingApprovedAt = user.personalInfoSharingApproved ? new Date().toISOString() : '';
    }
    saveUsers(users);
    logAdminEvent('privacy_status_changed', 'Admin updated a privacy review');
    renderModerationQueue();
    renderLogs();
  }

  function markReportReviewed(reportId) {
    const reports = getComplaints();
    const report = reports.find(item => String(item.id) === String(reportId));
    if (!report) return;
    report.status = 'reviewed';
    report.reviewedAt = new Date().toISOString();
    saveComplaints(reports);
    logAdminEvent('report_reviewed', 'Admin reviewed a safety report');
    renderComplaints();
    renderStats();
    renderLogs();
  }

  function resolveAppeal(appealId, outcome) {
    const appeals = getModerationAppeals();
    const appeal = appeals.find(item => item.id === appealId && item.status === 'pending');
    if (!appeal || !['upheld', 'reversed'].includes(outcome)) return;
    const actions = getModerationActions();
    const action = actions.find(item => item.id === appeal.caseId);
    if (!action) return;
    appeal.status = 'resolved';
    appeal.outcome = outcome;
    appeal.resolvedAt = new Date().toISOString();
    if (outcome === 'reversed') {
      if (action.type === 'content_removed' && action.snapshot) {
        const posts = getFeedPosts();
        posts.unshift(action.snapshot);
        saveFeedPosts(posts);
      }
      if (action.type === 'user_blocked') {
        saveBlockedUsers(getBlockedUsers().filter(item => item.username.toLowerCase() !== action.author.toLowerCase()));
      }
      action.status = 'reversed';
      action.reversedAt = new Date().toISOString();
    } else {
      action.status = 'upheld';
    }
    saveModerationActions(actions);
    saveModerationAppeals(appeals);
    logAdminEvent('appeal_resolved', 'Admin resolved a moderation appeal');
    renderAppeals();
    renderModerationQueue();
    renderStats();
    renderLogs();
  }

  document.addEventListener('click', event => {
    const removeButton = event.target.closest('[data-remove-post]');
    if (removeButton) {
      const title = removeButton.dataset.removePost;
      removePostByTitle(title);
    }

    const blockButton = event.target.closest('[data-block-user]');
    if (blockButton) {
      blockUser(blockButton.dataset.blockUser);
    }

    const privacyButton = event.target.closest('[data-privacy-action]');
    if (privacyButton) {
      updatePrivacyStatus(privacyButton.dataset.username, privacyButton.dataset.privacyAction);
    }

    const reviewedButton = event.target.closest('[data-report-reviewed]');
    if (reviewedButton) markReportReviewed(reviewedButton.dataset.reportReviewed);

    const appealButton = event.target.closest('[data-resolve-appeal]');
    if (appealButton) resolveAppeal(appealButton.dataset.resolveAppeal, appealButton.dataset.appealOutcome);
  });

  renderStats();
  renderLogs();
  renderComplaints();
  renderAppeals();
  renderModerationQueue();
})();
