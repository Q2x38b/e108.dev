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
        date: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M6 9a6 6 0 1 0 12 0A6 6 0 1 0 6 9"/><path d="m12 15l3.4 5.89l1.598-3.233l3.598.232l-3.4-5.889M6.802 12l-3.4 5.89L7 17.657l1.598 3.232l3.4-5.889"/></g></svg>',
        fullDesc: 'Throughout my academic career, I have been recognized for excellence across athletics, academics, and leadership. In water polo, I earned a varsity letter in 2023, contributed to a UIL state championship victory, and was honored as an All-State team goalie. I further advanced my athletic career by representing the Southwest Zone as the national team goalie on the Olympic Development team.\n\nMy passion for science and innovation is highlighted by leading my middle school rocket club to a top 25 finish at the American Rocketry Challenge in Virginia (2022). I also placed 1st in my division at the district science fair advancing to the Houston science fair.\n\nIn boy scouts, I have demonstrated strong leadership by serving as Troop 554s Senior Patrol Leader, where I led over 40 scouts. My commitment to leadership development was further solidified through participation in a week-long National Youth Leadership Training (NYLT) course in December 2022 and by being elected into the Scouts BSA Order of the Arrow Program in 2022. I have also been actively involved in the PALs program, continually enhancing my leadership skills and community engagement.\n\nThis diverse array of awards and achievements reflects my dedication, teamwork, and leadership in every endeavor.',
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
    
    // Update this line to handle HTML content for the date
    // Check if the date contains an SVG (contains HTML tags)
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

window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    const blurElement = document.querySelector('.sticky-blur');
    
    // Maximum scroll position to consider (adjust as needed)
    const maxScroll = 300;
    
    // Calculate blur intensity (start strong at 20px and decrease to 5px)
    let blurValue = 20;
    
    if (scrollPosition <= maxScroll) {
        // Linear decrease from 20px to 5px as user scrolls
        blurValue = 20 - (scrollPosition / maxScroll) * 15;
        
        // Apply the calculated blur
        blurElement.style.backdropFilter = `blur(${blurValue}px)`;
        blurElement.style.webkitBackdropFilter = `blur(${blurValue}px)`;
    }
});
