const yearSpan = document.getElementById("year");
if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear().toString();
}

function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    let period = hours >= 12 ? 'PM' : 'AM';
    let displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;

    const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;
    document.getElementById('current-time').textContent = timeString;
}

updateClock();
setInterval(updateClock, 1000);

const projectsData = {
    'achievements': {
        title: 'Achievements & Awards',
        date: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M6 9a6 6 0 1 0 12 0A6 6 0 1 0 6 9"/><path d="m12 15l3.4 5.89l1.598-3.233l3.598.232l-3.4-5.889M6.802 12l-3.4 5.89L7 17.657l1.598 3.232l3.4-5.889"/></g></svg>',
        fullDesc: '',
    },
    'extracurriculars-hobbies': {
        title: 'Extracurriculars & Hobbies',
        date: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M6 9a6 6 0 1 0 12 0A6 6 0 1 0 6 9"/><path d="m12 15l3.4 5.89l1.598-3.233l3.598.232l-3.4-5.889M6.802 12l-3.4 5.89L7 17.657l1.598 3.232l3.4-5.889"/></g></svg>',
        fullDesc: '',
    }
};

function showProjectPopup(projectId) {
    const project = projectsData[projectId];
    if (!project) {
        console.error('Project data not found for ID:', projectId);
        return;
    }
    
    const overlay = document.getElementById('popup-overlay');
    const popupTitle = overlay.querySelector('.popup-title');
    const popupDate = overlay.querySelector('.popup-date');
    const popupDescription = overlay.querySelector('.popup-description');
    const popupDetails = overlay.querySelector('.popup-details');
    const popupTechnologies = overlay.querySelector('.popup-technologies');
    const projectLink = overlay.querySelector('.project-link');
    
    popupTitle.textContent = project.title;
    
    if (project.date && project.date.includes('<svg')) {
        popupDate.innerHTML = project.date;
    } else {
        popupDate.textContent = project.date;
    }
    
    popupDescription.textContent = project.shortDesc;
    popupDetails.textContent = project.fullDesc;
    
    popupTechnologies.innerHTML = '';
    if (project.technologies && project.technologies.length > 0) {
        project.technologies.forEach(tech => {
            const tag = document.createElement('span');
            tag.className = 'tech-tag';
            tag.textContent = tech;
            popupTechnologies.appendChild(tag);
        });
    }
    
    if (project.link) {
        projectLink.href = project.link;
        projectLink.style.display = 'inline-flex';
    } else {
        projectLink.style.display = 'none';
    }
    
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    document.querySelector('.project-popup').addEventListener('wheel', (e) => {
        e.stopPropagation();
    });
}

function closeProjectPopup() {
    const overlay = document.getElementById('popup-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function() {
    setupProjectCards();
    
    const overlay = document.getElementById('popup-overlay');
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeProjectPopup();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeProjectPopup();
        }
    });
});

