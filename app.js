var CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4OdhQtnUIDTAw0XfcfpvRzSX5zmL6ZaHT7UMtWWyaJ-aGGIqEfifr_FdJxMHEbaYNtcEj3k7GxIG7/pub?gid=0&single=true&output=csv';

var APOLLO_PUBLICATIONS_URL = 'https://www.apollohospitals.com/academics-research/clinical-research/recognition-of-published-papers';

function parseCSV(text) {
    if (!text || typeof text !== 'string') return [];

    var lines = [];
    var currentLine = [];
    var field = '';
    var inQuotes = false;
    var i = 0;
    var len = text.length;

    while (i < len) {
        var ch = text[i];

        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < len && text[i + 1] === '"') {
                    field += '"';
                    i += 2;
                    continue;
                }
                inQuotes = false;
                i++;
                continue;
            }
            field += ch;
            i++;
        } else {
            if (ch === '"') {
                inQuotes = true;
                i++;
            } else if (ch === ',') {
                currentLine.push(field.trim());
                field = '';
                i++;
            } else if (ch === '\r') {
                if (i + 1 < len && text[i + 1] === '\n') {
                    i++;
                }
                currentLine.push(field.trim());
                if (currentLine.length > 1 || currentLine[0] !== '') {
                    lines.push(currentLine);
                }
                currentLine = [];
                field = '';
                i++;
            } else if (ch === '\n') {
                currentLine.push(field.trim());
                if (currentLine.length > 1 || currentLine[0] !== '') {
                    lines.push(currentLine);
                }
                currentLine = [];
                field = '';
                i++;
            } else {
                field += ch;
                i++;
            }
        }
    }

    currentLine.push(field.trim());
    if (currentLine.length > 1 || currentLine[0] !== '') {
        lines.push(currentLine);
    }

    if (lines.length < 2) return [];

    var headers = lines[0];
    var result = [];

    for (var r = 1; r < lines.length; r++) {
        var row = lines[r];
        if (row.length === 0) continue;
        var obj = {};
        var hasData = false;
        for (var c = 0; c < headers.length; c++) {
            var val = c < row.length ? row[c] : '';
            obj[headers[c]] = val;
            if (val) hasData = true;
        }
        if (hasData) result.push(obj);
    }

    return result;
}

function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(function() {
        toast.classList.remove('show');
    }, 2200);
}

function copyLink(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function() {
            showToast('Link copied to clipboard');
        }).catch(function() {
            fallbackCopy(url);
        });
    } else {
        fallbackCopy(url);
    }
}

function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('Link copied to clipboard');
    } catch (e) {
        showToast('Failed to copy link');
    }
    document.body.removeChild(textarea);
}

function sharePaper(pub) {
    var url = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'view.html?paper=' + encodeURIComponent(pub.id);
    var shareData = {
        title: pub.title,
        text: pub.title + ' - Apollo Hospitals',
        url: url
    };

    if (navigator.share) {
        navigator.share(shareData).catch(function() {});
    } else {
        copyLink(url);
    }
}

function goToApollo() {
    window.location.href = '/apollo-publications/';
}

async function fetchPublications() {
    var response = await fetch(CSV_URL);
    if (!response.ok) {
        throw new Error('HTTP ' + response.status);
    }
    var text = await response.text();
    if (!text || text.trim().length === 0) {
        throw new Error('Empty response from sheet');
    }
    if (text.trim().startsWith('<')) {
        throw new Error('Received HTML instead of CSV');
    }
    var pubs = parseCSV(text);
    if (pubs.length === 0) {
        throw new Error('No rows parsed from CSV');
    }
    return pubs;
}

function svgIcon(name) {
    var icons = {
        link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
        share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
        external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
        file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
        copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
    };
    return icons[name] || '';
}

