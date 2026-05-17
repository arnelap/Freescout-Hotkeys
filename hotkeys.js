// FreeScout Hotkeys — content script v5
(function () {
  'use strict';

  let pendingKey = null;
  let seqTimer   = null;

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

  function clearSeq() { pendingKey = null; clearTimeout(seqTimer); }

  // ── UI labels ─────────────────────────────────────────────────────────────

  function addHotkeyLabels() {
    // Label the dropdown toggle button with [s]
    const toggle = document.querySelector('#conv-status .conv-info-val');
    if (toggle && !toggle.querySelector('.fs-hk-label')) {
      const badge = document.createElement('span');
      badge.className = 'fs-hk-label';
      badge.textContent = '[s]';
      badge.style.cssText = 'opacity:.45; font-size:.85em; margin-left:6px; font-family:monospace;';
      // Insert after the <span> text, before the caret
      const caret = toggle.querySelector('.caret');
      caret ? toggle.insertBefore(badge, caret) : toggle.append(badge);
    }

    const labels = { 1: 'a', 2: 'p', 3: 'c', 4: '!' };
    Object.entries(labels).forEach(([status, key]) => {
      const a = document.querySelector(`.conv-status a[data-status="${status}"]`);
      if (!a || a.querySelector('.fs-hk-label')) return; // already added
      const badge = document.createElement('span');
      badge.className = 'fs-hk-label';
      badge.textContent = `[${key}]`;
      badge.style.cssText = 'opacity:.45; font-size:.85em; margin-right:6px; font-family:monospace;';
      a.prepend(badge);
    });
  }

  // ── Nav arrow tooltips ───────────────────────────────────────────────────

  function addNavTooltips() {
    const map = { 'Newer': '[k] Newer', 'Older': '[j] Older' };
    document.querySelectorAll('.conv-next-prev a[data-original-title]').forEach(a => {
      const orig = a.getAttribute('data-original-title');
      if (map[orig]) {
        a.setAttribute('data-original-title', map[orig]);
        a.setAttribute('title', map[orig]);
      }
    });
  }

  addNavTooltips();

  // ── Send button tooltip ───────────────────────────────────────────────────

  function addSendTooltip() {
    const btn = document.querySelector('.btn-group-send .btn-reply-submit:not(.hidden)');
    if (btn && btn.getAttribute('title') !== 'Ctrl+Enter') {
      btn.setAttribute('title', 'Ctrl+Enter');
    }
  }

  addSendTooltip();

  // Run once DOM is ready, and re-run if FreeScout re-renders the dropdown
  addHotkeyLabels();
  new MutationObserver(addHotkeyLabels)
    .observe(document.body, { childList: true, subtree: true });

  // Status dropdown is already open (opened when S was pressed).
  // Click the item directly — no need to reopen.
  function statusClick(n) {
    click(`.conv-status a[data-status="${n}"]`);
  }

  const actions = {
    reply()         { click('span.conv-reply'); },
    note()          { click('span.conv-add-note'); },
    statusActive()  { statusClick(1); },
    statusPending() { statusClick(2); },
    statusClose()   { statusClick(3); },
    spam()          { statusClick(4); },
    nextConv()      { click('.conv-next-prev a[data-original-title="Older"]'); },
    prevConv()      { click('.conv-next-prev a[data-original-title="Newer"]'); },
    send() {
      click('.btn-group-send .btn-reply-submit:not(.hidden)');
    },
  };

  document.addEventListener('keydown', function (e) {

    // Ctrl+Enter — send (works inside editor too)
    if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      actions.send(); clearSeq(); return;
    }

    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // '!' is Shift+1 — handle before the inEditor guard
    if (e.key === '!' && !inEditor() && inConversation()) {
      e.preventDefault(); actions.spam(); clearSeq(); return;
    }

    if (inEditor()) { clearSeq(); return; }
    if (!inConversation()) { clearSeq(); return; }

    const key = e.key;

    // Two-key sequence: S → C / P / A / ! (spam)
    if (pendingKey === 's') {
      clearSeq();
      switch (key.toLowerCase()) {
        case 'c': e.preventDefault(); actions.statusClose();   return;
        case 'p': e.preventDefault(); actions.statusPending(); return;
        case 'a': e.preventDefault(); actions.statusActive();  return;
        case '!': e.preventDefault(); actions.spam();          return;
      }
    }

    switch (key.toLowerCase()) {
      case 'r': e.preventDefault(); actions.reply(); break;
      case 'n': e.preventDefault(); actions.note();  break;
      case 's':
        e.preventDefault();
        pendingKey = 's';
        // Open the status dropdown so the user can see their options
        click('#conv-status [data-toggle="dropdown"]');
        seqTimer = setTimeout(clearSeq, 1000);
        break;
      case 'j': e.preventDefault(); actions.nextConv(); break;
      case 'k': e.preventDefault(); actions.prevConv(); break;
    }

  }, true);

})();
