const fs = require('fs');
const file = 'dashboard.html';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\r\n/g, '\n');
    
    // Add CSS
    const cssTarget = `    @media(max-width:768px) {\n      .sidebar {\n        transform: translateX(-100%);\n      }`;
    const cssReplacement = `    .hamburger {\n      display: none;\n      font-size: 1.8rem;\n      cursor: pointer;\n      color: var(--ink);\n    }\n    @media(max-width:768px) {\n      .hamburger {\n        display: block;\n      }\n      .sidebar {\n        transform: translateX(-100%);\n        transition: transform 0.3s ease;\n        z-index: 999;\n      }\n      .sidebar.open {\n        transform: translateX(0);\n      }`;
      
    if (!content.includes('.hamburger {') && content.includes(cssTarget)) {
        content = content.replace(cssTarget, cssReplacement);
    }
    
    // Add JS function
    const jsTarget = `  <script type="module">`;
    const jsReplacement = `  <script>\n    function toggleSidebar() {\n      const sidebar = document.querySelector('.sidebar');\n      if (sidebar) sidebar.classList.toggle('open');\n    }\n    \n    // Close sidebar when clicking a nav item on mobile\n    document.addEventListener('DOMContentLoaded', () => {\n        document.querySelectorAll('.nav-item').forEach(item => {\n            item.addEventListener('click', () => {\n                if (window.innerWidth <= 768) {\n                    document.querySelector('.sidebar').classList.remove('open');\n                }\n            });\n        });\n    });\n  </script>\n  <script type="module">`;
  
    if (!content.includes('toggleSidebar() {')) {
        content = content.replace(jsTarget, jsReplacement);
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log("Successfully injected CSS and JS.");
}
