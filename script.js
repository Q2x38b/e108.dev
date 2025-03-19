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

fetch('https://api.github.com/repos/Q2x38b/e108.dev/commits?per_page=1')
  .then(response => response.json())
  .then(data => {
    // Extract the SHA from the first element in the returned array
    const latestCommitSHA = data[0].sha;
    // Optionally, shorten the commit for display (common practice is to show the first 7 characters)
    const shortSHA = latestCommitSHA.substring(0, 7);
    // Display it in an element with id 'commit'
    document.getElementById('commit').textContent = shortSHA;
  })
  .catch(error => console.error('Error fetching commit:', error));

// Spotlight Search Component
document.addEventListener('DOMContentLoaded', () => {
    initSpotlightSearch();
});

function initSpotlightSearch() {
    const spotlightContainer = document.getElementById('spotlight-search');
    const spotlightInput = document.getElementById('spotlight-input');
    const spotlightLinks = document.getElementById('spotlight-links');
    const spotlightPages = document.getElementById('spotlight-pages');
    const spotlightSections = document.getElementById('spotlight-sections');
    
    // Define searchable items
    const searchableItems = [
        // Links
        { type: 'link', title: 'Email', description: 'Send me an email', url: 'mailto:ethanjerla08@gmail.com', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>' },
        { type: 'link', title: 'Resume', description: 'Download my resume', url: 'https://e108.dev/resume.pdf', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>' },
        { type: 'link', title: 'Projects', description: 'View my projects', url: 'https://e108.dev/links', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" stroke-width=".5"><path fill="currentColor" stroke="currentColor" d="M8.465 11.293c1.133-1.133 3.109-1.133 4.242 0l.707.707l1.414-1.414l-.707-.707c-.943-.944-2.199-1.465-3.535-1.465s-2.592.521-3.535 1.465L4.929 12a5.01 5.01 0 0 0 0 7.071a4.98 4.98 0 0 0 3.535 1.462A4.98 4.98 0 0 0 12 19.071l.707-.707l-1.414-1.414l-.707.707a3.007 3.007 0 0 1-4.243 0a3.005 3.005 0 0 1 0-4.243z"/><path fill="currentColor" stroke="currentColor" d="m12 4.929l-.707.707l1.414 1.414l.707-.707a3.007 3.007 0 0 1 4.243 0a3.005 3.005 0 0 1 0 4.243l-2.122 2.121c-1.133 1.133-3.109 1.133-4.242 0L10.586 12l-1.414 1.414l.707.707c.943.944 2.199 1.465 3.535 1.465s2.592-.521 3.535-1.465L19.071 12a5.01 5.01 0 0 0 0-7.071a5.006 5.006 0 0 0-7.071 0"/></svg>' },
        { type: 'link', title: 'Blog', description: 'Read my blog posts', url: 'https://e108.dev/blog', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4M2 6h4m-4 4h4m-4 4h4m-4 4h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/></g></svg>' },
        { type: 'link', title: 'GitHub', description: 'View my GitHub profile', url: 'https://github.com/Q2x38b', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>' },
        
        // Pages
        { type: 'page', title: 'Home', description: 'Return to homepage', url: 'https://e108.dev/', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>' },
        { type: 'page', title: 'Links', description: 'All my important links', url: 'https://e108.dev/links', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7h2"></path><path d="M15 7h2a5 5 0 1 1 0 10h-2"></path><line x1="8" x2="16" y1="12" y2="12"></line></svg>' },
        
        // Sections
        { type: 'section', title: 'My Work', description: 'View my projects section', url: '#my-work', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>' },
        { type: 'section', title: 'Extracurriculars', description: 'Sports, clubs, and organizations', url: '#extracurriculars', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><rect x="9" y="9" width="6" height="6"></rect></svg>' },
        { type: 'section', title: 'Hobbies', description: 'My favorite hobbies', url: '#hobbies', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>' },
        { type: 'section', title: 'Achievements', description: 'My achievements and awards', url: '#achievements', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>' },
        { type: 'section', title: 'About Me', description: 'Learn more about me', url: '#about-me', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path></svg>' },
        { type: 'section', title: 'Contact', description: 'Get in touch with me', url: '#contact', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>' }
    ];
    
    // Track selected item index
    let selectedIndex = -1;
    let filteredItems = [];
    
    // Toggle spotlight with keyboard shortcut (Cmd+K or Ctrl+K)
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            toggleSpotlight();
        }
        
        // Close with Escape key
        if (e.key === 'Escape' && spotlightContainer.classList.contains('active')) {
            closeSpotlight();
        }
        
        // Navigate with arrow keys
        if (spotlightContainer.classList.contains('active')) {
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
        }
    });
    
    // Close when clicking outside
    spotlightContainer.querySelector('.spotlight-backdrop').addEventListener('click', closeSpotlight);
    
    // Search input handler
    spotlightInput.addEventListener('input', () => {
        const query = spotlightInput.value.toLowerCase().trim();
        filterResults(query);
    });
    
    function toggleSpotlight() {
        if (spotlightContainer.classList.contains('active')) {
            closeSpotlight();
        } else {
            openSpotlight();
        }
    }
    
    function openSpotlight() {
        spotlightContainer.style.display = 'block';
        // Add this line to prevent body scrolling
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
            // Add this line to restore body scrolling
            document.body.style.overflow = '';
        }, 300);
    }
    
    function filterResults(query) {
        // Clear previous results
        spotlightLinks.innerHTML = '';
        spotlightPages.innerHTML = '';
        spotlightSections.innerHTML = '';
        
        // Reset selection
        selectedIndex = -1;
        
        // If query is empty, show all items
        if (!query) {
            filteredItems = [...searchableItems];
        } else {
            // Filter items based on query
            filteredItems = searchableItems.filter(item => 
                item.title.toLowerCase().includes(query) || 
                item.description.toLowerCase().includes(query)
            );
        }
        
        // Group by type
        const links = filteredItems.filter(item => item.type === 'link');
        const pages = filteredItems.filter(item => item.type === 'page');
        const sections = filteredItems.filter(item => item.type === 'section');
        
        // Render results
        renderResults(links, spotlightLinks);
        renderResults(pages, spotlightPages);
        renderResults(sections, spotlightSections);
        
        // Show no results message if needed
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
            const resultItem = document.createElement('div');
            resultItem.className = 'spotlight-result-item';
            resultItem.dataset.url = item.url;
            
            resultItem.innerHTML = `
                <div class="spotlight-result-icon">${item.icon}</div>
                <div class="spotlight-result-content">
                    <div class="spotlight-result-title">${item.title}</div>
                    <div class="spotlight-result-description">${item.description}</div>
                </div>
            `;
            
            resultItem.addEventListener('click', () => selectResult(item));
            container.appendChild(resultItem);
        });
    }
    
    function navigateResults(direction) {
        // Remove current selection
        const items = document.querySelectorAll('.spotlight-result-item');
        items.forEach(item => item.classList.remove('selected'));
        
        // Update selected index
        selectedIndex += direction;
        
        // Loop around if needed
        if (selectedIndex < 0) selectedIndex = filteredItems.length - 1;
        if (selectedIndex >= filteredItems.length) selectedIndex = 0;
        
        // Add selected class to current item
        if (selectedIndex >= 0 && selectedIndex < items.length) {
            items[selectedIndex].classList.add('selected');
            // Scroll into view if needed
            items[selectedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    function selectResult(item) {
        closeSpotlight();
        
        // Handle different item types
        if (item.url.startsWith('#')) {
            // Scroll to section
            const element = document.querySelector(item.url) || 
                           document.querySelector(`[data-project-id="${item.url.substring(1)}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // Navigate to URL
            window.location.href = item.url;
        }
    }
    
    // Add a button to trigger the spotlight search
    const spotlightButton = document.createElement('button');
    spotlightButton.className = 'spotlight-trigger';
    spotlightButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span class="spotlight-trigger-text">Search</span>
        <span class="spotlight-trigger-shortcut">
            <kbd>${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} K</kbd>
        </span>
    `;
    
    spotlightButton.addEventListener('click', toggleSpotlight);
    
    // Insert button in the header
    const header = document.querySelector('.header-right');
    if (header) {
        header.insertBefore(spotlightButton, header.firstChild);
    }

    document.querySelector('.spotlight-results').addEventListener('wheel', (e) => {
        e.stopPropagation();
    });
}