function renderPublicationCard(pub) {
    var a = document.createElement('a');
    a.href = 'view.html?paper=' + encodeURIComponent(pub.id);
    a.className = 'publication-card';
    a.setAttribute('data-testid', 'card-publication-' + pub.id);

    var title = escapeHtml(pub.title);
    var authors = escapeHtml(pub.authors);
    var journal = escapeHtml(pub.journal || '');
    var year = escapeHtml(pub.year || '');

    a.innerHTML =
        '<h2 class="pub-title">' + title + '</h2>' +
        '<div class="pub-authors">' + authors + '</div>' +
        '<div class="pub-meta">' +
            (journal ? '<span class="pub-journal">' + journal + '</span>' : '') +
            (year ? '<span>' + (journal ? '&middot; ' : '') + year + '</span>' : '') +
        '</div>';

    return a;
}

function renderModal(pub) {
    var title = escapeHtml(pub.title);
    var authors = escapeHtml(pub.authors);
    var journal = escapeHtml(pub.journal || '');
    var year = escapeHtml(pub.year || '');
    var abstractText = escapeHtml(pub.abstractOrNote || '');
    var accessNote = escapeHtml(pub.accessNote || '');

    var paperUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'view.html?paper=' + encodeURIComponent(pub.id);

    var html =
        '<h1 class="modal-title" id="modal-title">' + title + '</h1>' +
        '<div class="modal-authors">' + authors + '</div>' +
        '<div class="modal-meta">' +
            (journal ? '<span class="pub-journal">' + journal + '</span>' : '') +
            (year ? '<span>' + (journal ? '&middot; ' : '') + year + '</span>' : '') +
        '</div>' +
        (abstractText ? '<div class="modal-abstract">' + abstractText + '</div>' : '') +
        (accessNote ? '<div class="modal-access-note">' + accessNote + '</div>' : '') +
        '<div class="modal-actions">';

    if (pub.primaryUrl) {
        html += '<a href="' + escapeHtml(pub.primaryUrl) + '" target="_blank" rel="noopener" class="btn btn-primary" data-testid="link-primary">' + svgIcon('external') + ' View Article</a>';
    }
    if (pub.pdfUrl) {
        html += '<a href="' + escapeHtml(pub.pdfUrl) + '" target="_blank" rel="noopener" class="btn btn-gold" data-testid="link-pdf">' + svgIcon('file') + ' PDF</a>';
    }
    if (pub.pubmedUrl) {
        html += '<a href="' + escapeHtml(pub.pubmedUrl) + '" target="_blank" rel="noopener" class="btn" data-testid="link-pubmed">' + svgIcon('external') + ' PubMed</a>';
    }
    if (pub.doiUrl) {
        html += '<a href="' + escapeHtml(pub.doiUrl) + '" target="_blank" rel="noopener" class="btn" data-testid="link-doi">' + svgIcon('link') + ' DOI</a>';
    }

    html += '<button class="btn" data-testid="button-copy-link" onclick="copyLink(\'' + paperUrl.replace(/'/g, "\\'") + '\')">' + svgIcon('copy') + ' Copy Link</button>';
    html += '<button class="btn" data-testid="button-share" onclick="sharePaper(window.__currentPub)">' + svgIcon('share') + ' Share</button>';

    html += '</div>';

    return html;
}

function showError(opts) {
    var el = document.getElementById('error-state');
    if (!el) return;
    el.style.display = (el.classList.contains('error-fullscreen')) ? 'flex' : 'block';
    el.innerHTML =
        '<span class="error-icon">' + (opts.icon || '') + '</span>' +
        '<h2>' + escapeHtml(opts.title) + '</h2>' +
        '<p>' + escapeHtml(opts.message) + '</p>' +
        (opts.actionHref
            ? '<a href="' + opts.actionHref + '" class="btn" data-testid="' + (opts.actionTestId || 'link-error-action') + '">' + escapeHtml(opts.actionLabel) + '</a>'
            : '') +
        (opts.retryButton
            ? '<button onclick="location.reload()" class="btn" data-testid="button-retry" style="margin-top:8px;">Try Again</button>'
            : '');
    var loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}

function trackVisit(page, paperId) {
    try {
        var body = { page: page };
        if (paperId) body.paperId = paperId;
        fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).catch(function() {});
    } catch (e) {}
}

