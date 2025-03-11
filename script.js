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
    'extracurriculars': {
        title: 'Extracurriculars',
        date: '2024 - 11',
        shortDesc: 'Some of my comitments and acheivements that are worth sharing',
        fullDesc: 'Waterpolo\n\nI worked on the marketing, website and dashboard. The project involved creating a seamless customer experience from browsing products to checkout and delivery tracking.\n\nI used Next.js, TailwindCSS, Framer Motion, and Stripe to create the website and the payment system.',
        technologies: ['Next.js', 'TailwindCSS', 'Framer Motion', 'Stripe'],
        link: 'https://dextopmodels.com'
    },
    'hobbies': {
        title: 'Hobbies',
        date: '2020 - 2024',
        shortDesc: 'An Milling, Engraving, and Laser company, where I worked on the automation of certain processes.',
        fullDesc: 'At Nijdeken, I was responsible for automating various processes in this Milling, Engraving, and Laser company.\n\nI created custom software solutions to streamline their production workflow and improve efficiency. The automation resulted in a 30% reduction in processing time and significantly improved quality control.',
        technologies: ['React', 'Node.js', 'Express', 'SQL', 'Automation'],
        link: 'https://nijdeken.nl'
    },
    'achievements': {
        title: 'Achievements & Awards',
        date: '2024 - 11',
        shortDesc: 'Some of my comitments and acheivements that are worth sharing',
        fullDesc: 'Waterpolo\n\nI worked on the marketing, website and dashboard. The project involved creating a seamless customer experience from browsing products to checkout and delivery tracking.\n\nI used Next.js, TailwindCSS, Framer Motion, and Stripe to create the website and the payment system.',
        technologies: ['Next.js', 'TailwindCSS', 'Framer Motion', 'Stripe'],
        link: 'https://dextopmodels.com'
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
    popupDate.textContent = project.date;
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
}

function closeProjectPopup() {
    const overlay = document.getElementById('popup-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function() {
    setupProjectCards();
    
    const overlay = document.getElementById('popup-overlay');
    const popup = overlay.querySelector('.project-popup');
    
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
        document.querySelector('.sections'),
        document.querySelector('.styled-divider'),
        document.querySelector('.about'),
        document.querySelector('.footer-form'),
        document.querySelector('.footer')
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
