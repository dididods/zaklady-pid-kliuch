(function () {
  var root = document.documentElement;
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!window.gsap;

  /* =========================================================
     0. Інтро: ключ входить у замок, провертається, двері
        відчиняються, і ми «заходимо» в арку
     ========================================================= */
  var tl = null;

  function finishIntro() {
    try { sessionStorage.setItem('introSeen', '1'); } catch (e) {}
    root.classList.add('no-intro');
  }

  // уся анімація ~1,5 с: ключ → поворот → двері → крок в арку
  function playIntro() {
    if (!hasGsap) return finishIntro();
    window.__introStarted = true;
    root.classList.remove('no-intro');
    window.scrollTo(0, 0);
    if (tl) tl.kill();

    gsap.set('.intro', { opacity: 1, scale: 1 });
    gsap.set('.leaf', { rotationY: 0 });
    gsap.set('.lock', { opacity: 1 });
    gsap.set('.portal__seam', { opacity: .5 });
    gsap.set('.lock__flash', { opacity: 0, scale: .4 });
    // точка обертання — замкова щілина (25px, 47px у координатах ключа після входу)
    gsap.set('.key', {
      x: 140, y: -170, scale: 1.8, rotate: -35, opacity: 0,
      transformOrigin: '25px 47px',
      clipPath: 'inset(0px 0px 15px 0px)'
    });

    tl = gsap.timeline({ onComplete: function () { window.scrollTo(0, 0); finishIntro(); } });
    tl.to('.key', { opacity: 1, duration: .2 })
      // ключ підлітає до замка
      .to('.key', { x: 0, y: 0, scale: 1, rotate: 0, duration: .4, ease: 'power3.out' }, '<')
      // входить у щілину: стрижень ховається в замку, а не зникає
      .to('.key', { y: 88, clipPath: 'inset(0px 0px 103px 0px)', duration: .2, ease: 'power2.in' }, '+=.02')
      // поворот і клацання
      .to('.key', { rotate: 90, duration: .22, ease: 'back.out(2)' }, '+=.03')
      .to('.lock__flash', { opacity: 1, scale: 1.4, duration: .1, yoyo: true, repeat: 1 }, '-=.1')
      .to('.portal__seam', { opacity: 1, duration: .15 }, '<')
      // двері відчиняються
      .to('.lock', { opacity: 0, duration: .15 }, '+=.04')
      .to('.leaf--left', { rotationY: 102, duration: .5, ease: 'power3.inOut' }, '<')
      .to('.leaf--right', { rotationY: -102, duration: .5, ease: 'power3.inOut' }, '<')
      .to('.portal__seam', { opacity: 0, duration: .2 }, '<')
      // крок крізь арку
      .to('.intro', { scale: 3.4, opacity: 0, duration: .4, ease: 'power2.in' }, '-=.28')
      .from('.hero__head, .stage, .hero__bottom', { scale: 1.1, duration: .45, ease: 'power2.out', clearProps: 'transform' }, '<');

    window.introTimeline = tl; // для налагодження в консолі
  }

  function skipIntro() { if (tl) tl.progress(1); else finishIntro(); }

  if (!root.classList.contains('no-intro')) playIntro(); else finishIntro();

  document.querySelector('.intro__skip').addEventListener('click', skipIntro);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !root.classList.contains('no-intro')) skipIntro();
  });

  /* =========================================================
     1. Орбіта закладів навколо логотипа
     ========================================================= */
  var stage = document.querySelector('.stage');
  var hero = document.querySelector('.hero');
  var items = Array.prototype.slice.call(stage.querySelectorAll('.orbit__item'));
  var focusCard = stage.querySelector('.focus');
  var n = items.length;
  var step = Math.PI * 2 / n;

  var AUTO = calm ? 0 : -0.0022;   // базова швидкість, радіан за кадр
  var s = {
    angle: 0,
    vel: AUTO,
    tilt: 1, tiltTarget: 1,          // нахил орбіти від положення миші
    px: 0, pxTarget: 0,              // паралакс по горизонталі
    focus: 0,                        // 0..1 — наскільки «виїхав» вибраний заклад
    focused: -1,
    hovering: false
  };

  var lastFilter = [];

  function layout() {
    var w = stage.clientWidth;
    var h = stage.clientHeight;
    var mobile = w < 600;
    var rx = w * (mobile ? 0.45 : 0.4 + 0.08 * s.focus);
    var ry = h * (mobile ? 0.3 : 0.2) * s.tilt;

    items.forEach(function (el, i) {
      var a = s.angle + i * step;
      var z = Math.cos(a);                 // 1 спереду, -1 позаду
      var t = (z + 1) / 2;
      var x = Math.sin(a) * rx + s.px * (0.4 + t);
      var y = z * ry;
      var sc = (mobile ? 0.42 : 0.44) + (mobile ? 0.58 : 0.48) * Math.pow(t, 1.3);
      var bright = 0.5 + 0.5 * t;
      var op = 0.5 + 0.5 * t;
      var zi = z > 0 ? 60 + Math.round(t * 100) : Math.round(t * 40);
      var f = s.focus;

      if (i === s.focused) {
        // вибраний заклад виїжджає вперед і збільшується;
        // на телефоні — вгору, щоб під ним помістилася картка
        var fx = mobile ? 0 : -w * 0.08;
        var fy = mobile ? -h * 0.18 : h * 0.06;
        var fs = mobile ? 2.2 : 1.55;
        x = x * (1 - f) + fx * f;
        y = y * (1 - f) + fy * f;
        sc = sc * (1 - f) + fs * f;
        bright = bright * (1 - f) + f;
        op = op * (1 - f) + f;
        zi = 400;
      } else if (s.focused > -1) {
        bright *= 1 - 0.45 * f;
        op *= 1 - (mobile ? 0.8 : 0.4) * f;
      }

      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
      el.style.zIndex = String(zi);
      el.style.opacity = op.toFixed(2);
      // фільтр перемальовує картинку, тому міняємо його сходинками, а не щокадру
      var fl = 'brightness(' + (Math.round(bright * 20) / 20).toFixed(2) + ')';
      if (lastFilter[i] !== fl) { el.style.filter = fl; lastFilter[i] = fl; }
      el.firstElementChild.tabIndex = t > 0.6 || i === s.focused ? 0 : -1;
    });
  }

  function tick() {
    if (!dragging && s.focused < 0) {
      // інерція після перетягування плавно повертається до базової швидкості
      var target = s.hovering ? 0 : AUTO;
      s.vel += (target - s.vel) * 0.04;
      s.angle += s.vel;
    }
    s.tilt += (s.tiltTarget - s.tilt) * 0.06;
    s.px += (s.pxTarget - s.px) * 0.06;
    layout();
    requestAnimationFrame(tick);
  }

  /* --- нахил і паралакс від миші --- */
  if (!calm) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5;
      var ny = (e.clientY - r.top) / r.height - 0.5;
      s.tiltTarget = 1 + ny * 0.9;
      s.pxTarget = nx * -40;
    });
    hero.addEventListener('mouseleave', function () { s.tiltTarget = 1; s.pxTarget = 0; });
  }

  /* --- перетягування з інерцією --- */
  var dragging = false, moved = 0, lastX = 0, lastT = 0;

  stage.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.focus') || s.focused > -1) return;
    dragging = true; moved = 0; lastX = e.clientX; lastT = performance.now();
    stage.classList.add('is-dragging');
  });
  window.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX;
    var now = performance.now();
    var k = (Math.PI * 2) / (stage.clientWidth * 1.3);
    s.angle += dx * k;
    s.vel = (dx * k) / Math.max(1, (now - lastT) / 16.7);
    moved += Math.abs(dx);
    lastX = e.clientX; lastT = now;
  });
  window.addEventListener('pointerup', function () {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
    s.vel = Math.max(-0.08, Math.min(0.08, s.vel));
  });

  /* --- наведення: орбіта пригальмовує --- */
  // тільки для миші: на сенсорних екранах «наведення» залипає після дотику
  if (matchMedia('(hover: hover)').matches) {
    items.forEach(function (el) {
      el.addEventListener('mouseenter', function () { s.hovering = true; });
      el.addEventListener('mouseleave', function () { s.hovering = false; });
    });
  }

  /* --- фокус: заклад виїжджає вперед і оживає --- */
  function openFocus(i) {
    var el = items[i];
    var target = -i * step;
    var diff = Math.atan2(Math.sin(target - s.angle), Math.cos(target - s.angle));
    s.focused = i;
    s.vel = 0;
    stage.classList.add('has-focus');
    el.classList.add('is-focused');

    focusCard.querySelector('.focus__name').textContent = el.dataset.name;
    focusCard.querySelector('.focus__desc').textContent = el.dataset.desc || '';
    focusCard.querySelector('.focus__cta').dataset.format = el.dataset.name;

    // місце під майбутнє відео з живими персонажами: data-video="img/zaklady/xxx.webm"
    if (el.dataset.video && !el.querySelector('video')) {
      var v = document.createElement('video');
      v.src = el.dataset.video; v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
      v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain';
      el.querySelector('button').appendChild(v);
    }

    var tw = { a: s.angle };
    if (hasGsap) {
      gsap.to(tw, { a: s.angle + diff, duration: .7, ease: 'power3.out', onUpdate: function () { s.angle = tw.a; } });
      gsap.to(s, { focus: 1, duration: .8, delay: .25, ease: 'power3.out' });
      focusCard.hidden = false;
      gsap.fromTo(focusCard, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .5, delay: .5, ease: 'power2.out' });
    } else {
      s.angle += diff; s.focus = 1; focusCard.hidden = false;
    }
    focusCard.querySelector('.focus__cta').focus({ preventScroll: true });
  }

  function closeFocus() {
    if (s.focused < 0) return;
    var el = items[s.focused];
    el.classList.remove('is-focused');
    stage.classList.remove('has-focus');
    var done = function () { s.focused = -1; };
    if (hasGsap) {
      gsap.to(focusCard, { opacity: 0, duration: .2, onComplete: function () { focusCard.hidden = true; } });
      gsap.to(s, { focus: 0, duration: .6, ease: 'power3.inOut', onComplete: done });
    } else { focusCard.hidden = true; s.focus = 0; done(); }
  }

  items.forEach(function (el, i) {
    el.querySelector('button').addEventListener('click', function () {
      if (moved > 6) return;            // це було перетягування, а не клік
      if (s.focused === i) return;
      if (s.focused > -1) { closeFocus(); return; }
      openFocus(i);
    });
  });
  focusCard.querySelector('.focus__close').addEventListener('click', closeFocus);
  stage.addEventListener('click', function (e) {
    if (s.focused > -1 && !e.target.closest('.focus') && !e.target.closest('.is-focused')) closeFocus();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('no-intro')) closeFocus();
  });

  window.addEventListener('resize', layout);
  tick();

  var hasST = hasGsap && !!window.ScrollTrigger && !calm;
  if (hasST) {
    gsap.registerPlugin(ScrollTrigger);
    // картинки підвантажуються ліниво і зсувають блоки — перераховуємо тригери
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* =========================================================
     3. Франшиза чи свій заклад: повертаєте ключ
     ========================================================= */
  var vs = document.querySelector('.vs');
  if (vs) {
    var vsSwitch = vs.querySelector('.vs__switch');
    var vsHint = vs.querySelector('.vs__hint');
    var touched = false;

    var setMode = function (own) {
      vs.dataset.mode = own ? 'own' : 'franchise';
      vsSwitch.setAttribute('aria-checked', String(own));
      vsHint.textContent = own ? 'Поверніть назад, щоб порівняти' : 'Поверніть ключ і подивіться різницю';
    };

    vsSwitch.addEventListener('click', function () {
      touched = true;
      setMode(vs.dataset.mode !== 'own');
    });

    // якщо людина сама не натиснула — ключ провертається, щойно блок на екрані
    if (hasST) {
      ScrollTrigger.create({
        trigger: vs,
        start: 'top 55%',
        once: true,
        onEnter: function () {
          setTimeout(function () { if (!touched) setMode(true); }, 700);
        }
      });
    }
  }

  /* =========================================================
     4. Що ми беремо на себе: закріплена сцена «будмайданчик».
        Скрол перемикає 6 етапів, кожен перехід має свій ефект.
     ========================================================= */
  var bs = document.querySelector('.bs');
  // окрема область видимості: імена змінних сцени не перетинаються з квізом та іскрами
  if (bs) (function () {
    var bsFrames = Array.prototype.slice.call(bs.querySelectorAll('.bs__frame'));
    var bsSteps = Array.prototype.slice.call(bs.querySelectorAll('.bs__step'));
    var bsDots = Array.prototype.slice.call(bs.querySelectorAll('.bs__dot'));
    var bsFill = bs.querySelector('.bs__fill');
    var bsKey = bs.querySelector('.bs__key');
    var bsBlue = bs.querySelector('.bs__blueprint');
    var N = bsFrames.length;
    var cur = -1;
    var introDone = false;
    var bsST = null;

    /* --- частинки: пил, фарба, іскри, пара, вогники, конфеті --- */
    var fxCanvas = bs.querySelector('.bs__fx');
    var fctx = fxCanvas.getContext('2d');
    var fdpr = Math.min(window.devicePixelRatio || 1, 2);
    var FW = 0, FH = 0, parts = [], fxRunning = false;
    var softDot = (function () {
      var c = document.createElement('canvas'); c.width = c.height = 64;
      var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
    })();
    var fxResize = function () {
      FW = fxCanvas.clientWidth; FH = fxCanvas.clientHeight;
      fxCanvas.width = FW * fdpr; fxCanvas.height = FH * fdpr;
      fctx.setTransform(fdpr, 0, 0, fdpr, 0, 0);
    };
    // координати в частках сцени (0..1) → пікселі полотна (полотно ширше сцени на 12% з кожного боку)
    var cx = function (f) { return (f + 0.12) / 1.24 * FW; };
    var cy = function (f) { return (f + 0.12) / 1.24 * FH; };
    var rnd = function (a, b) { return a + Math.random() * (b - a); };

    var emit = function (kind, n, ox, oy, spread) {
      for (var k = 0; k < n; k++) {
        var p = { kind: kind, life: 0, x: cx(ox + rnd(-spread, spread)), y: cy(oy + rnd(-spread / 2, spread / 2)), rot: rnd(0, 6.28) };
        var s = FW / 600;
        if (kind === 'dust') { p.vx = rnd(-1.5, 1.5) * s; p.vy = rnd(-1.2, .2) * s; p.r = rnd(10, 26) * s; p.max = rnd(50, 90); p.c = '200,170,130'; }
        if (kind === 'paint') { var a = rnd(0, 6.28), v = rnd(4, 10) * s; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v - 3 * s; p.r = rnd(3, 9) * s; p.max = rnd(40, 70); p.c = ['227,38,28', '255,180,0', '47,90,70', '242,230,208'][k % 4]; }
        if (kind === 'spark') { var a2 = rnd(-2.8, -.3), v2 = rnd(6, 14) * s; p.vx = Math.cos(a2) * v2; p.vy = Math.sin(a2) * v2; p.r = rnd(2, 3.6) * s; p.max = rnd(22, 40); p.c = '255,220,120'; }
        if (kind === 'steam') { p.vx = rnd(-.4, .4) * s; p.vy = rnd(-1.6, -.7) * s; p.r = rnd(18, 34) * s; p.max = rnd(70, 110); p.c = '255,255,255'; }
        if (kind === 'ember') { p.vx = rnd(-2, 2) * s; p.vy = rnd(-5, -1.5) * s; p.r = rnd(5, 12) * s; p.max = rnd(50, 90); p.c = '255,170,50'; }
        if (kind === 'confetti') { var a3 = rnd(-2.6, -.5), v3 = rnd(5, 11) * s; p.vx = Math.cos(a3) * v3; p.vy = Math.sin(a3) * v3; p.r = rnd(4, 7) * s; p.max = rnd(70, 110); p.vr = rnd(-.3, .3); p.c = ['227,38,28', '255,180,0', '255,241,220', '240,120,60'][k % 4]; }
        parts.push(p);
      }
      if (!fxRunning) { fxRunning = true; requestAnimationFrame(fxTick); }
    };

    var fxTick = function () {
      fctx.clearRect(0, 0, FW, FH);
      parts = parts.filter(function (p) { return p.life < p.max; });
      parts.forEach(function (p) {
        p.life++;
        var t = p.life / p.max, a = 1 - t;
        p.x += p.vx; p.y += p.vy;
        if (p.kind === 'paint' || p.kind === 'spark' || p.kind === 'confetti') p.vy += FW / 600 * .32;
        if (p.kind === 'confetti') { p.vx *= .98; p.rot += p.vr; }
        if (p.kind === 'dust' || p.kind === 'steam') { p.r *= 1.012; }
        fctx.globalCompositeOperation = (p.kind === 'spark' || p.kind === 'ember') ? 'lighter' : 'source-over';
        if (p.kind === 'dust' || p.kind === 'steam' || p.kind === 'ember') {
          fctx.globalAlpha = a * (p.kind === 'steam' ? .35 : p.kind === 'dust' ? .4 : .9);
          // м'яка пляма потрібного кольору: тонуємо білу пляму через фільтр не можна, тож малюємо коло з градієнтом
          if (p.kind === 'steam') { fctx.drawImage(softDot, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }
          else {
            var g = fctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            g.addColorStop(0, 'rgba(' + p.c + ',1)'); g.addColorStop(1, 'rgba(' + p.c + ',0)');
            fctx.fillStyle = g; fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 6.28); fctx.fill();
          }
        } else if (p.kind === 'spark') {
          fctx.globalAlpha = a;
          fctx.strokeStyle = 'rgba(' + p.c + ',1)'; fctx.lineWidth = p.r; fctx.lineCap = 'round';
          fctx.beginPath(); fctx.moveTo(p.x, p.y); fctx.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2); fctx.stroke();
        } else if (p.kind === 'confetti') {
          fctx.globalAlpha = Math.min(1, a * 1.5);
          fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot);
          fctx.fillStyle = 'rgb(' + p.c + ')'; fctx.fillRect(-p.r, -p.r / 2.5, p.r * 2, p.r / 1.25);
          fctx.restore();
        } else { // фарба: крапля, що трохи витягується в польоті
          fctx.globalAlpha = Math.min(1, a * 1.6);
          fctx.fillStyle = 'rgb(' + p.c + ')';
          fctx.beginPath(); fctx.ellipse(p.x, p.y, p.r, p.r * (1 + Math.min(1.2, Math.abs(p.vy) / 12)), Math.atan2(p.vy, p.vx) + 1.57, 0, 6.28); fctx.fill();
        }
      });
      fctx.globalAlpha = 1;
      if (parts.length) requestAnimationFrame(fxTick); else { fxRunning = false; fctx.clearRect(0, 0, FW, FH); }
    };

    /* --- інтерфейс: номер етапу, точки, ключ на шкалі --- */
    var placeKey = function (i) {
      var d = bsDots[i];
      bsKey.style.left = (d.offsetLeft + d.offsetWidth / 2) + 'px';
    };
    var setUI = function (i) {
      bs.dataset.step = String(i);
      bsSteps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      bsDots.forEach(function (d, k) {
        d.classList.toggle('is-on', k === i);
        d.classList.toggle('is-passed', k < i);
        d.setAttribute('aria-selected', String(k === i));
      });
      bsFill.style.width = (i / (N - 1) * 100) + '%';
      placeKey(i);
    };

    /* --- переходи між кадрами --- */
    var setMask = function (el, m) { el.style.webkitMaskImage = m; el.style.maskImage = m; };
    var settle = function (i) {
      // після переходу: видно тільки поточний кадр, маски прибрані
      bsFrames.forEach(function (f, k) {
        setMask(f, '');
        f.style.zIndex = '';
        f.style.filter = '';
        f.style.opacity = k === i ? '1' : '0';
      });
    };

    // кадр розкривається маскою: maskFn(p) повертає CSS-маску для прогресу p ∈ [0..1]
    var reveal = function (i, maskFn, dur, onMid) {
      var fr = bsFrames[i];
      gsap.killTweensOf(bsFrames);
      fr.style.zIndex = '2';
      fr.style.opacity = '1';
      var o = { p: 0 };
      setMask(fr, maskFn(0));
      gsap.to(o, {
        p: 1, duration: dur, ease: 'power2.inOut',
        onUpdate: function () { setMask(fr, maskFn(o.p)); },
        onComplete: function () { if (cur === i) settle(i); }
      });
      if (onMid) gsap.delayedCall(dur * .35, onMid);
    };

    var crossfade = function (i, dur) {
      gsap.killTweensOf(bsFrames);
      bsFrames.forEach(function (f, k) {
        setMask(f, ''); f.style.zIndex = k === i ? '2' : '';
        gsap.to(f, { opacity: k === i ? 1 : 0, duration: dur, ease: 'power1.out' });
      });
    };

    var effects = {
      // 1. Приміщення: креслення малюється, будівля проявляється з нього, здіймається пил
      blueprint: function (i) {
        var paths = bsBlue.querySelectorAll('path');
        var fr = bsFrames[i];
        gsap.killTweensOf(bsFrames);
        settle(-1);
        introTl = gsap.timeline({ onComplete: function () { if (cur === i) settle(i); } })
          .set(bsBlue, { opacity: 1 })
          .fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', stagger: .1 })
          .set(fr, { opacity: 0, filter: 'grayscale(1) sepia(1) hue-rotate(175deg) saturate(2.5) brightness(1.4)' })
          .call(function () { emit('dust', 26, .5, .85, .4); })
          .to(fr, { opacity: 1, duration: .6 })
          .to(fr, { filter: 'grayscale(0) sepia(0) hue-rotate(0deg) saturate(1) brightness(1)', duration: .8 })
          .to(bsBlue, { opacity: 0, duration: .6 }, '<');
      },
      // 2. Концепція і дизайн: бризки фарби, новий стан розливається плямою
      paint: function (i) {
        emit('paint', 46, .5, .5, .12);
        reveal(i, function (p) {
          var r = p * 95;
          return 'radial-gradient(circle at 50% 52%, #000 ' + r + '%, transparent ' + (r + 9) + '%)';
        }, 1.1, function () { emit('paint', 22, rnd(.3, .7), rnd(.35, .6), .1); });
      },
      // 3. Обладнання: іскри, новий шар піднімається знизу
      sparks: function (i) {
        emit('spark', 70, .5, .78, .3);
        reveal(i, function (p) {
          var h = p * 112;
          return 'linear-gradient(to top, #000 ' + (h - 10) + '%, transparent ' + h + '%)';
        }, 1, function () { emit('spark', 50, .5, .55, .3); });
      },
      // 4. Кухня і меню: пара, крізь яку проявляється новий стан
      steam: function (i) {
        emit('steam', 22, .45, .7, .25);
        reveal(i, function (p) {
          var r = p * 120;
          return 'radial-gradient(ellipse 70% 60% at 45% 75%, #000 ' + r + '%, transparent ' + (r + 25) + '%)';
        }, 1.3, function () { emit('steam', 14, .5, .5, .3); });
      },
      // 5. Команда: у вікнах спалахує тепле світло
      glow: function (i) {
        var fr = bsFrames[i];
        crossfade(i, .5);
        gsap.fromTo(fr, { filter: 'brightness(1.9) saturate(1.3)' }, { filter: 'brightness(1) saturate(1)', duration: 1.1, ease: 'power2.out' });
        emit('ember', 18, .5, .6, .3);
      },
      // 6. Запуск: вивіска загоряється, вибух вогників і конфеті
      launch: function (i) {
        var fr = bsFrames[i];
        crossfade(i, .45);
        gsap.fromTo(fr, { filter: 'brightness(2.2)', scale: .97 }, { filter: 'brightness(1)', scale: 1, duration: 1, ease: 'power2.out', clearProps: 'scale' });
        emit('ember', 34, .5, .4, .35);
        gsap.delayedCall(.25, function () { emit('confetti', 70, .5, .45, .2); });
      }
    };

    // відео-перехід з папки (data-video на кадрі); якщо не вийшло — ефект кодом
    var playVideo = function (i) {
      var fr = bsFrames[i];
      var v = document.createElement('video');
      v.src = fr.dataset.video; v.muted = true; v.playsInline = true;
      v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:5';
      fr.parentNode.appendChild(v);
      var done = function () { v.remove(); if (cur === i) settle(i); };
      v.addEventListener('ended', done);
      v.addEventListener('error', function () { v.remove(); (effects[fr.dataset.fx] || crossfade)(i, .5); });
      v.play().catch(function () { v.remove(); (effects[fr.dataset.fx] || crossfade)(i, .5); });
    };

    var introTl = null;
    var show = function (i) {
      if (i === cur) return;
      // якщо креслення ще домальовується, а людина вже далі — обриваємо його
      if (introTl && i !== 0) { introTl.kill(); introTl = null; gsap.set(bsBlue, { opacity: 0 }); }
      var prev = cur;
      cur = i;
      setUI(i);
      var forward = i === prev + 1;
      if (i === 0 && !introDone) { introDone = true; effects.blueprint(0); return; }
      if (!forward) { crossfade(i, .35); return; }   // назад або стрибок — швидка зміна кадру
      var fr = bsFrames[i];
      if (fr.dataset.video) playVideo(i);
      else (effects[fr.dataset.fx] || crossfade)(i, .5);
    };

    if (hasST) {
      fxResize();
      // кадр 1 спершу прихований: він «проявиться» з креслення
      bsFrames.forEach(function (f) { f.classList.remove('is-on'); f.style.opacity = '0'; });
      bsBlue.querySelectorAll('path').forEach(function (p) {
        p.setAttribute('pathLength', '1');
        p.style.strokeDasharray = '1';
        p.style.strokeDashoffset = '1';
      });
      gsap.set(bsBlue, { opacity: .5 });
      setUI(0);

      bsST = ScrollTrigger.create({
        trigger: bs,
        start: 'center center',
        end: function () { return '+=' + Math.round(window.innerHeight * .7 * N); },
        pin: true,
        anticipatePin: 1,
        onUpdate: function (self) {
          show(Math.min(N - 1, Math.floor(self.progress * N * .999)));
        },
        onEnter: function () { if (cur < 0) show(0); }
      });

      // клік по точці — прокрутити до відповідного етапу
      bsDots.forEach(function (d, k) {
        d.addEventListener('click', function () {
          var y = bsST.start + (k + .5) / N * (bsST.end - bsST.start);
          window.scrollTo({ top: y, behavior: 'smooth' });
        });
      });
      window.addEventListener('resize', function () { fxResize(); if (cur >= 0) placeKey(cur); });
    } else {
      bs.classList.add('bs--static');
    }
  })();

  /* Підкреслення в підзаголовку «Вартість» малюється, коли він з'являється */
  var priceLead = document.querySelector('.price__lead');
  if (priceLead) {
    if ('IntersectionObserver' in window && !calm) {
      var plIO = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { priceLead.classList.add('is-drawn'); plIO.disconnect(); }
      }, { threshold: 1 });
      plIO.observe(priceLead);
    } else priceLead.classList.add('is-drawn');
  }

  /* Таблички на телефоні гойдаються, коли з'являються на екрані */
  if ('IntersectionObserver' in window && matchMedia('(max-width: 900px)').matches) {
    var signIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-swing'); signIO.unobserve(e.target); }
      });
    }, { threshold: .35 });
    document.querySelectorAll('.sign').forEach(function (el) { signIO.observe(el); });
  }

  /* =========================================================
     4. Етапи: ключ їде по лінії шляху
     ========================================================= */
  var stepsWrap = document.querySelector('.steps-wrap');
  if (stepsWrap) {
    var rail = stepsWrap.querySelector('.steps__rail');
    var fill = stepsWrap.querySelector('.steps__fill');
    var skey = stepsWrap.querySelector('.steps__key');
    var stepItems = Array.prototype.slice.call(stepsWrap.querySelectorAll('.steps li'));

    var CIRCLE_TOP = 14, CIRCLE = 42;   // кружечок кроку: відступ зверху і розмір (як у CSS)
    var moveKey = function (p) {
      var h = rail.offsetHeight;
      var y = h * p;
      var railTop = rail.offsetTop;
      fill.style.height = y + 'px';
      var passed = 0;
      stepItems.forEach(function (li) {
        // центр кружечка кроку відносно початку лінії
        var c = li.offsetTop + CIRCLE_TOP + CIRCLE / 2 - railTop;
        var on = c <= y + 2;
        li.classList.toggle('is-passed', on);
        if (on) passed++;
      });
      // ключ стоїть на відрізку лінії між останнім пройденим і наступним кружечком,
      // а кінчиком «входить» у наступний — цифри не перекриває
      var k = Math.min(Math.max(passed, 1), stepItems.length - 1);
      // плашка підсвічує крок, біля якого зараз стоїть ключ
      stepItems.forEach(function (li, i) { li.classList.toggle('is-current', i === k - 1); });
      var from = stepItems[k - 1].offsetTop + CIRCLE_TOP + CIRCLE + 3 - railTop;
      var to = stepItems[k].offsetTop + CIRCLE_TOP - railTop;
      var len = Math.max(24, (to - from) / 0.9);   // кінчик стрижня — на 90% висоти малюнка
      skey.style.top = from.toFixed(1) + 'px';
      skey.style.height = len.toFixed(1) + 'px';
      skey.style.width = (len / 3).toFixed(1) + 'px';
      skey.style.marginLeft = (-len / 6).toFixed(1) + 'px';
    };

    if (hasST) {
      ScrollTrigger.create({
        trigger: stepsWrap,
        start: 'top 55%',
        end: 'bottom 55%',
        scrub: 0.6,
        onUpdate: function (self) { moveKey(self.progress); }
      });
      moveKey(0);
    } else {
      moveKey(1);
    }
  }

  /* =========================================================
     4. Етапи: перемикач «є приміщення / немає»
     ========================================================= */
  var switchBtns = document.querySelectorAll('.switch__btn');
  switchBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var mode = b.dataset.premises;
      switchBtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      document.querySelectorAll('.steps__fork [data-yes]').forEach(function (el) {
        el.textContent = el.dataset[mode];
      });
    });
  });

  /* =========================================================
     5. Калькулятор: площа → ціна пакета + чекліст «Що входить».
        Усе відмічено: ключ у замку, ціна пакета. Зняли пункт:
        ключ виходить, окремі послуги шеф рахує після розмови
     ========================================================= */
  var calc = document.querySelector('.calc');
  var range = document.getElementById('area');
  var svcCalc = calc ? Array.prototype.slice.call(calc.querySelectorAll('input[name="svc"]')) : [];
  var quizApi = null;           // з'явиться нижче, коли квіз готовий
  var updateCalc = function () {};
  // підсумок калькулятора для коментаря в квізі: тільки відмічені послуги
  var svcLabel = function (c) { return c.closest('label').textContent.trim(); };
  var calcText = function () {
    if (!range) return '';
    var v = +range.value;
    var price = [[20, 2800], [40, 3300], [60, 3600], [80, 4800]].filter(function (p) { return v <= p[0]; })[0];
    var on = svcCalc.filter(function (c) { return c.checked; });
    var off = svcCalc.filter(function (c) { return !c.checked; });
    var svc = !on.length ? 'послуги ще не обрані'
      : !off.length ? 'усе під ключ' + (price ? ' (пакет ' + price[1].toLocaleString('uk-UA').replace(/\s/g, ' ') + ' у.о.)' : '')
      : off.length <= svcCalc.length / 2 ? 'під ключ, крім: ' + off.map(svcLabel).join(', ')
      : 'окремі послуги: ' + on.map(svcLabel).join(', ');
    return 'З калькулятора: площа ' + (v > 80 ? 'понад 80' : v) + ' м², ' + svc + '.';
  };
  var areaTier = function (v) {
    return v <= 20 ? 'до 20 м²' : v <= 40 ? '20-40 м²' : v <= 60 ? '40-60 м²' : v <= 80 ? '60-80 м²' : 'понад 80 м²';
  };
  // одна послуга = дві галочки (калькулятор і квіз), тримаємо їх однаковими
  var setSvc = function (value, on) {
    svcCalc.forEach(function (c) {
      if (c.value === value) c.checked = on;
    });
  };
  var svcOn = function (value) {
    return svcCalc.some(function (c) { return c.value === value && c.checked; });
  };

  if (range && calc) {
    var out = document.getElementById('area-out');
    var sum = calc.querySelector('.calc__sum');
    var curEl = calc.querySelector('.calc__cur');
    var fullBox = calc.querySelector('.calc__full');
    var partBox = calc.querySelector('.calc__partial');
    var pkg = calc.querySelector('.calc__pkg');
    var pkgSum = calc.querySelector('.calc__pkg-sum');
    var lockFlash = calc.querySelector('.calc__lock .done-key__flash');
    var pickArea = calc.querySelector('.calc__pick-area');
    var pickSvc = calc.querySelector('.calc__pick-svc');
    var tiers = Array.prototype.slice.call(calc.querySelectorAll('.calc__tiers li'));
    var prices = [[20, 2800], [40, 3300], [60, 3600], [80, 4800]];
    var shown = { v: 3300 };
    var wasPartial = false;
    var fmt = function (n) { return Math.round(n).toLocaleString('uk-UA').replace(/ |,/g, ' '); };

    updateCalc = function () {
      var v = +range.value;
      var hit = prices.filter(function (p) { return v <= p[0]; })[0];
      out.textContent = (v > 80 ? 'понад 80' : v) + ' м²';
      curEl.hidden = !hit;
      sum.classList.toggle('is-custom', !hit);
      // заповнення доріжки повзунка
      range.style.setProperty('--fill', ((v - range.min) / (range.max - range.min) * 100).toFixed(1) + '%');
      if (!hit) {
        if (hasGsap) gsap.killTweensOf(shown);
        sum.textContent = 'Індивідуально';
      } else if (hasGsap && !calm) {
        // ціна «прокручується», як на табло
        gsap.to(shown, { v: hit[1], duration: .5, ease: 'power2.out', onUpdate: function () { sum.textContent = fmt(shown.v); } });
      } else {
        sum.textContent = fmt(hit[1]);
      }
      var active = tiers.filter(function (li) { return v <= +li.dataset.max; })[0];
      tiers.forEach(function (li) { li.classList.toggle('is-active', li === active); });

      // рядок над кнопкою: що саме піде в заявку
      var nOn = svcCalc.filter(function (c) { return c.checked; }).length;
      pickArea.textContent = (v > 80 ? 'понад 80' : v) + ' м²';
      pickSvc.textContent = nOn === svcCalc.length ? 'усе під ключ' : nOn + ' з ' + svcCalc.length + ' послуг';
      // пакет чи окремі послуги
      var partial = svcCalc.some(function (c) { return !c.checked; });
      calc.classList.toggle('is-partial', partial);
      fullBox.hidden = partial;
      partBox.hidden = !partial;
      pkg.hidden = !hit;
      if (hit) pkgSum.textContent = fmt(hit[1]) + ' у.о.';
      // ключ знову в замку: коротке клацання-спалах
      if (wasPartial && !partial && hasGsap && !calm) {
        gsap.fromTo(lockFlash, { opacity: 0, scale: .4 }, { opacity: 1, scale: 1.3, duration: .18, delay: .3, yoyo: true, repeat: 1 });
      }
      wasPartial = partial;
    };

    // площу, яку людина виставила сама, переносимо в квіз
    var calcAreaToQuiz = function () {
      if (quizApi) { quizApi.answer('area', areaTier(+range.value)); quizApi.calcChanged(); }
    };
    range.addEventListener('input', function () { updateCalc(); calcAreaToQuiz(); });

    svcCalc.forEach(function (c) {
      c.addEventListener('change', function () {
        setSvc(c.value, c.checked);
        updateCalc();
        if (quizApi) quizApi.calcChanged();
      });
    });
    calc.querySelector('.calc__all').addEventListener('click', function () {
      svcCalc.forEach(function (c) { setSvc(c.value, true); });
      updateCalc();
      if (quizApi) quizApi.calcChanged();
    });
    updateCalc();

    // підказка: при першій появі повзунок сам «проїжджає», показуючи, що його можна рухати
    if (hasST) {
      ScrollTrigger.create({
        trigger: '.calc',
        start: 'top 70%',
        once: true,
        onEnter: function () {
          var o = { v: 10 };
          // якщо людина сама взялася за повзунок, підказку зупиняємо
          var stop = function () { gsap.killTweensOf(o); };
          range.addEventListener('pointerdown', stop, { once: true });
          range.addEventListener('keydown', stop, { once: true });
          gsap.to(o, {
            v: 35, duration: 1.4, ease: 'power2.inOut',
            onUpdate: function () { range.value = Math.round(o.v / 5) * 5; updateCalc(); }
          });
        }
      });
    }
  }

  /* =========================================================
     7. Квіз-заявка: без відповіді далі не можна; кроки, на які
        людина вже відповіла деінде на сайті, пропускаємо
     ========================================================= */
  var quiz = document.querySelector('.quiz');
  if (quiz) (function () {
    var steps = Array.prototype.slice.call(quiz.querySelectorAll('.quiz__step'));
    var names = steps.map(function (s) { return s.dataset.step; });
    var N = steps.length;
    var back = quiz.querySelector('.quiz__back');
    var next = quiz.querySelector('.quiz__next');
    var num = quiz.querySelector('.quiz__step-num');
    var bar = quiz.querySelector('.quiz__bar i');
    var err = quiz.querySelector('.quiz__error');
    var city = quiz.querySelector('input[name="city"]');
    var nameF = quiz.querySelector('input[name="name"]');
    var phone = quiz.querySelector('input[name="phone"]');
    var cur = 0, sent = false;
    var given = {};    // кроки, заповнені з інших блоків сайту
    var passed = {};   // кроки, які людина вже пройшла кнопкою «Далі»
    var stepOf = { format: 'format', stage: 'stage', premises: 'place', area: 'area', when: 'when', channel: 'contact' };
    quiz.querySelector('.quiz__step-total').textContent = String(N);

    // коментар: сам підхоплює вибір з калькулятора, поки людина не почала писати в ньому сама
    var comment = quiz.querySelector('textarea[name="comment"]');
    var calcUsed = false, commentOwn = false;
    var fillComment = function () { if (calcUsed && !commentOwn) comment.value = calcText(); };
    comment.addEventListener('input', function () { commentOwn = comment.value.trim() !== ''; });

    var picked = function (name) { return quiz.querySelector('input[name="' + name + '"]:checked'); };
    var val = function (name) { var r = picked(name); return r ? r.value : ''; };
    var label = function (name) { var r = picked(name); return r ? r.closest('label').textContent.trim() : ''; };
    var setRadio = function (name, value) {
      var r = quiz.querySelector('input[name="' + name + '"][value="' + value + '"]');
      if (r) r.checked = true;
      return !!r;
    };

    /* --- телефон: маска +380 XX XXX XX XX --- */
    var phoneDigits = function () {
      var d = phone.value.replace(/\D/g, '');
      if (d.indexOf('380') === 0) d = d.slice(3);
      else if (d.indexOf('80') === 0 && d.length > 9) d = d.slice(2);
      return d.replace(/^0+/, '').slice(0, 9);
    };
    var fmtPhone = function (d) {
      var s = '+380 ' + d.slice(0, 2);
      if (d.length > 2) s += ' ' + d.slice(2, 5);
      if (d.length > 5) s += ' ' + d.slice(5, 7);
      if (d.length > 7) s += ' ' + d.slice(7, 9);
      return s;
    };
    phone.addEventListener('focus', function () { if (!phone.value) phone.value = '+380 '; });
    phone.addEventListener('blur', function () { if (!phoneDigits()) phone.value = ''; });
    phone.addEventListener('input', function () { phone.value = fmtPhone(phoneDigits()); refresh(); });

    /* --- перевірка кроку --- */
    var problem = function (k) {
      switch (names[k]) {
        case 'format': return val('format') ? '' : 'Оберіть формат закладу';
        case 'stage': return val('stage') ? '' : 'Оберіть, на якому ви етапі';
        case 'place':
          if (!val('premises')) return 'Вкажіть, чи є приміщення';
          return city.value.trim().length >= 2 ? '' : 'Вкажіть місто';
        case 'area': return val('area') ? '' : 'Оберіть площу або «Ще не знаю»';
        case 'when': return val('when') ? '' : 'Оберіть, коли плануєте відкриття';
        case 'contact':
          if (nameF.value.trim().length < 2) return "Вкажіть ваше ім'я";
          if (phoneDigits().length !== 9) return 'Вкажіть номер телефону повністю';
          return val('channel') ? '' : "Оберіть, як зручніше зв'язатися";
      }
      return '';
    };
    var valid = function (k) { return !problem(k); };

    var refresh = function () {
      if (sent) return;
      var ok = valid(cur);
      next.setAttribute('aria-disabled', String(!ok));
      if (ok) err.hidden = true;
      else if (!err.hidden) err.textContent = problem(cur);
    };

    var show = function (i) {
      cur = i;
      steps.forEach(function (st, k) { st.classList.toggle('is-active', k === i); });
      back.hidden = i === 0;
      next.textContent = i === N - 1 ? 'Отримати розрахунок' : 'Далі';
      num.textContent = String(i + 1);
      bar.style.width = ((i + 1) / N * 100).toFixed(1) + '%';
      err.hidden = true;
      refresh();
    };
    // наступний крок, на який ще не відповіли деінде на сайті
    var nextOpen = function (from) {
      for (var k = from + 1; k < N - 1; k++) if (!(given[names[k]] && valid(k))) return k;
      return N - 1;
    };
    var firstOpen = function () {
      for (var k = 0; k < N - 1; k++) if (!(valid(k) && (given[names[k]] || passed[k]))) return k;
      return N - 1;
    };
    var forward = function () {
      passed[cur] = true;
      show(nextOpen(cur));
      var f = steps[cur].querySelector('input[type="text"], input[type="tel"]');
      if (f && !f.value && matchMedia('(hover: hover)').matches) f.focus({ preventScroll: true });
    };

    next.addEventListener('click', function () {
      if (!valid(cur)) { err.textContent = problem(cur); err.hidden = false; return; }
      if (cur < N - 1) forward(); else submit();
    });
    back.addEventListener('click', function () { if (cur > 0) show(cur - 1); });

    // крок з одним вибором: обрали варіант, і квіз сам іде далі
    ['format', 'stage', 'area', 'when'].forEach(function (name) {
      quiz.querySelectorAll('input[name="' + name + '"]').forEach(function (r) {
        r.addEventListener('change', function () {
          var at = cur;
          if (name === 'stage') applyStage();
          refresh();
          setTimeout(function () { if (cur === at && !sent && valid(cur) && cur < N - 1) forward(); }, 280);
        });
      });
    });
    quiz.querySelectorAll('input[name="premises"], input[name="channel"]').forEach(function (r) {
      r.addEventListener('change', refresh);
    });
    city.addEventListener('input', refresh);
    nameF.addEventListener('input', refresh);
    // Enter у текстовому полі = «Далі», а не відправка форми
    quiz.addEventListener('submit', function (e) { e.preventDefault(); });
    quiz.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.matches('input[type="text"], input[type="tel"]')) { e.preventDefault(); next.click(); }
    });

    /* --- етап проєкту знімає послуги, які вже є, і підказує приміщення --- */
    var stageDrops = { 'Концепція': ['Концепція й назва'], 'Дизайн-проєкт': ['Концепція й назва', 'Дизайн і підрядники'] };
    var autoOff = [], autoPremises = false;
    var applyStage = function () {
      var st = val('stage');
      autoOff.forEach(function (v) { setSvc(v, true); });
      autoOff = [];
      (stageDrops[st] || []).forEach(function (v) {
        if (svcOn(v)) { setSvc(v, false); autoOff.push(v); }
      });
      if (st === 'Діючий заклад') {
        if (val('premises') !== 'Є діючий заклад') { setRadio('premises', 'Є діючий заклад'); autoPremises = true; }
      } else if (autoPremises && val('premises') === 'Є діючий заклад') {
        picked('premises').checked = false; autoPremises = false;
      }
      updateCalc();
      fillComment();
    };

    /* --- фінал: підсумок «Ваш заклад», потім ключ провертається --- */
    var submit = function () {
      sent = true;
      var rows = [
        ['Формат', label('format')],
        ['Етап', label('stage')],
        ['Місто', city.value.trim()],
        ['Приміщення', label('premises')],
        ['Площа', label('area')],
        ['Відкриття', label('when')],
        ["Зв'язок", label('channel') + ', ' + phone.value],
        ['Коментар', comment.value.trim()]
      ];
      var dl = quiz.querySelector('.quiz__summary-list');
      dl.innerHTML = '';
      rows.forEach(function (r) {
        if (!r[1]) return;
        var dt = document.createElement('dt'); dt.textContent = r[0];
        var dd = document.createElement('dd'); dd.textContent = r[1];
        dl.appendChild(dt); dl.appendChild(dd);
      });
      // TODO: відправити дані (Telegram-бот / CRM): new FormData(quiz). Поки лише показуємо підтвердження
      steps.forEach(function (st) { st.classList.remove('is-active'); });
      quiz.querySelector('.quiz__nav').hidden = true;
      quiz.querySelector('.quiz__top').hidden = true;
      err.hidden = true;
      var doneBox = quiz.querySelector('.quiz__done');
      doneBox.hidden = false;
      var key = doneBox.querySelector('.done-key__key');
      if (hasGsap && !calm) {
        gsap.timeline()
          .from(doneBox.querySelector('.quiz__summary'), { opacity: 0, y: 14, duration: .45, ease: 'power2.out' })
          .from(doneBox.querySelector('.done-key'), { scale: .6, opacity: 0, duration: .35, ease: 'back.out(2)' }, '-=.1')
          .fromTo(key, { rotate: 0, scale: 1.15, transformOrigin: '30px 56.4px' }, { scale: 1, duration: .2 })
          .to(key, { rotate: 90, duration: .45, ease: 'back.out(2.4)' })
          .to(doneBox.querySelector('.done-key__flash'), { opacity: 1, scale: 1.3, duration: .18, yoyo: true, repeat: 1 }, '-=.2')
          .from(doneBox.querySelectorAll('h3, .quiz__done-row p'), { opacity: 0, y: 10, duration: .4, stagger: .08 }, '-=.1');
      } else {
        key.style.transform = 'rotate(90deg)';
      }
    };

    /* --- зв'язки з іншими блоками --- */
    quizApi = {
      // відповідь, дана деінде на сайті: крок вважаємо заповненим
      answer: function (name, value) {
        if (sent || !setRadio(name, value)) return;
        if (name === 'stage') applyStage();
        if (stepOf[name] !== 'place') given[stepOf[name]] = true;
        refresh();
      },
      give: function (step) { given[step] = true; refresh(); },
      // людина змінила площу або галочки в калькуляторі
      calcChanged: function () { calcUsed = true; fillComment(); },
      // перейти до першого питання, на яке ще немає відповіді
      jump: function () { if (!sent) show(firstOpen()); }
    };

    // «Це про мене» з табличок: етап і приміщення
    document.querySelectorAll('.sign__link').forEach(function (a) {
      a.addEventListener('click', function () {
        if (a.dataset.stage) quizApi.answer('stage', a.dataset.stage);
        if (a.dataset.premises) quizApi.answer('premises', a.dataset.premises);
        quizApi.jump();
      });
    });
    // «Хочу такий заклад» з орбіти: формат уже обраний
    document.querySelector('.focus__cta').addEventListener('click', function (e) {
      quizApi.answer('format', e.currentTarget.dataset.format);
      quizApi.jump();
      closeFocus();
    });
    // «Розрахувати мій заклад» під калькулятором
    var fromCalc = document.querySelector('[data-from-calc]');
    if (fromCalc) fromCalc.addEventListener('click', function () { quizApi.calcChanged(); quizApi.jump(); });

    show(0);
  })();

  /* =========================================================
     Іскри від вогню, що піднімаються з-під сцени
     ========================================================= */
  var canvas = document.querySelector('.embers');
  if (canvas && !calm) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var parts = [], W = 0, H = 0, visible = true;
    var COUNT = window.innerWidth < 760 ? 34 : 70;

    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(p, initial) {
      p.x = W * (0.15 + Math.random() * 0.7);
      p.y = initial ? Math.random() * H : H + 10;
      p.vy = 0.3 + Math.random() * 0.9;
      p.r = 0.6 + Math.random() * 2.2;
      p.life = 0;
      p.max = 260 + Math.random() * 320;
      p.seed = Math.random() * 1000;
      p.hue = 22 + Math.random() * 24;
      return p;
    }
    // світіння малюємо один раз у спрайт, а не розмиттям на кожному кадрі
    var sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    var sg = sprite.getContext('2d');
    var grad = sg.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,236,180,1)');
    grad.addColorStop(.25, 'rgba(255,170,50,.9)');
    grad.addColorStop(1, 'rgba(255,90,20,0)');
    sg.fillStyle = grad;
    sg.fillRect(0, 0, 32, 32);

    resize();
    for (var i = 0; i < COUNT; i++) parts.push(spawn({}, true));

    function draw() {
      if (visible) {
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        parts.forEach(function (p) {
          p.life++;
          p.y -= p.vy;
          p.x += Math.sin((p.life + p.seed) * 0.02) * 0.35;
          var k = p.life / p.max;
          var a = Math.sin(Math.PI * Math.min(k, 1)) * (0.55 + 0.45 * Math.sin(p.life * 0.3 + p.seed));
          if (k >= 1 || p.y < -10) spawn(p, false);
          var d = p.r * 5;
          ctx.globalAlpha = Math.max(0, Math.min(1, a));
          ctx.drawImage(sprite, p.x - d / 2, p.y - d / 2, d, d);
        });
      }
      requestAnimationFrame(draw);
    }
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);
    window.addEventListener('resize', resize);
    draw();
  }

  /* =========================================================
     Шапка: компактна плашка після першого екрана, бургер,
     підсвічування розділу, де ми зараз
     ========================================================= */
  (function () {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var burger = header.querySelector('.burger');
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > window.innerHeight * 0.5);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var close = function () {
      header.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    };
    burger.addEventListener('click', function () {
      var open = !header.classList.contains('is-open');
      header.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    header.querySelectorAll('.site-nav a').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('click', function (e) { if (!header.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    if ('IntersectionObserver' in window) {
      var links = {};
      header.querySelectorAll('.site-nav a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
      var navIO = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var a = links[e.target.id];
          if (a) a.classList.toggle('is-active', e.isIntersecting);
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(links).forEach(function (id) { var el = document.getElementById(id); if (el) navIO.observe(el); });
    }
  })();

  /* =========================================================
     Кнопка «наверх»: з'являється після першого екрана,
     кільце заповнюється разом з прокруткою
     ========================================================= */
  (function () {
    var btn = document.querySelector('.to-top');
    if (!btn) return;
    var ring = btn.querySelector('.to-top__ring');
    var queued = false;
    var update = function () {
      queued = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      ring.style.strokeDashoffset = (100 - p * 100).toFixed(1);
      btn.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.9);
    };
    window.addEventListener('scroll', function () {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    });
    update();
  })();
})();
