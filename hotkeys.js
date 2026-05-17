// FreeScout Hotkeys — content script
(function () {
  'use strict';
 
  // ── Helpers ───────────────────────────────────────────────────────────────
 
  function click(selector) {
    const el = [...document.querySelectorAll(selector)]
      .find(e => e.offsetParent !== null);
    if (el) { el.click(); return true; }
    return false;
  }
 
  function inEditor() {
    const a = document.activeElement;
    return a && (
      a.tagName === 'TEXTAREA' ||
      a.tagName === 'INPUT'    ||
      a.isContentEditable      ||
      !!a.closest('.fr-element, .reply-form, .note-form, .redactor-editor')
    );
  }
 
  function inConversation() {
    return !!document.querySelector('#conv-toolbar, .conv-subject, #conv-emails');
  }
 
  function inBulkMode() {
    const el = document.querySelector('#conversations-bulk-actions');
    return el && el.style.display !== 'none';
  }
 
  function bulkStatusToggle() {
    return document.querySelector('#conversations-bulk-actions .btn-group [title="Status"]');
  }
 
  function bulkStatusOpen() {
    return !!document.querySelector('#conversations-bulk-actions .btn-group.open .conv-status');
  }
 
  function badge(key, style = '') {
    const s = document.createElement('span');
    s.className = 'fs-hk-label';
    s.textContent = `[${key}]`;
    s.style.cssText = `opacity:.45; font-size:.85em; font-family:monospace; ${style}`;
    return s;
  }
 
  // ── Actions ───────────────────────────────────────────────────────────────
 
  function statusClick(n) {
    const scope = inBulkMode() ? '#conversations-bulk-actions' : '#conv-status';
    click(`${scope} .conv-status a[data-status="${n}"]`);
  }
 
  const actions = {
    reply()         { click('span.conv-reply'); },
    note()          { click('span.conv-add-note'); },
    statusActive()  { statusClick(1); },
    statusPending() { statusClick(2); },
    statusClose()   { statusClick(3); },
    notSpam() { click('.conv-status a[data-status="not_spam"]'); },
    spam() {
      if (inBulkMode()) {
        bulkStatusToggle()?.click();
        setTimeout(() => click('#conversations-bulk-actions .conv-status a[data-status="4"]'), 50);
      } else {
        click('#conv-status [data-toggle="dropdown"]');
        setTimeout(() => click('#conv-status .conv-status a[data-status="4"]'), 50);
      }
    },
    nextConv()      { click('.conv-next-prev a[data-original-title*="Older"]'); },
    prevConv()      { click('.conv-next-prev a[data-original-title*="Newer"]'); },
    send()          { click('.btn-group-send .btn-reply-submit:not(.hidden)'); },
  };
 
  // ── UI hints ──────────────────────────────────────────────────────────────
 
  function initUI() {
    // Status toggle button: "Active [s] ▾"
    const toggle = document.querySelector('#conv-status .conv-info-val');
    if (toggle && !toggle.querySelector('.fs-hk-label')) {
      const caret = toggle.querySelector('.caret');
      caret
        ? toggle.insertBefore(badge('s', 'margin-left:6px;'), caret)
        : toggle.append(badge('s', 'margin-left:6px;'));
    }
 
    // Status dropdown items
    [['1','a'], ['2','p'], ['3','c'], ['4','!'], ['not_spam','u']].forEach(([status, key]) => {
      const a = document.querySelector(`.conv-status a[data-status="${status}"]`);
      if (a && !a.querySelector('.fs-hk-label')) a.prepend(badge(key, 'margin-right:6px;'));
    });
 
    // Bulk status toggle button
    const bulkToggle = document.querySelector('#conversations-bulk-actions .conv-status')
      ?.closest('.btn-group')
      ?.querySelector('[data-toggle="dropdown"]');
    if (bulkToggle && !bulkToggle.querySelector('.fs-hk-label')) {
      const caret = bulkToggle.querySelector('.caret');
      caret
        ? bulkToggle.insertBefore(badge('s', 'margin-left:6px;'), caret)
        : bulkToggle.append(badge('s', 'margin-left:6px;'));
    }
 
    // Reply and Note toolbar buttons
    [['span.conv-reply', '[r] Reply'], ['span.conv-add-note', '[n] Note']].forEach(([sel, label]) => {
      const el = document.querySelector(sel);
      if (el && !el.dataset.fsHkDone) {
        el.setAttribute('data-original-title', label);
        el.dataset.fsHkDone = '1';
      }
    });
 
    // Nav arrows: update tooltip only once (guard via data attribute)
    document.querySelectorAll('.conv-next-prev a[data-original-title]').forEach(a => {
      if (a.dataset.fsHkDone) return;
      const map = { 'Newer': '[k] Newer', 'Older': '[j] Older' };
      const label = map[a.getAttribute('data-original-title')];
      if (!label) return;
      a.setAttribute('data-original-title', label);
      a.dataset.fsHkDone = '1';
    });
 
    // Send button tooltip
    const send = document.querySelector('.btn-group-send .btn-reply-submit:not(.hidden)');
    if (send && !send.dataset.fsHkDone) {
      send.setAttribute('title', 'Ctrl+Enter');
      send.dataset.fsHkDone = '1';
    }
  }
 
  initUI();
  new MutationObserver(initUI).observe(document.body, { childList: true, subtree: true });
 
  // ── Keydown handler ───────────────────────────────────────────────────────
 
  document.addEventListener('keydown', function (e) {
 
    // Ctrl+Enter — send (works inside editor)
    if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      actions.send(); return;
    }
 
    if (e.ctrlKey || e.altKey || e.metaKey) return;
 
    const isExclamation = e.key === '!';
 
    if (inEditor()) { return; }
    if (!inConversation() && !inBulkMode()) { return; }
 
    // Two-key sequence: S → C / P / A / ! (active while status dropdown is open)
    const statusDropdownOpen = !!document.querySelector('#conv-status .dropdown-menu[style*="block"], #conv-status.open .dropdown-menu');
    if (statusDropdownOpen || bulkStatusOpen()) {
      const map = { c: actions.statusClose, p: actions.statusPending, a: actions.statusActive, '!': actions.spam, u: actions.notSpam };
      const fn = map[e.key.toLowerCase()];
      if (fn) { e.preventDefault(); fn(); return; }
    }
 
    // '!' standalone spam (works on AZERTY where ! has shiftKey=true)
    if (isExclamation) {
      e.preventDefault(); actions.spam(); return;
    }
 
    switch (e.key.toLowerCase()) {
      case 'r': e.preventDefault(); actions.reply(); break;
      case 'n': e.preventDefault(); actions.note();  break;
      case 's':
        e.preventDefault();
        if (inBulkMode()) bulkStatusToggle()?.click();
        else click('#conv-status [data-toggle="dropdown"]');
        break;
      case 'j': e.preventDefault(); actions.nextConv(); break;
      case 'k': e.preventDefault(); actions.prevConv(); break;
    }
 
  }, true);
 
})();
 
