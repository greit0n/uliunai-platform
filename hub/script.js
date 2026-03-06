/**
 * Uliunai.lt Hub — Script
 * Handles desktop hover interactions, keyboard navigation,
 * and mobile card scroll tracking.
 */
(function () {
  'use strict';

  function init() {
    setupEmbers();
    setupDesktopHover();
    setupKeyboardNav();
    setupMobileScroll();
    setupDotNav();
  }

  /* ── Ember Particles ─────────────────────────────────────────────────── */

  function setupEmbers() {
    var container = document.getElementById('ember-container');
    if (!container) return;

    for (var i = 0; i < 35; i++) {
      var ember = document.createElement('div');
      ember.className = 'ember';
      var size = Math.random() * 3 + 2;
      var animName = i % 2 === 0 ? 'float-up' : 'float-up-sway';
      var duration = (Math.random() * 10 + 6) + 's';
      var delay = (Math.random() * 10) + 's';
      var opacity = Math.random() * 0.5 + 0.4;

      ember.style.left = (Math.random() * 100) + '%';
      ember.style.width = size + 'px';
      ember.style.height = size + 'px';
      ember.style.setProperty('--ember-opacity', opacity);
      ember.style.opacity = opacity;
      ember.style.animation = animName + ' ' + duration + ' ' + delay + ' ease-in-out infinite';
      container.appendChild(ember);
    }
  }

  /* ── Desktop Hover ─────────────────────────────────────────────────── */

  function setupDesktopHover() {
    var container = document.querySelector('.split-container');
    var kf1Panel = document.querySelector('.game-panel--kf1');
    var kf2Panel = document.querySelector('.game-panel--kf2');

    if (!container || !kf1Panel || !kf2Panel) return;

    // Neutral dead zone: center 20% of the viewport triggers no hover.
    // Only when the mouse moves clearly into a side does the panel expand.
    var DEAD_ZONE = 0.10; // 10% on each side of center = 20% total neutral zone

    container.addEventListener('mousemove', function (e) {
      var rect = container.getBoundingClientRect();
      var relativeX = (e.clientX - rect.left) / rect.width; // 0 = left edge, 1 = right edge

      if (relativeX < 0.5 - DEAD_ZONE) {
        // Clearly on the KF1 (left) side
        if (!container.classList.contains('hover-kf1')) {
          container.classList.add('hover-kf1');
          container.classList.remove('hover-kf2');
        }
      } else if (relativeX > 0.5 + DEAD_ZONE) {
        // Clearly on the KF2 (right) side
        if (!container.classList.contains('hover-kf2')) {
          container.classList.add('hover-kf2');
          container.classList.remove('hover-kf1');
        }
      } else {
        // In the neutral dead zone — reset to 50/50
        container.classList.remove('hover-kf1', 'hover-kf2');
      }
    });

    container.addEventListener('mouseleave', function () {
      container.classList.remove('hover-kf1', 'hover-kf2');
    });
  }

  /* ── Keyboard Navigation ───────────────────────────────────────────── */

  function setupKeyboardNav() {
    var container = document.querySelector('.split-container');
    var kf1Panel = document.querySelector('.game-panel--kf1');
    var kf2Panel = document.querySelector('.game-panel--kf2');

    if (!container || !kf1Panel || !kf2Panel) return;

    var blurTimeout = null;

    kf1Panel.addEventListener('focus', function () {
      clearTimeout(blurTimeout);
      container.classList.add('hover-kf1');
      container.classList.remove('hover-kf2');
    });

    kf2Panel.addEventListener('focus', function () {
      clearTimeout(blurTimeout);
      container.classList.add('hover-kf2');
      container.classList.remove('hover-kf1');
    });

    kf1Panel.addEventListener('blur', function () {
      blurTimeout = setTimeout(function () {
        if (
          document.activeElement !== kf1Panel &&
          document.activeElement !== kf2Panel
        ) {
          container.classList.remove('hover-kf1', 'hover-kf2');
        }
      }, 100);
    });

    kf2Panel.addEventListener('blur', function () {
      blurTimeout = setTimeout(function () {
        if (
          document.activeElement !== kf1Panel &&
          document.activeElement !== kf2Panel
        ) {
          container.classList.remove('hover-kf1', 'hover-kf2');
        }
      }, 100);
    });

    // KF2 Enter/Space: pulse the coming-soon badge
    kf2Panel.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var badge = kf2Panel.querySelector('.coming-soon-badge');
        if (badge) {
          badge.style.transform = 'scale(1.1)';
          setTimeout(function () {
            badge.style.transform = 'scale(1)';
          }, 300);
        }
      }
    });
  }

  /* ── Mobile Scroll Tracking ────────────────────────────────────────── */

  function setupMobileScroll() {
    var track = document.querySelector('.mobile-cards__track');
    var dots = document.querySelectorAll('.mobile-dot');
    var swipeHint = document.querySelector('.swipe-hint');

    if (!track || dots.length === 0) return;

    var hasScrolled = false;

    track.addEventListener(
      'scroll',
      function () {
        var cards = track.querySelectorAll('.mobile-card');
        if (cards.length === 0) return;

        var cardWidth = cards[0].offsetWidth;
        var activeIndex = Math.round(track.scrollLeft / cardWidth);

        // Update dots
        dots.forEach(function (dot, i) {
          if (i === activeIndex) {
            dot.classList.add('mobile-dot--active');
          } else {
            dot.classList.remove('mobile-dot--active');
          }
        });

        // Hide swipe hint after first scroll
        if (!hasScrolled && swipeHint) {
          hasScrolled = true;
          swipeHint.classList.add('swipe-hint--hidden');
        }
      },
      { passive: true }
    );
  }

  /* ── Dot Click Navigation ──────────────────────────────────────────── */

  function setupDotNav() {
    var track = document.querySelector('.mobile-cards__track');
    var dots = document.querySelectorAll('.mobile-dot');

    if (!track || dots.length === 0) return;

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var index = parseInt(dot.getAttribute('data-index'), 10);
        if (isNaN(index)) return;

        var cards = track.querySelectorAll('.mobile-card');
        if (cards.length === 0) return;

        var cardWidth = cards[0].offsetWidth;
        track.scrollTo({
          left: index * cardWidth,
          behavior: 'smooth',
        });
      });
    });
  }

  /* ── Init ──────────────────────────────────────────────────────────── */

  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  ) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
