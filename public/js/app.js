// Global App Utilities and Role Management

document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkSession();
  setupNavigation(session);
  setupLanguageToggle();
});

async function checkSession() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    
    // Protection logic
    const path = window.location.pathname;
    
    // If not authenticated and trying to access a protected page
    if (!data.authenticated) {
      if (path.includes('admin') || path.includes('cluster') || path.includes('analytics')) {
        window.location.href = '/login-admin.html';
        return null;
      }
      if (path.includes('report')) {
        window.location.href = '/login-citizen.html';
        return null;
      }
      return null; // Public page (index, logins)
    }

    // If authenticated but wrong role
    if (data.user.role !== 'admin' && (path.includes('admin') || path.includes('cluster') || path.includes('analytics'))) {
      window.location.href = '/report.html';
      return null;
    }

    // Render logout button if logged in
    const switcher = document.getElementById('role-switcher');
    if (switcher) {
      switcher.innerHTML = `<span style="margin-right:1rem;">Hi, <strong>${data.user.name}</strong></span> <button id="logout-btn" class="btn btn-secondary text-xs" style="padding: 0.25rem 0.5rem;">Logout</button>`;
      document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
      });
      // Remove the old classes so it doesn't look like a toggle
      switcher.classList.remove('role-switcher');
      switcher.style.display = 'flex';
      switcher.style.alignItems = 'center';
    }
    
    return data;
  } catch (err) {
    console.error('Session check failed', err);
    return null;
  }
}

function setupNavigation(session) {
  const role = session && session.user ? session.user.role : null;
  const navLinks = document.querySelectorAll('nav a');
  
  navLinks.forEach(link => {
    const isForAdmin = link.getAttribute('data-role') === 'admin';
    const isForCitizen = link.getAttribute('data-role') === 'citizen';
    
    // Hide all links if not logged in
    if (!role) {
      link.style.display = 'none';
      return;
    }
    
    if (isForAdmin && role !== 'admin') {
      link.style.display = 'none';
    }
    if (isForCitizen && role !== 'citizen') {
      link.style.display = 'none';
    }
  });
}

function getPriorityBadgeClass(score) {
  if (score >= 90) return 'badge-critical';
  if (score >= 75) return 'badge-high';
  if (score >= 50) return 'badge-medium';
  return 'badge-low';
}

function getPriorityLabel(score) {
  if (score >= 90) return 'CRITICAL';
  if (score >= 75) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
}

function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

window.appUtils = {
  getPriorityBadgeClass,
  getPriorityLabel,
  formatDate
};

function setupLanguageToggle() {
  const script = document.createElement('script');
  script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  document.head.appendChild(script);

  window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
      pageLanguage: 'en',
      includedLanguages: 'en,hi',
      autoDisplay: false
    }, 'google_translate_element');
  };

  const gtDiv = document.createElement('div');
  gtDiv.id = 'google_translate_element';
  gtDiv.style.display = 'none';
  document.body.appendChild(gtDiv);

  const style = document.createElement('style');
  style.innerHTML = `
    body { top: 0 !important; }
    .skiptranslate { display: none !important; }
    #google_translate_element { display: none !important; }
  `;
  document.head.appendChild(style);

  const header = document.querySelector('.header-inner');
  if (header) {
    const btn = document.createElement('button');
    const isHindi = document.cookie.includes('googtrans=/en/hi');
    btn.innerHTML = isHindi ? '🌐 HI' : '🌐 EN';
    btn.style.cssText = 'background: transparent; border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 8px; cursor: pointer; color: var(--text-primary); margin-left: auto; font-weight: bold; font-size: 0.8rem; height: 28px; display: flex; align-items: center;';
    
    btn.addEventListener('click', () => {
      const domain = window.location.hostname;
      if (isHindi) {
        document.cookie = 'googtrans=/en/en; path=/';
        document.cookie = 'googtrans=/en/en; domain=.' + domain + '; path=/';
      } else {
        document.cookie = 'googtrans=/en/hi; path=/';
        document.cookie = 'googtrans=/en/hi; domain=.' + domain + '; path=/';
      }
      window.location.reload();
    });
    
    header.appendChild(btn);
  }
}
