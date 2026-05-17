    // ═══════════════════════════════════════════════════
    //  THEME (DARK/LIGHT) + PERSISTENCE
    // ════════════════════════════════════════════════
    (function initTheme() {
        const STORAGE_KEY = 'theme';

        function getSavedTheme() {
            try {
                const v = window.localStorage.getItem(STORAGE_KEY);
                return v === 'light' || v === 'dark' ? v : null;
            } catch {
                return null;
            }
        }

        function setSavedTheme(theme) {
            try {
                window.localStorage.setItem(STORAGE_KEY, theme);
            } catch {
                // ignore storage failures (privacy mode, etc.)
            }
        }

        function applyTheme(theme) {
            document.documentElement.classList.toggle('theme--light', theme === 'light');
            window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
        }

        const initial = getSavedTheme() || 'dark';
        applyTheme(initial);

        window.addEventListener('DOMContentLoaded', () => {
            const btn = document.getElementById('theme-toggle');
            if (!btn) return;

            function syncButton(theme) {
                const isLight = theme === 'light';
                btn.setAttribute('aria-pressed', String(isLight));
                btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
                const icon = btn.querySelector('i');
                if (icon) icon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
            }

            let current = initial;
            syncButton(current);

            btn.addEventListener('click', () => {
                current = current === 'light' ? 'dark' : 'light';
                setSavedTheme(current);
                applyTheme(current);
                syncButton(current);
            });

            window.addEventListener('themechange', (e) => {
                const next = e?.detail?.theme;
                if (next === 'light' || next === 'dark') {
                    current = next;
                    syncButton(current);
                }
            });
        });
    })();

    // ═══════════════════════════════════════════════════
    //  PARTICLE NETWORK BACKGROUND ANIMATION
    // ════════════════════════════════════════════════
    (function () {
        const canvas = document.getElementById('bg-canvas');
        const ctx    = canvas.getContext('2d');

        function readCssVar(name, fallback) {
            const v = getComputedStyle(document.documentElement).getPropertyValue(name);
            return (v && v.trim()) || fallback;
        }

        function readThemeColors() {
            return {
                bg: readCssVar('--canvas-bg', '#050a14'),
                particle: readCssVar('--accent', '#38bdf8'),
                glow: readCssVar('--accent-2', '#0ea5e9'),
                lineBase: readCssVar('--accent-rgb', '56,189,248'),
                gradCenter: readCssVar('--canvas-grad-center', 'rgba(14,30,60,0.55)'),
                gradEdge: readCssVar('--canvas-grad-edge', 'rgba(5,10,20,0)'),
            };
        }

        // ── Config ──────────────────────────────────────
        const CONFIG = {
            particleCount : 90,
            maxDist       : 140,      // max distance to draw a line
            particleRadius: 2,
            speed         : 0.45,
            colors: {
                ...readThemeColors(),
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
            grad.addColorStop(0, CONFIG.colors.gradCenter);
            grad.addColorStop(1, CONFIG.colors.gradEdge);
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
        window.addEventListener('themechange', () => {
            Object.assign(CONFIG.colors, readThemeColors());
        });

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
    //  LOADING SCREEN (HIDE WHEN FULLY LOADED)
    // ════════════════════════════════════════════════
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        const MIN_DURATION_MS = 1600;
        const start = Number(preloader.dataset.start || Date.now());
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MIN_DURATION_MS - elapsed);

        window.setTimeout(() => {
            preloader.classList.add('preloader--hide');

            // Remove from DOM after fade-out
            window.setTimeout(() => {
                preloader.remove();
            }, 400);
        }, remaining);
    });

    // Start the 3s progress animation as early as possible
    (function startPreloaderProgress() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;
        preloader.dataset.start = String(Date.now());
        preloader.classList.add('preloader--run');
    })();

    // ═══════════════════════════════════════════════════
    //  SIMPLE CHATBOT WIDGET (LOCAL, NO API)
    // ════════════════════════════════════════════════
    (function initChatbot() {
        const launcher = document.getElementById('chat-launcher');
        const panel = document.getElementById('chatbot');
        const closeBtn = document.getElementById('chatbot-close');
        const body = document.getElementById('chatbot-body');
        const form = document.getElementById('chatbot-form');
        const input = document.getElementById('chatbot-input');
        const chipsWrap = document.getElementById('chatbot-chips');

        if (!launcher || !panel || !closeBtn || !body || !form || !input) return;

        const BOT_NAME = 'Erick.dev';

        function escapeHtml(str) {
            return String(str)
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }

        function scrollToBottom() {
            body.scrollTop = body.scrollHeight;
        }

        function addMsg(role, text) {
            const el = document.createElement('div');
            el.className = `chatbot-msg chatbot-msg--${role}`;
            el.innerHTML = escapeHtml(text);
            body.appendChild(el);
            scrollToBottom();
            return el;
        }

        function addTyping() {
            const el = document.createElement('div');
            el.className = 'chatbot-msg chatbot-msg--bot';
            el.innerHTML =
                '<span class="chatbot-typing" aria-label="Typing">' +
                '<span class="chatbot-typingDot"></span>' +
                '<span class="chatbot-typingDot"></span>' +
                '<span class="chatbot-typingDot"></span>' +
                '</span>';
            body.appendChild(el);
            scrollToBottom();
            return el;
        }

        function openChat() {
            panel.classList.add('chatbot--open');
            panel.setAttribute('aria-hidden', 'false');
            window.setTimeout(() => input.focus(), 50);
        }

        function closeChat() {
            panel.classList.remove('chatbot--open');
            panel.setAttribute('aria-hidden', 'true');
        }

        function normalize(s) {
            return String(s || '').trim().toLowerCase();
        }

        function answerFor(textRaw) {
            const text = normalize(textRaw);

            if (text.includes('who') || text.includes('about') || text.includes('name')) {
                return `Hey! I'm ${BOT_NAME}. I can answer questions about Erick skills, projects, availability, or how to contact him.`;
            }

            if (text.includes('skill') || text.includes('stack') || text.includes('tech')) {
                return `Erick’s main stack: HTML, CSS, JavaScript, PHP, MySQL.\nTools: Git/GitHub, VS Code, Windows, Figma.`;
            }

            if (text.includes('project') || text.includes('work') || text.includes('portfolio')) {
                return `Erick builds student web projects (frontend + basic backend).\nTell me what kind of app you need and I’ll suggest a good approach.`;
            }

            if (text.includes('hire') || text.includes('available') || text.includes('freelance') || text.includes('job')) {
                return `Yes  you can reach Erick via the Contact section.\nTell me your project goal + deadline + budget range and I’ll help you draft a message.`;
            }

            if (text.includes('hello') || text === 'hi' || text.includes('hey')) {
                return `Hi! Ask me anything about Erick (skills, projects, or contact).`;
            }
            
            if (text.includes('gmail' || text.includes('facebook') || text.includes('discord'))) {
                return 'Just clike the cheack the in the section \ncontact and you can see the icon and clik it.';
            }

            return `I can help with: Just go to contact and messege me `;
        }

        function respond(userText) {
            addMsg('user', userText);

            const typing = addTyping();
            const reply = answerFor(userText);

            window.setTimeout(() => {
                typing.remove();
                addMsg('bot', reply);
            }, 520);
        }

        // Seed first bot message once
        if (body.childElementCount === 0) {
            addMsg('bot', `Hey! I'm ${BOT_NAME}. Ask me anything about  Erick.dev skills, projects, or just say hi!`);
        }

        launcher.addEventListener('click', () => {
            const isOpen = panel.classList.contains('chatbot--open');
            if (isOpen) closeChat();
            else openChat();
        });

        closeBtn.addEventListener('click', closeChat);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeChat();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const value = input.value.trim();
            if (!value) return;
            input.value = '';
            respond(value);
        });

        if (chipsWrap) {
            chipsWrap.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-chip]');
                if (!btn) return;
                const id = btn.getAttribute('data-chip');
                const map = {
                    who: 'Who are you?',
                    skills: 'Your TECH STACK?',
                    projects: 'Projects?',
                    hire: 'Hire you?',
                };
                respond(map[id] || btn.textContent || 'Hi');
            });
        }

        document.addEventListener('click', (e) => {
            if (!panel.classList.contains('chatbot--open')) return;
            const inside = e.target.closest('#chatbot') || e.target.closest('#chat-launcher');
            if (!inside) closeChat();
        });
    })();