function setupProjectCards() {
    const projectCards = document.querySelectorAll('.project');
    
    projectCards.forEach(card => {
        let projectId = card.getAttribute('data-project-id');
        
        if (!projectId) {
            const titleElement = card.querySelector('.project-title');
            if (titleElement) {
                const title = titleElement.textContent.trim();
                projectId = title.toLowerCase().replace(/\s+/g, '-');
                card.setAttribute('data-project-id', projectId);
                
                if (!projectsData[projectId]) {
                    const dateElement = card.querySelector('.project-date');
                    const descElement = card.querySelector('.project-description');
                    
                    projectsData[projectId] = {
                        title: title,
                        date: dateElement ? dateElement.textContent.trim() : '',
                        shortDesc: descElement ? descElement.textContent.trim() : '',
                        fullDesc: descElement ? descElement.textContent.trim() + '\n\nMore detailed information will be added soon.' : '',
                        technologies: []
                    };
                }
            }
        }
        
        card.addEventListener('click', function() {
            const id = this.getAttribute('data-project-id');
            if (id) {
                showProjectPopup(id);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    function applyTheme(theme, animate = false) {
        if (animate) {
            document.documentElement.classList.add('theme-transition');
            setTimeout(() => {
                document.documentElement.classList.remove('theme-transition');
            }, 500);
        }
        
        document.documentElement.setAttribute('data-theme', theme);
        
        const contentSVGs = document.querySelectorAll('svg:not(.theme-icon)');
        contentSVGs.forEach(svg => {
            svg.style.filter = theme === 'light' ? 'invert(0.6)' : 'none';
        });
    }
    
    if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
        applyTheme('light');
    } else {
        applyTheme('dark');
    }
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme, true);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const formResponse = document.getElementById('form-response');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitButton = contactForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            
            const formData = new FormData(contactForm);
            
            fetch('https://docs.google.com/forms/d/e/1FAIpQLSfB7s3cz0FDgIq1tVkEsp_zdQ_n6GFbRDwFK57dTxVypjSnmg/formResponse', {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            })
            .then(() => {
                formResponse.innerHTML = 'Message sent!';
                contactForm.reset();
            })
            .catch(error => {
                console.error('Error:', error);
                formResponse.innerHTML = 'Something went wrong. Please try again.';
            })
            .finally(() => {
                submitButton.disabled = false;
                submitButton.textContent = 'Send';
                setTimeout(() => {
                    formResponse.innerHTML = '';
                }, 3000);
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = [
        document.querySelector('.header'),
        document.querySelector('.profile-name'),
        document.querySelector('.profile-title'),
        document.querySelector('.button-row'),
        document.querySelector('.profile-bio'),
        document.querySelector('.carousel-container'),
        document.querySelector('.styled-divider-1'),
        document.querySelector('.sections'),
        document.querySelector('.styled-divider-2'),
        document.querySelector('.styled-divider-3'),
        document.querySelector('.about-content'),
        document.querySelector('.styled-divider-4'),
        document.querySelector('.footer-form'),
        document.querySelector('.carousel-container'),
        document.querySelector('.footer'),
        document.querySelector('.secret-code-wrapper')
    ];

    animatedElements.forEach((element, index) => {
        if (element) {
            element.classList.add('fade-element');
            element.style.animationDelay = `${index * 0.10}s`;
        }
    });

    const projectItems = document.querySelectorAll('.project');
    const aboutContent = document.querySelector('.about-content');
    const footerFormElements = document.querySelectorAll('.footer-form-row');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    });

    projectItems.forEach(item => {
        item.classList.add('fade-scroll');
        observer.observe(item);
    });

    if (aboutContent) {
        const paragraphs = aboutContent.querySelectorAll('span');
        paragraphs.forEach(para => {
            para.classList.add('fade-scroll');
            observer.observe(para);
        });
    }

    footerFormElements.forEach(element => {
        element.classList.add('fade-scroll');
        observer.observe(element);
    });

    const profileBio = document.querySelector('.profile-bio');
    if (profileBio) {
        profileBio.classList.add('fade-element');
        profileBio.style.animationDelay = '0.6s';
    }
});

fetch('https://api.github.com/repos/Q2x38b/e108.dev/commits?&per_page=1&page=1')
  .then(response => response.json())
  .then(data => {
    const latestCommitSHA = data[0].sha;
    const shortSHA = latestCommitSHA.substring(0, 7);
    document.getElementById('commit').textContent = shortSHA;
  })
  .catch(error => console.error('Error fetching commit:', error));


document.addEventListener('DOMContentLoaded', () => {
    initSpotlightSearch();
});

function initSpotlightSearch() {
    const spotlightContainer = document.getElementById('spotlight-search');
    const spotlightInput     = document.getElementById('spotlight-input');
    const spotlightLinks     = document.getElementById('spotlight-links');
    const spotlightPages     = document.getElementById('spotlight-pages');
    const spotlightSections  = document.getElementById('spotlight-sections');

    const searchableItems = [
        { type: 'link', title: 'Email', description: 'Send me an email', url: 'mailto:hello@e108.dev', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>' },
        { type: 'link', title: 'Resume', description: 'Download my resume', url: 'https://e108.dev/resume.pdf', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>' },
        { type: 'link', title: 'Projects', description: 'View my projects', url: 'https://e108.dev/links', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" stroke-width=".5"><path fill="currentColor" stroke="currentColor" d="M8.465 11.293c1.133-1.133 3.109-1.133 4.242 0l.707.707l1.414-1.414l-.707-.707c-.943-.944-2.199-1.465-3.535-1.465s-2.592.521-3.535 1.465L4.929 12a5.01 5.01 0 0 0 0 7.071a4.98 4.98 0 0 0 3.535 1.462A4.98 4.98 0 0 0 12 19.071l.707-.707l-1.414-1.414l-.707.707a3.007 3.007 0 0 1-4.243 0a3.005 3.005 0 0 1 0-4.243z"/><path fill="currentColor" stroke="currentColor" d="m12 4.929l-.707.707l1.414 1.414l.707-.707a3.007 3.007 0 0 1 4.243 0a3.005 3.005 0 0 1 0 4.243l-2.122 2.121c-1.133 1.133-3.109 1.133-4.242 0L10.586 12l-1.414 1.414l.707.707c.943.944 2.199 1.465 3.535 1.465s2.592-.521 3.535-1.465L19.071 12a5.01 5.01 0 0 0 0-7.071a5.006 5.006 0 0 0-7.071 0"/></svg>' },
        { type: 'link', title: 'Blog', description: 'Read my blog posts', url: 'https://e108.dev/blog', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4M2 6h4m-4 4h4m-4 4h4m-4 4h4"/></g></svg>' },
        { type: 'link', title: 'GitHub', description: 'View my GitHub profile', url: 'https://github.com/Q2x38b', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>' },
        { type: 'page', title: 'Home', description: 'Return to homepage', url: 'https://e108.dev/', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>' },
        { type: 'page', title: 'Links', description: 'All my important links', url: 'https://e108.dev/links', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7h2"></path><path d="M15 7h2a5 5 0 1 1 0 10h-2"></path><line x1="8" x2="16" y1="12" y2="12"></line></svg>' },
        { type: 'section', title: 'Extracurriculars', description: 'Sports, clubs, and organizations', url: '#extracurriculars-hobbies', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><rect x="9" y="9" width="6" height="6"></rect></svg>' },
        { type: 'section', title: 'Hobbies', description: 'My favorite hobbies', url: '#hobbies', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>' },
        { type: 'section', title: 'Achievements', description: 'My achievements and awards', url: '#achievements', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>' },
        { type: 'section', title: 'About Me', description: 'Learn more about me', url: '#about-me', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path></svg>' },
        { type: 'section', title: 'Contact', description: 'Get in touch with me', url: '#contact', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>' }
    ];

    let selectedIndex = -1;
    let filteredItems = [];

    document.addEventListener('keydown', (e) => {
        const keybindsContainer = document.getElementById('keybinds-popup');
        const keybindsActive    = keybindsContainer?.classList.contains('active');
        const spotlightActive   = spotlightContainer.classList.contains('active');

        if ((e.key === '1' && e.shiftKey) || e.key === '!') {
            e.preventDefault();
            if (keybindsActive) {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                openSpotlight();
            } else if (spotlightActive) {
                closeSpotlight();
            } else {
                openSpotlight();
            }
            return;
        }

        if (e.key === 'Escape' && spotlightActive) {
            closeSpotlight();
            return;
        }

        if (!spotlightActive) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigateResults(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigateResults(-1);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            selectResult(filteredItems[selectedIndex]);
        }
    });

    spotlightContainer.querySelector('.spotlight-backdrop').addEventListener('click', closeSpotlight);
    spotlightInput.addEventListener('input', () => filterResults(spotlightInput.value.toLowerCase().trim()));

    function openSpotlight() {
        spotlightContainer.style.display = 'block';
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            spotlightContainer.classList.add('active');
            spotlightInput.focus();
            filterResults('');
        }, 10);
    }

    function closeSpotlight() {
        spotlightContainer.classList.remove('active');
        setTimeout(() => {
            spotlightContainer.style.display = 'none';
            spotlightInput.value = '';
            document.body.style.overflow = '';
        }, 300);
    }

    function filterResults(query) {
        spotlightLinks.innerHTML = '';
        spotlightPages.innerHTML = '';
        spotlightSections.innerHTML = '';
        selectedIndex = -1;

        filteredItems = query
            ? searchableItems.filter(item =>
                  item.title.toLowerCase().includes(query) ||
                  item.description.toLowerCase().includes(query)
              )
            : [...searchableItems];

        renderResults(filteredItems.filter(i => i.type === 'link'), spotlightLinks);
        renderResults(filteredItems.filter(i => i.type === 'page'), spotlightPages);
        renderResults(filteredItems.filter(i => i.type === 'section'), spotlightSections);

        if (filteredItems.length === 0 && query) {
            const noResults = document.createElement('div');
            noResults.className = 'spotlight-no-results';
            noResults.textContent = 'No results found';
            spotlightLinks.appendChild(noResults);
        }
    }

    function renderResults(items, container) {
        if (items.length === 0) {
            container.parentElement.style.display = 'none';
            return;
        }
        container.parentElement.style.display = 'block';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'spotlight-result-item';
            div.dataset.url = item.url;
            div.innerHTML = `
              <div class="spotlight-result-icon">${item.icon}</div>
              <div class="spotlight-result-content">
                <div class="spotlight-result-title">${item.title}</div>
                <div class="spotlight-result-description">${item.description}</div>
              </div>`;
            div.addEventListener('click', () => selectResult(item));
            container.appendChild(div);
        });
    }

    function navigateResults(dir) {
        const items = document.querySelectorAll('.spotlight-result-item');
        items.forEach(i => i.classList.remove('selected'));
        selectedIndex = (selectedIndex + dir + filteredItems.length) % filteredItems.length;
        items[selectedIndex]?.classList.add('selected');
        items[selectedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function selectResult(item) {
        closeSpotlight();
        if (item.url.startsWith('#')) {
            const el = document.querySelector(item.url) || document.querySelector(`[data-project-id="${item.url.slice(1)}"]`);
            el?.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = item.url;
        }
    }

    const btn = document.querySelector('.spotlight-trigger');
    btn?.addEventListener('click', () => {
        spotlightContainer.classList.contains('active') ? closeSpotlight() : openSpotlight();
    });
}

    const spotlightBtn = document.createElement('button');
    spotlightBtn.className = 'spotlight-trigger';
    spotlightBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <span class="spotlight-trigger-text">Search</span>`;
    spotlightBtn.addEventListener('click', () => {
        const active = spotlightContainer.classList.contains('active');
        active ? closeSpotlight() : openSpotlight();
    });
    const header = document.querySelector('.header-right');
    if (header) header.insertBefore(spotlightBtn, header.firstChild);

document.addEventListener('DOMContentLoaded', () => {
    initKeybindsPopup();
});

function initKeybindsPopup() {
    const keybindsContainer = document.getElementById('keybinds-popup');
    const closeButton       = keybindsContainer.querySelector('.keybinds-close');

    const keybindsTrigger = document.createElement('button');
    keybindsTrigger.className = 'keybinds-trigger';
    keybindsTrigger.setAttribute('aria-label', 'Show keyboard shortcuts');
    keybindsTrigger.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
        <path d="M6 8h.001"></path>
        <path d="M10 8h.001"></path>
        <path d="M14 8h.001"></path>
        <path d="M18 8h.001"></path>
        <path d="M8 12h.001"></path>
        <path d="M12 12h.001"></path>
        <path d="M16 12h.001"></path>
        <path d="M7 16h10"></path>
      </svg>`;
    document.body.appendChild(keybindsTrigger);

    document.addEventListener('keydown', (e) => {
        const spotlightContainer = document.getElementById('spotlight-search');
        const spotlightActive    = spotlightContainer && spotlightContainer.classList.contains('active');
        const keybindsActive     = keybindsContainer.classList.contains('active');

        if ((e.key === '2' && e.shiftKey) || e.key === '@') {
            e.preventDefault();
            if (spotlightActive) {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                openKeybindsPopup();
            } else if (keybindsActive) {
                closeKeybindsPopup();
            } else {
                openKeybindsPopup();
            }
            return;
        }

        if (e.key === 'Escape' && keybindsActive) {
            closeKeybindsPopup();
            return;
        }

    });

    closeButton.addEventListener('click', closeKeybindsPopup);
    keybindsContainer.querySelector('.keybinds-backdrop').addEventListener('click', closeKeybindsPopup);
    keybindsTrigger.addEventListener('click', () => {
        const active = keybindsContainer.classList.contains('active');
        active ? closeKeybindsPopup() : openKeybindsPopup();
    });

    function openKeybindsPopup() {
        keybindsContainer.style.display = 'block';
        document.body.style.overflow = 'hidden';
        setTimeout(() => keybindsContainer.classList.add('active'), 10);
    }
    function closeKeybindsPopup() {
        keybindsContainer.classList.remove('active');
        setTimeout(() => {
            keybindsContainer.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
}

function countAndDisplayCodeLines() {
    let lineCounts = { html: 0, css: 0, js: 0, total: 0 };
    let filesToProcess = 3;

    fetch('index.html')
      .then(res => res.text())
      .then(data => {
        lineCounts.html = data.split('\n').length;
        updateTotal();
      })
      .catch(() => { filesToProcess--; });

    fetch('styles.css')
      .then(res => res.text())
      .then(data => {
        lineCounts.css = data.split('\n').length;
        updateTotal();
      })
      .catch(() => { filesToProcess--; });

    fetch('script.js')
      .then(res => res.text())
      .then(data => {
        lineCounts.js = data.split('\n').length;
        updateTotal();
      })
      .catch(() => { filesToProcess--; });

    function updateTotal() {
      filesToProcess--;
      if (filesToProcess <= 0) {
        lineCounts.total = lineCounts.html + lineCounts.css + lineCounts.js;
        displayInFooter();
      }
    }

    function displayInFooter() {
      const span = document.createElement('span');
      span.id = 'line-counter';
      span.innerHTML = `<a class="text-hover" title="HTML: ${lineCounts.html} lines\nCSS: ${lineCounts.css} lines\nJS: ${lineCounts.js} lines">${lineCounts.total.toLocaleString()} LOC</a> • `;
      const copyright = document.querySelector('.copyright');
      if (!copyright) return;
      const ccLink = copyright.querySelector('a[href*="creativecommons"]');
      if (ccLink) ccLink.parentNode.insertBefore(span, ccLink);
      else copyright.appendChild(span);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(countAndDisplayCodeLines, 500);
});

document.addEventListener('DOMContentLoaded', () => {
    const correctCode = "4a6H";
    const inputs = document.querySelectorAll('.code-input');

    inputs.forEach((input, idx) => {
        input.addEventListener('input', function() {
            this.value = this.value.slice(0,1);
            if (this.value && idx < inputs.length - 1) inputs[idx+1].focus();
            checkCode();
        });
        input.addEventListener('keydown', e => {
            if (e.key === 'Backspace' && !this.value && idx > 0) inputs[idx-1].focus();
        });
    });

    function checkCode() {
        const entered = Array.from(inputs).map(i => i.value).filter(Boolean);
        if (entered.length === 4) {
            const sortedIn = entered.slice().sort().join('');
            const sortedCorrect = [...correctCode].sort().join('');
            if (sortedIn === sortedCorrect) {
                triggerConfetti();
                setTimeout(() => {
                    inputs.forEach(i => i.value = '');
                    inputs[0].focus();
                }, 1500);
            }
        }
    }

    function triggerConfetti() {
        const container = document.getElementById('confetti-container');
        container.innerHTML = '';
        const colors = ['#FF577F','#FF884B','#FDBF50','#70D4FF','#6C63FF','#7EC636'];
        const count = Math.min(Math.floor(window.innerWidth/10), 200);

        for (let i=0; i<count; i++){
            const conf = document.createElement('div');
            conf.className = 'confetti';
            conf.style.left = Math.random()*100 + '%';
            const size = Math.random()*8 + 4;
            conf.style.width = conf.style.height = size + 'px';
            const speed = 1.5 + Math.random();
            const delay = Math.random()*0.8;
            conf.style.animation = `fall-${i} ${speed}s linear ${delay}s forwards`;
            conf.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
            conf.style.boxShadow = '0 0 3px rgba(255,255,255,0.3)';
            const startX = -10 + Math.random()*20;
            const endX = startX + (-30 + Math.random()*60);
            const keyframes = `
              @keyframes fall-${i} {
                0% { transform: translateY(0) translateX(0) rotate(0deg) scale(0.7); opacity:0 }
                5% { transform: translateY(0) translateX(${startX}px) rotate(45deg) scale(1); opacity:1 }
                100% { transform: translateY(120vh) translateX(${endX}px) rotate(360deg) scale(0.7); opacity:0 }
              }
            `;
            const style = document.createElement('style');
            style.innerHTML = keyframes;
            document.head.appendChild(style);
            container.appendChild(conf);
        }

        setTimeout(() => {
            document.querySelectorAll('style').forEach(s => {
                if (s.innerHTML.includes('@keyframes fall-')) s.remove();
            });
            container.innerHTML = '';
        }, 4000);
    }
});

function displayConsoleSymbol() {
    const sym = `
     _  _   
    | || |  
    | || |_ 
    |__   _|
       | |  
       |_|  
    `;
    console.log('%c'+sym, 'font-family:monospace;white-space:pre;');
}

document.addEventListener('DOMContentLoaded', displayConsoleSymbol);

function checkForSecretParam() {
    const p = new URLSearchParams(window.location.search);
    if (p.get('secret') === 'g') {
        console.log('%c\n    __ _ \n   / _\` |\n  | (_| |\n   \\__,_|\n', 'font-family:monospace;white-space:pre;');
        document.body.style.transition='all 0.5s ease';
        document.body.style.boxShadow='inset 0 0 20px rgba(100,100,100,0.1)';
        setTimeout(()=>document.body.style.boxShadow='none',2000);
    }
}
function setupKonamiCode() {
    const code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let idx = 0;
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { idx = 0; return; }
        if (e.key === code[idx]) {
            idx++;
            if (idx === code.length) {
                idx = 0;
                console.log('%c\n __   \n/ /_  \n|  _ \\ \n| (_) |\n \\___/ \n', 'font-family:monospace;white-space:pre;');
                const flash = document.createElement('div');
                Object.assign(flash.style, {
                    position:'fixed',top:0,left:0,width:'100%',height:'100%',
                    backgroundColor:'rgba(100,100,255,0.1)',zIndex:9999
                });
                document.body.appendChild(flash);
                setTimeout(()=>flash.remove(),300);
            }
        } else idx = 0;
    });
}

function setupFaviconSecret() {
    const corner = document.createElement('div');
    Object.assign(corner.style, {
        position:'fixed',top:0,left:0,width:'20px',height:'20px',zIndex:9999,cursor:'default'
    });
    document.body.appendChild(corner);
    let shown = false;
    corner.addEventListener('mouseenter', () => {
        if (shown) return;
        console.log('%c\n _    _ \n| |  | |\n| |__| |\n|  __  |\n| |  | |\n|_|  |_|', 'font-family:monospace;white-space:pre;');
        shown = true;
    });
}


document.addEventListener('DOMContentLoaded', () => {
    checkForSecretParam();
    setupKonamiCode();
    setupFaviconSecret();
});

document.addEventListener('DOMContentLoaded', function() {
    const items = ['Developer', 'Student', 'Athlete', 'Leader', 'Opportunist', 'Problem-Solver', 'Logical', 'Collaborative', 'Proactive'];
    const carousel1 = document.getElementById('carousel1');
    const carousel2 = document.getElementById('carousel2');
    const carousel3 = document.getElementById('carousel3');
    
    function createItems(container) {
        items.forEach(text => {
            const item = document.createElement('div');
            item.className = 'carousel-item';
            item.textContent = text;
            container.appendChild(item);
        });
    }
    
    createItems(carousel1);
    createItems(carousel2);
    createItems(carousel3);
    
    function adjustAnimationSpeed() {
        const itemWidth = carousel1.scrollWidth;
        const speed = itemWidth / 70;
        
        document.querySelectorAll('.carousel-content').forEach(carousel => {
            carousel.style.animationDuration = `${speed}s`;
        });
    }
    
    adjustAnimationSpeed();
    window.addEventListener('resize', adjustAnimationSpeed);
});

document.addEventListener('DOMContentLoaded', function() {
    const elements = document.querySelectorAll('.secret-code-wrapper');
    
    elements.forEach(function(element) {
      element.style.display = 'none';
    });
  });
  
  document.addEventListener('keydown', function(event) {
    if (event.key === 'z' || event.key === 'Z') {
      const elements = document.querySelectorAll('.secret-code-wrapper');
      
      elements.forEach(function(element) {
        if (element.style.display === 'none') {
          element.style.display = '';
        } else {
          element.style.display = 'none';
        }
      });
    }
  });

  document.addEventListener('DOMContentLoaded', function() {
    const textContainer = document.getElementById('textContainer');
    let currentTextElement = null;
    
    function animateTextChange(newText) {
        const newTextElement = document.createElement('div');
        newTextElement.className = 'animation-text';
        newTextElement.textContent = newText;
        
        textContainer.appendChild(newTextElement);
        
        void newTextElement.offsetWidth;
        
        if (currentTextElement) {
            currentTextElement.classList.remove('visible');
            currentTextElement.classList.remove('normal-color');
            currentTextElement.classList.add('exiting');
            
            const elementToRemove = currentTextElement;
            setTimeout(() => {
                if (textContainer.contains(elementToRemove)) {
                    elementToRemove.remove();
                }
            }, 500);
        }
        
        requestAnimationFrame(() => {
            newTextElement.classList.add('visible');
            
            setTimeout(() => {
                if (textContainer.contains(newTextElement)) {
                    newTextElement.classList.add('normal-color');
                }
            }, 500);
        });
        
        currentTextElement = newTextElement;
    }
    
    animateTextChange('A Student');
    
    const textExamples = [
        'A Developer', 'An Athlete', 'A Leader', 'An Opportunist', 'A Problem-Solver', 'Logical', 'Collaborative', 'Proactive', 'Dependable'
    ];
    
    let textIndex = 0;
    setInterval(() => {
        textIndex = (textIndex + 1) % textExamples.length;
        animateTextChange(textExamples[textIndex]);
    }, 3000);
});
