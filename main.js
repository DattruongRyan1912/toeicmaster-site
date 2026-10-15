(function () {
  'use strict';

  var root = document.documentElement;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Recordings: play only while visible. With reduced motion, never autoplay; offer a play button instead.
  var videos = Array.prototype.slice.call(document.querySelectorAll('.video-frame video'));
  videos.forEach(function (video) {
    var button = video.parentElement.querySelector('.video-play');
    if (calm && button) {
      button.hidden = false;
      button.addEventListener('click', function () {
        if (video.paused) video.play().catch(function () {});
        else video.pause();
      });
      video.addEventListener('play', function () { button.firstElementChild.textContent = '❚❚'; button.setAttribute('aria-pressed', 'true'); });
      video.addEventListener('pause', function () { button.firstElementChild.textContent = '▶'; button.setAttribute('aria-pressed', 'false'); });
    }
  });
  if (!calm && 'IntersectionObserver' in window) {
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.play().catch(function () {});
        else entry.target.pause();
      });
    }, { threshold: 0.35 });
    videos.forEach(function (video) { watcher.observe(video); });
  }

  if (calm || !root.classList.contains('motion') || !window.gsap || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);
  root.classList.add('motion-live');
  var ease = 'power3.out';

  var reveals = gsap.utils.toArray('[data-reveal]');
  gsap.set(reveals, { opacity: 0, y: 30 });

  // Hero first, in order; everything else as it scrolls into view.
  var heroItems = gsap.utils.toArray('.hero [data-reveal]');
  gsap.to(heroItems, { opacity: 1, y: 0, duration: 0.9, ease: ease, stagger: 0.09, delay: 0.1 });
  window.ScrollTrigger.batch(reveals.filter(function (el) { return heroItems.indexOf(el) === -1; }), {
    start: 'top bottom',
    once: true,
    onEnter: function (batch) {
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: ease, stagger: 0.08, overwrite: true });
    },
  });

  // Numbers count up from zero the first time they are seen.
  gsap.utils.toArray('[data-count]').forEach(function (el) {
    var target = Number(el.getAttribute('data-count'));
    var state = { value: 0 };
    el.textContent = '0';
    window.ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      once: true,
      onEnter: function () {
        gsap.to(state, {
          value: target,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: function () { el.textContent = String(Math.round(state.value)); },
        });
      },
    });
  });

  // The learning loop lights up one step at a time while it is on screen.
  var steps = gsap.utils.toArray('[data-step]');
  if (steps.length) {
    var cycle = gsap.timeline({ repeat: -1, paused: true });
    steps.forEach(function (step) {
      cycle.call(function () {
        steps.forEach(function (other) { other.classList.toggle('is-active', other === step); });
      });
      cycle.to({}, { duration: 1.2 });
    });
    window.ScrollTrigger.create({
      trigger: steps[0].parentElement,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: function (self) { if (self.isActive) cycle.play(); else cycle.pause(); },
    });
  }

  // A soft blue glow behind the app window follows the cursor.
  var frame = document.querySelector('[data-glow]');
  if (frame && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var hero = frame.closest('.hero');
    hero.addEventListener('pointermove', function (event) {
      var box = frame.getBoundingClientRect();
      frame.style.setProperty('--gx', (event.clientX - box.left + 40) + 'px');
      frame.style.setProperty('--gy', (event.clientY - box.top + 40) + 'px');
    });
  }
})();
