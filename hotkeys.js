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
