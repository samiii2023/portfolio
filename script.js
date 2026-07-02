/**
 * Alex Carter - Personal Portfolio Interactivity Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize components
    initCustomCursor();
    initThemeToggle();
    initMobileMenu();
    initHeaderScroll();
    initScrollReveal();
    initTypingEffect();
    initContactForm();

});

/* ==========================================================================
   1. CUSTOM HALO CURSOR
   ========================================================================== */
function initCustomCursor() {
    const dot = document.getElementById('custom-cursor-dot');
    const outline = document.getElementById('custom-cursor-outline');
    
    if (!dot || !outline) return;

    // Track mouse coordinates
    let mouseX = 0;
    let mouseY = 0;
    
    // Interpolated coordinates for smooth halo cursor movement
    let outlineX = 0;
    let outlineY = 0;
    
    // LERP factor (Linear Interpolation - 0.15 makes it smooth and lag slightly behind)
    const speed = 0.15;
    
    let isHidden = true;

    window.addEventListener('mousemove', (e) => {
        if (isHidden) {
            dot.style.opacity = 1;
            outline.style.opacity = 1;
            isHidden = false;
        }
        
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Instant position for the dot
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    // Lerp loop for outline
    function updateOutline() {
        outlineX += (mouseX - outlineX) * speed;
        outlineY += (mouseY - mouseY) * speed;
        
        outline.style.transform = `translate(${outlineX}px, ${outlineY}px) translate(-50%, -50%)`;
        requestAnimationFrame(updateOutline);
    }
    
    // Overriding the update function slightly to ensure it tracks correctly even under requestAnimationFrame delay
    function animateOutline() {
        outlineX += (mouseX - outlineX) * speed;
        outlineY += (mouseY - outlineY) * speed;
        outline.style.left = `${outlineX}px`;
        outline.style.top = `${outlineY}px`;
        requestAnimationFrame(animateOutline);
    }
    
    // Let's use left/top for absolute positioning of outline, or translate. Left/top is highly reliable.
    // Let's reset initial inline styles to match left/top approach.
    outline.style.transform = 'translate(-50%, -50%)';
    dot.style.transform = 'translate(-50%, -50%)';
    
    window.addEventListener('mousemove', (e) => {
        if (isHidden) {
            dot.style.opacity = 1;
            outline.style.opacity = 1;
            isHidden = false;
        }
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        dot.style.left = `${mouseX}px`;
        dot.style.top = `${mouseY}px`;
    });
    
    animateOutline();

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        dot.style.opacity = 0;
        outline.style.opacity = 0;
        isHidden = true;
    });

    // Hover states for interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, .project-card, .overlay-link-btn');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            document.body.classList.add('cursor-hover');
        });
        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('cursor-hover');
        });
    });
}

/* ==========================================================================
   2. THEME SWITCHER (DARK / LIGHT)
   ========================================================================== */
function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;

    // Check cached theme or fallback to system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    }

    themeBtn.addEventListener('click', () => {
        if (document.body.classList.contains('light-theme')) {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            showToast('Theme switched to Dark mode', 'success');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
            showToast('Theme switched to Light mode', 'success');
        }
    });
}

/* ==========================================================================
   3. MOBILE NAVIGATION DRAWER
   ========================================================================== */
function initMobileMenu() {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelectorAll('.mobile-nav-link');
    
    if (!menuToggle || !mobileMenu) return;

    function toggleMenu() {
        const isOpen = menuToggle.classList.contains('open');
        
        if (isOpen) {
            menuToggle.classList.remove('open');
            mobileMenu.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
            mobileMenu.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = 'auto'; // allow scroll
        } else {
            menuToggle.classList.add('open');
            mobileMenu.classList.add('open');
            menuToggle.setAttribute('aria-expanded', 'true');
            mobileMenu.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // prevent scroll
        }
    }

    menuToggle.addEventListener('click', toggleMenu);
    
    // Close mobile menu when link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (menuToggle.classList.contains('open')) {
                toggleMenu();
            }
        });
    });
}

/* ==========================================================================
   4. HEADER SCROLL EFFECT & ACTIVE NAVIGATION LINKS
   ========================================================================== */
function initHeaderScroll() {
    const header = document.getElementById('main-header');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (!header) return;

    window.addEventListener('scroll', () => {
        // Toggle scrolled class
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Active link highlighting
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 150; // offset

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });
}

/* ==========================================================================
   5. SCROLL REVEAL ANIMATIONS (INTERSECTION OBSERVER)
   ========================================================================== */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    
    if (revealElements.length === 0) return;

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // trigger when 15% of element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target); // only reveal once
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        observer.observe(el);
    });
}

/* ==========================================================================
   6. DYNAMIC TYPING EFFECT
   ========================================================================== */