async function init() {
    var isViewPage = window.location.pathname.indexOf('view.html') !== -1;
    var urlParams = new URLSearchParams(window.location.search);
    var paperId = urlParams.get('paper');

    if (isViewPage) {
        trackVisit('view', paperId || undefined);
    } else {
        trackVisit('index');
    }

    if (isViewPage && !paperId) {
        showError({
            icon: '?',
            title: 'No Paper Selected',
            message: 'No paper ID was provided. Scan a QR code or select a paper from the publications list.',
            actionHref: APOLLO_PUBLICATIONS_URL,
            actionLabel: 'Go to Apollo Publications',
            actionTestId: 'link-apollo'
        });
        return;
    }

    var publications;
    try {
        publications = await fetchPublications();
    } catch (err) {
        showError({
            icon: '!',
            title: 'Unable to Load Publications',
            message: 'Could not fetch data from the publications sheet. Please try again. (' + err.message + ')',
            retryButton: true
        });
        return;
    }

    var loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    if (isViewPage && paperId) {
        var pub = null;
        for (var i = 0; i < publications.length; i++) {
            if (publications[i].id === paperId) {
                pub = publications[i];
                break;
            }
        }

        if (!pub) {
            showError({
                icon: '?',
                title: 'Publication Not Found',
                message: 'No publication with ID "' + paperId + '" was found. The paper may have been removed or the QR code may be outdated.',
                actionHref: APOLLO_PUBLICATIONS_URL,
                actionLabel: 'Go to Apollo Publications',
                actionTestId: 'link-apollo'
            });
            return;
        }

        window.__currentPub = pub;
        document.title = pub.title + ' - Apollo Hospitals';

        if (typeof gtag === 'function') {
            gtag('event', 'view_paper', {
                paper_id: pub.id,
                paper_title: pub.title,
                paper_journal: pub.journal || '',
                paper_year: pub.year || ''
            });
        }

        var overlay = document.getElementById('modal-overlay');
        var modalBody = document.getElementById('modal-body');

        modalBody.innerHTML = renderModal(pub);
        overlay.classList.add('show');

        document.getElementById('close-btn').addEventListener('click', function(e) {
            e.preventDefault();
            goToApollo();
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                goToApollo();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                goToApollo();
            }
        });

    } else {
        var list = document.getElementById('publications-list');

        var renderList = function(pubs) {
            if (!list) return;
            list.innerHTML = '';
            if (pubs.length === 0) {
                list.innerHTML = '<p style="text-align:center;color:var(--muted);padding:60px 0;font-style:italic;">No publications match your search.</p>';
            } else {
                for (var i = 0; i < pubs.length; i++) {
                    list.appendChild(renderPublicationCard(pubs[i]));
                }
            }
        };

        renderList(publications);

        var resultCount = document.getElementById('result-count');
        if (resultCount) {
            resultCount.textContent = publications.length + ' publication' + (publications.length !== 1 ? 's' : '');
        }

        var searchInput = document.getElementById('search-input');
        if (searchInput) {
            var debounceTimer;
            searchInput.addEventListener('input', function(e) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function() {
                    var query = e.target.value.toLowerCase().trim();
                    if (!query) {
                        renderList(publications);
                        if (resultCount) {
                            resultCount.textContent = publications.length + ' publication' + (publications.length !== 1 ? 's' : '');
                        }
                        return;
                    }
                    var terms = query.split(/\s+/);
                    var filtered = publications.filter(function(pub) {
                        var haystack = [pub.title, pub.authors, pub.abstractOrNote, pub.journal, pub.year].join(' ').toLowerCase();
                        for (var t = 0; t < terms.length; t++) {
                            if (haystack.indexOf(terms[t]) === -1) return false;
                        }
                        return true;
                    });
                    renderList(filtered);
                    if (resultCount) {
                        resultCount.textContent = filtered.length + ' of ' + publications.length + ' publication' + (publications.length !== 1 ? 's' : '');
                    }
                }, 150);
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
