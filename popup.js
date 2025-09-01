const sitemapUrl = "https://store.vlinq.co/sitemap.xml";
const fetchBtn = document.getElementById('fetchBtn');
const urlList = document.getElementById('urlList');
const searchInput = document.getElementById('searchInput');
const totalCount = document.getElementById('totalCount');
let allUrls = [];
let filteredUrls = [];
let currentlyDisplayed = 0;
const ITEMS_PER_BATCH = 100; // Load 100 items at a time

function parseXmlAndGetLocs(xml) {
  let locEls = Array.from(xml.getElementsByTagName('loc'));
  if (!locEls.length) {
    locEls = Array.from(xml.getElementsByTagNameNS('*', 'loc'));
  }
  return locEls.map(el => el.textContent.trim()).filter(Boolean);
}

async function fetchSitemap() {
  try {
    fetchBtn.textContent = 'Fetching...';
    fetchBtn.disabled = true;
    
    const res = await fetch(sitemapUrl);
    if (!res.ok) throw new Error('Network response was not OK: ' + res.status);
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('Failed to parse XML.');
    allUrls = parseXmlAndGetLocs(xml);
    filteredUrls = [...allUrls];
    currentlyDisplayed = 0;
    renderUrls(true); // true means reset the list
    updateTotalCount(allUrls.length);
  } catch (err) {
    console.error(err);
    alert('Failed to fetch sitemap: ' + (err.message || err));
  } finally {
    fetchBtn.textContent = 'Fetch vlinq Stores';
    fetchBtn.disabled = false;
  }
}

function renderUrls(reset = false) {
  if (reset) {
    urlList.innerHTML = '';
    currentlyDisplayed = 0;
  }
  
  if (filteredUrls.length === 0) {
    urlList.innerHTML = '';
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = allUrls.length === 0 ? 'Click "Fetch vlinq Stores" to load URLs' : 'No URLs match your search';
    urlList.appendChild(li);
    return;
  }
  
  const endIndex = Math.min(currentlyDisplayed + ITEMS_PER_BATCH, filteredUrls.length);
  const urlsToRender = filteredUrls.slice(currentlyDisplayed, endIndex);
  
  urlsToRender.forEach(url => {
    const li = document.createElement('li');
    li.className = 'url-item';
    
    const urlContainer = document.createElement('div');
    urlContainer.className = 'url-container';
    
    const urlText = document.createElement('div');
    urlText.className = 'url-text';
    urlText.textContent = url;
    urlText.title = url;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '📋';
    copyBtn.title = 'Copy URL';
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(url);
      copyBtn.innerHTML = '✓';
      setTimeout(() => copyBtn.innerHTML = '📋', 1000);
    });
    
    urlContainer.appendChild(urlText);
    urlContainer.appendChild(copyBtn);
    
    urlContainer.addEventListener('click', () => {
      chrome.tabs.create({ url: url });
    });
    
    li.appendChild(urlContainer);
    urlList.appendChild(li);
  });
  
  currentlyDisplayed = endIndex;
  
  // Remove any existing load more button
  const existingLoadMore = urlList.querySelector('.load-more-btn');
  if (existingLoadMore) {
    existingLoadMore.remove();
  }
  
  // Add load more button if there are more items
  if (currentlyDisplayed < filteredUrls.length) {
    const loadMoreLi = document.createElement('li');
    loadMoreLi.className = 'load-more-container';
    
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.className = 'load-more-btn';
    loadMoreBtn.textContent = `Load More (${filteredUrls.length - currentlyDisplayed} remaining)`;
    loadMoreBtn.addEventListener('click', () => renderUrls(false));
    
    loadMoreLi.appendChild(loadMoreBtn);
    urlList.appendChild(loadMoreLi);
  }
}

function updateTotalCount(count) {
  totalCount.textContent = `Total URLs: ${count}`;
}

fetchBtn.addEventListener('click', fetchSitemap);

searchInput.addEventListener('input', () => {
  const term = searchInput.value.toLowerCase();
  filteredUrls = allUrls.filter(u => u.toLowerCase().includes(term));
  currentlyDisplayed = 0;
  renderUrls(true); // Reset and render filtered results
});