function initTypingEffect() {
    // Add target span to Hero Title dynamically if needed or just insert it
    const titleElement = document.querySelector('.hero-title');
    if (!titleElement) return;

    // Create container for typing text dynamically inside header to keep markup clean
    // Replace content of .gradient-text with typing elements if desired, or build it directly.
    // In index.html, we wrote: "Exceptional Web Experiences."
    // Let's create a rotating list of subtitles below the title or modify it.
    // Let's target the hero description to type out skills, or add typing text in the main heading.
    // Let's replace "Experiences" or append a typing cursor.
    // Let's target: "Designing & Coding Exceptional Web Experiences." and make "Experiences" dynamic.
    
    // Instead, let's create a typing subtitle element in JavaScript and inject it.
    const heroDesc = document.querySelector('.hero-desc');
    if (!heroDesc) return;
    
    const typingSpan = document.createElement('div');
    typingSpan.className = 'typing-container';
    typingSpan.innerHTML = 'Specializing in <span id="typed-text" class="gradient-text"></span><span class="typed-cursor">|</span>';
    typingSpan.style.marginTop = '12px';
    typingSpan.style.fontSize = '1.2rem';
    typingSpan.style.fontWeight = '600';
    
    // Add custom style for blinking cursor
    const style = document.createElement('style');
    style.innerHTML = `
        .typed-cursor {
            color: var(--accent);
            animation: blink 0.8s infinite;
            margin-left: 2px;
            font-weight: 400;
        }
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
        .typing-container {
            font-family: var(--font-heading);
        }
    `;
    document.head.appendChild(style);
    
    // Insert typing container before the CTA buttons
    heroDesc.parentNode.insertBefore(typingSpan, heroDesc.nextSibling);

    const words = ["Service Desk Operations", "System Administration", "Cyber Security Auditing", "PowerShell Automation"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typedTextEl = document.getElementById('typed-text');
    
    function type() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            // Remove character
            typedTextEl.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            // Add character
            typedTextEl.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }

        // Timing configurations
        let typingSpeed = isDeleting ? 40 : 80;

        if (!isDeleting && charIndex === currentWord.length) {
            // Pause at end of word
            typingSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            // Move to next word
            wordIndex = (wordIndex + 1) % words.length;
            typingSpeed = 500;
        }

        setTimeout(type, typingSpeed);
    }

    // Start loop
    setTimeout(type, 1000);
}

/* ==========================================================================
   7. CONTACT FORM VALIDATION & MOCK SUBMIT
   ========================================================================== */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const nameInput = document.getElementById('form-name');
    const emailInput = document.getElementById('form-email');
    const subjectInput = document.getElementById('form-subject');
    const messageInput = document.getElementById('form-message');
    const submitBtn = document.getElementById('form-submit-btn');

    // Validation patterns
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validateField(input, condition, errorId) {
        const group = input.closest('.form-group');
        if (condition) {
            group.classList.remove('invalid');
            return true;
        } else {
            group.classList.add('invalid');
            return false;
        }
    }

    // Reset validation styles on user input
    [nameInput, emailInput, subjectInput, messageInput].forEach(input => {
        input.addEventListener('input', () => {
            const group = input.closest('.form-group');
            group.classList.remove('invalid');
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Perform validations
        const isNameValid = validateField(nameInput, nameInput.value.trim() !== '', 'name-error');
        const isEmailValid = validateField(emailInput, emailRegex.test(emailInput.value.trim()), 'email-error');
        const isSubjectValid = validateField(subjectInput, subjectInput.value.trim() !== '', 'subject-error');
        const isMessageValid = validateField(messageInput, messageInput.value.trim() !== '', 'message-error');

        if (isNameValid && isEmailValid && isSubjectValid && isMessageValid) {
            // Form is valid - Trigger submission animation
            submitBtn.disabled = true;
            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.innerHTML = `Sending... <i class="fa-solid fa-circle-notch fa-spin button-arrow"></i>`;

            // Prepare Web3Forms POST payload
            const formData = new FormData(form);

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            })
            .then(async (response) => {
                const resData = await response.json();
                if (response.ok) {
                    showToast(`Thank you, ${nameInput.value.trim()}! Message sent successfully.`, 'success');
                    form.reset();
                    // Blur inputs to reset floating labels correctly
                    [nameInput, emailInput, subjectInput, messageInput].forEach(inp => inp.blur());
                } else {
                    console.error(resData);
                    showToast(resData.message || "Failed to deliver message. Please try again.", 'error');
                }
            })
            .catch(error => {
                console.error("Web3Forms Error:", error);
                showToast("Connection error. Please check your internet connection.", 'error');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
            });
        } else {
            showToast('Please fill in all fields correctly.', 'error');
        }
    });
}

/* ==========================================================================
   8. TOAST NOTIFICATION SYSTEM
   ========================================================================== */
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-notif-container');
    if (!toastContainer) return;

    // Create toast structure
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    
    toast.innerHTML = `
        <i class="fa-solid ${icon} toast-icon"></i>
        <span class="toast-message">${message}</span>
    `;

    // Append toast
    toastContainer.appendChild(toast);

    // Trigger visual entry transition
    setTimeout(() => {
        toast.classList.add('show');
    }, 50);

    // Remove toast after duration
    setTimeout(() => {
        toast.classList.remove('show');
        // Delete element after animation ends
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 4000);
}
