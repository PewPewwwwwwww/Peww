    // ═══════════════════════════════════════════════════
    //  PARTICLE NETWORK BACKGROUND ANIMATION
    // ════════════════════════════════════════════════
    (function () {
        const canvas = document.getElementById('bg-canvas');
        const ctx    = canvas.getContext('2d');

        // ── Config ──────────────────────────────────────
        const CONFIG = {
            particleCount : 90,
            maxDist       : 140,      // max distance to draw a line
            particleRadius: 2,
            speed         : 0.45,
            colors: {
                bg          : '#050a14',
                particle    : '#38bdf8',   // sky-400
                lineBase    : '56,189,248', // same in r,g,b for rgba
                glow        : '#0ea5e9',
            },
            mousePush     : 100,       // radius of mouse repulsion
            mousePushForce: 0.6,
        };

        let W, H, particles, mouse = { x: -999, y: -999 };

        // ── Resize ──────────────────────────────────────
        function resize() {
            W = canvas.width  = window.innerWidth;
            H = canvas.height = window.innerHeight;
        }

        // ── Particle factory ────────────────────────────
        function makeParticle() {
            const angle = Math.random() * Math.PI * 2;
            const spd   = CONFIG.speed * (0.4 + Math.random() * 0.8);
            return {
                x  : Math.random() * W,
                y  : Math.random() * H,
                vx : Math.cos(angle) * spd,
                vy : Math.sin(angle) * spd,
                r  : CONFIG.particleRadius * (0.6 + Math.random() * 0.4),
                pulse: Math.random() * Math.PI * 2,   // phase offset for glow pulse
            };
        }

        function init() {
            resize();
            particles = Array.from({ length: CONFIG.particleCount }, makeParticle);
        }

        // ── Update ──────────────────────────────────────
        function update() {
            for (const p of particles) {
                p.pulse += 0.02;

                // mouse repulsion
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONFIG.mousePush && dist > 0) {
                    const force = (CONFIG.mousePush - dist) / CONFIG.mousePush;
                    p.vx += (dx / dist) * force * CONFIG.mousePushForce;
                    p.vy += (dy / dist) * force * CONFIG.mousePushForce;
                }

                // dampen velocity so it doesn't explode
                p.vx *= 0.995;
                p.vy *= 0.995;

                // restore speed if too slow
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (speed < CONFIG.speed * 0.3) {
                    p.vx += (Math.random() - 0.5) * 0.1;
                    p.vy += (Math.random() - 0.5) * 0.1;
                }

                p.x += p.vx;
                p.y += p.vy;

                // wrap edges
                if (p.x < -10) p.x = W + 10;
                else if (p.x > W + 10) p.x = -10;
                if (p.y < -10) p.y = H + 10;
                else if (p.y > H + 10) p.y = -10;
            }
        }

        // ── Draw ────────────────────────────────────────
        function draw() {
            ctx.clearRect(0, 0, W, H);

            // subtle gradient overlay on top of the solid CSS bg
            const grad = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.75);
            grad.addColorStop(0,   'rgba(14,30,60,0.55)');
            grad.addColorStop(1,   'rgba(5,10,20,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // lines
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i], b = particles[j];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const d  = Math.sqrt(dx * dx + dy * dy);
                    if (d < CONFIG.maxDist) {
                        const alpha = (1 - d / CONFIG.maxDist) * 0.45;
                        ctx.strokeStyle = `rgba(${CONFIG.colors.lineBase}, ${alpha})`;
                        ctx.lineWidth   = 0.7;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            // particles
            for (const p of particles) {
                const glow   = 0.6 + 0.4 * Math.sin(p.pulse);
                const radius = p.r * (0.9 + 0.2 * glow);

                // glow halo
                const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 5);
                halo.addColorStop(0, `rgba(${CONFIG.colors.lineBase}, ${0.25 * glow})`);
                halo.addColorStop(1,   'rgba(0,0,0,0)');
                ctx.fillStyle = halo;
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius * 5, 0, Math.PI * 2);
                ctx.fill();

                // core dot
                ctx.fillStyle = CONFIG.colors.particle;
                ctx.globalAlpha = 0.75 + 0.25 * glow;
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        // ── Loop ────────────────────────────────────────
        function loop() {
            update();
            draw();
            requestAnimationFrame(loop);
        }

        // ── Events ──────────────────────────────────────
        window.addEventListener('resize', () => { resize(); });
        window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
        window.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

        // ── Boot ────────────────────────────────────────
        init();
        loop();
    })();

    // ═══════════════════════════════════════════════════
    //  HAMBURGER MENU TOGGLE
    // ════════════════════════════════════════════════
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when a link is clicked
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('nav')) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });

    // ═══════════════════════════════════════════════════
    //  SCROLL ANIMATIONS
    // ════════════════════════════════════════════════
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add scroll animations to sections
    document.querySelectorAll('.section-about, .section-techstack, .section-contact').forEach(el => {
        el.classList.add('scroll-animate', 'slide-up');
        scrollObserver.observe(el);
    });

    // Add animations to about content elements
    document.querySelectorAll('.about-content h1, .about-content h2, .about-content p').forEach((el, index) => {
        el.classList.add('scroll-animate');
        if (index % 2 === 0) {
            el.classList.add('slide-left');
        } else {
            el.classList.add('slide-right');
        }
        scrollObserver.observe(el);
    });

    // Add animations to image
    const aboutImg = document.querySelector('.aboutme-img img');
    if (aboutImg) {
        aboutImg.classList.add('scroll-animate', 'scale');
        scrollObserver.observe(aboutImg);
    }

    // Add animations to badges and buttons
    document.querySelectorAll('.badge-all, .btn-1').forEach((el, index) => {
        el.classList.add('scroll-animate');
        el.style.animationDelay = (index * 0.1) + 's';
        el.classList.add('slide-up');
        scrollObserver.observe(el);
    });

    // Add animation to tech stack heading
    const techHeading = document.querySelector('.section-techstack h1');
    if (techHeading) {
        techHeading.classList.add('scroll-animate', 'fade-in');
        scrollObserver.observe(techHeading);
    }