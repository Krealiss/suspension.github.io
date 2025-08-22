document.addEventListener('DOMContentLoaded', function () {
    // === Fix: handle scroll inside .scroll-container, not window ===
    const scroller = document.querySelector('.scroll-container');

    function getScrollTop() {
        if (scroller) return scroller.scrollTop || 0;
        return window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    function onScrollAttach(handler) {
        if (scroller) scroller.addEventListener('scroll', handler, { passive: true });
        else window.addEventListener('scroll', handler, { passive: true });
    }

    // Smooth scrolling for any in-page anchor (works with scroll-container)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const id = this.getAttribute('href').slice(1);
            const target = document.getElementById(id);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Слайдер галереї
    const slider = document.querySelector('.slider');
    const slides = document.querySelectorAll('.slider img');
    const btnLeft = document.querySelector('.slide-btn.left');
    const btnRight = document.querySelector('.slide-btn.right');
    let index = 0;
    let autoSlideInterval;

    // Додаємо плавний перехід через CSS
    if (slider) {
        slider.style.transition = 'transform 0.5s ease';
    }

    function showSlide(i) {
        if (!slider || slides.length === 0) return;
        index = (i + slides.length) % slides.length;
        slider.style.transform = `translateX(-${index * 100}%)`;
    }

    if (btnLeft) btnLeft.addEventListener('click', () => showSlide(index - 1));
    if (btnRight) btnRight.addEventListener('click', () => showSlide(index + 1));

    // Автопрокрутка з можливістю зупинки при наведенні
    function startAutoSlide() {
        autoSlideInterval = setInterval(() => {
            showSlide(index + 1);
        }, 7000);
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    if (slider) {
        slider.addEventListener('mouseenter', stopAutoSlide);
        slider.addEventListener('mouseleave', startAutoSlide);
        startAutoSlide();
    }

    // Початковий показ
    showSlide(index);

    // Міжнародалізація
    const translations = {
        uk: {
            nav_about: "Про товар",
            nav_advantages: "Переваги",
            nav_gallery: "Галерея",
            nav_contact: "Контакти",
            hero_title: "Прямий підвіс для гіпсокартону",
            hero_subtitle: "Надійність. Якість. Доставка по всій Україні.",
            btn_order: "Замовити зараз",
            btn_more: "Дізнатися більше",
        },
        en: {
            nav_about: "About",
            nav_advantages: "Advantages",
            nav_gallery: "Gallery",
            nav_contact: "Contact",
            hero_title: "Straight Suspension for Drywall",
            hero_subtitle: "Reliability. Quality. Delivery all over Ukraine.",
            btn_order: "Order Now",
            btn_more: "Learn More",
        }
    };

    window.setLang = function (lang) {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(el => {
            const key = el.getAttribute('data-translate');
            if (translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });

        // Hero section
        const heroTitle = document.querySelector(".hero h2");
        const heroSubtitle = document.querySelector(".hero p");
        const heroBtns = document.querySelectorAll(".hero .btn");
        if (heroTitle) heroTitle.textContent = translations[lang].hero_title;
        if (heroSubtitle) heroSubtitle.textContent = translations[lang].hero_subtitle;
        if (heroBtns[0]) heroBtns[0].textContent = translations[lang].btn_order;
        if (heroBtns[1]) heroBtns[1].textContent = translations[lang].btn_more;
    };

    // Кнопки скролу
    let lastScrollTop = 0;
    let timeout;
    const buttons = document.querySelectorAll('.scroll-down');

    onScrollAttach(() => {
        clearTimeout(timeout);

        let currentScroll = getScrollTop();

        if (Math.abs(currentScroll - lastScrollTop) > 20) {
            buttons.forEach(btn => btn.classList.add('hidden'));
        }

        timeout = setTimeout(() => {
            buttons.forEach(btn => btn.classList.remove('hidden'));
        }, 1000);

        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    });

    // Кнопка "наверх"
    const toTopBtn = document.querySelector('.to-top');
    onScrollAttach(() => {
        if (toTopBtn) {
            if (getScrollTop() > 300) {
                toTopBtn.classList.add('show');
            } else {
                toTopBtn.classList.remove('show');
            }
        }
    });

    // Плавний скрол до #top при кліку на кнопку "наверх"
    if (toTopBtn) {
        toTopBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (scroller) { scroller.scrollTo({ top: 0, behavior: 'smooth' }); } else { document.getElementById('top').scrollIntoView({ behavior: 'smooth' }); }
        });
    }

    // Бургер-меню
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    if (burger && nav) {
        burger.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    // Закриття бургер-меню при кліку на посилання
    const navLinks = document.querySelectorAll('#nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('active')) {
                nav.classList.remove('active');
            }
        });
    });

    // Закриття бургер-меню при кліку поза ним
    document.addEventListener('click', (event) => {
        if (!nav.contains(event.target) && !burger.contains(event.target)) {
            nav.classList.remove('active');
        }
    });

    // Трекінг активної секції у меню
    const sectionIds = Array.from(navLinks).map(link => link.getAttribute('href').replace('#', ''));
    const headerHeight = document.querySelector('header')?.offsetHeight || 80;

    function onScrollActiveSection() {
        let currentSection = null;

        for (let i = 0; i < sectionIds.length; i++) {
            const section = document.getElementById(sectionIds[i]);
            if (section) {
                const rect = section.getBoundingClientRect();
                const middle = window.innerHeight / 2;

                // Якщо середина екрана потрапляє в секцію
                if (rect.top <= middle && rect.bottom >= middle) {
                    currentSection = sectionIds[i];
                    break;
                }
            }
        }

        navLinks.forEach(link => {
            link.classList.toggle(
                'active-section',
                link.getAttribute('href') === '#' + currentSection
            );
        });
    }


    onScrollAttach(onScrollActiveSection);
    onScrollActiveSection(); // ініціалізація при завантаженні
});

// FAQ акордеон
document.addEventListener('DOMContentLoaded', function () {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', function () {
            // Закрити всі інші
            faqItems.forEach(i => {
                if (i !== item) i.classList.remove('active');
            });
            // Перемикаємо поточний
            item.classList.toggle('active');
        });
    });

    // Ensure initial to-top visibility check runs
    (function () {
        const toTopBtnOnce = document.querySelector('.to-top');
        function handleToTopVisibility() {
            if (!toTopBtnOnce) return;
            if (getScrollTop() > 300) toTopBtnOnce.classList.add('show');
            else toTopBtnOnce.classList.remove('show');
        }
        onScrollAttach(handleToTopVisibility);
        handleToTopVisibility();
    })();
});
