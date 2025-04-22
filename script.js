// Full JS extracted from inline <script>
let candidates = [];
const papCandidatesURL = 'election_data/pap_candidates.json';
const wpCandidatesURL = 'election_data/wp_candidates.json';

fetch(papCandidatesURL)
    .then(response => response.json())
    .then(data => {
        data.candidates.forEach(candidate => {
            candidates.push({
                id: candidate.full_name.toLowerCase().replace(/\s+/g, '-'),
                name: candidate.full_name,
                party: 'PAP',
                branch: candidate.branch,
                age: candidate.age,
                url: candidate.url
            });
        });
        return fetch(wpCandidatesURL);
    })
    .then(response => response.json())
    .then(data => {
        data.candidates.forEach(candidate => {
            candidates.push({
                id: candidate.name.toLowerCase().replace(/\s+/g, '-'),
                name: candidate.name,
                party: 'WP',
                age: candidate.age,
                occupation: candidate.occupation
            });
        });
        populateCandidates();
    })
    .catch(error => console.error('Error loading candidate data:', error));

function populateCandidates(filter = 'all') {
    const candidatesGrid = document.querySelector('.candidates-grid');
    candidatesGrid.innerHTML = '';

    let filteredCandidates = candidates;
    if (filter !== 'all') {
        filteredCandidates = candidates.filter(candidate => {
            if (filter === 'PAP' || filter === 'WP') return candidate.party === filter;
            if (filter === 'GRC') return candidate.branch?.includes('GRC');
            if (filter === 'SMC') return candidate.branch?.includes('SMC');
            return true;
        });
    }

    const displayCount = Math.min(12, filteredCandidates.length);
    for (let i = 0; i < displayCount; i++) {
        addCandidateCard(filteredCandidates[i], candidatesGrid);
    }

    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (filteredCandidates.length > displayCount) {
        loadMoreBtn.style.display = 'inline-block';
        loadMoreBtn.onclick = () => loadMoreCandidates(filteredCandidates, displayCount);
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

function addCandidateCard(candidate, container) {
    const card = document.createElement('div');
    card.className = 'candidate-card';

    let detailsHTML = '';
    if (candidate.party === 'PAP') {
        detailsHTML = `
            <div class="detail-row"><span class="detail-label">Branch:</span>
            <span class="detail-value">${candidate.branch || 'Not specified'}</span></div>`;
    } else {
        detailsHTML = `
            <div class="detail-row"><span class="detail-label">Age:</span>
            <span class="detail-value">${candidate.age || 'Not specified'}</span></div>
            <div class="detail-row"><span class="detail-label">Occupation:</span>
            <span class="detail-value">${candidate.occupation || 'Not specified'}</span></div>`;
    }

    card.innerHTML = `
        <div class="card-image">Candidate Photo Placeholder</div>
        <div class="card-content">
            <h3 class="candidate-name">${candidate.name}</h3>
            <span class="candidate-party party-${candidate.party.toLowerCase()}">${candidate.party}</span>
            <div class="candidate-details">${detailsHTML}</div>
            <a href="#" class="view-more-btn" data-id="${candidate.id}">View Profile</a>
        </div>
    `;

    card.querySelector('.view-more-btn').addEventListener('click', e => {
        e.preventDefault();
        openCandidateModal(candidate.id);
    });

    container.appendChild(card);
}

function loadMoreCandidates(filteredCandidates, currentCount) {
    const candidatesGrid = document.querySelector('.candidates-grid');
    const nextBatch = Math.min(12, filteredCandidates.length - currentCount);
    
    for (let i = currentCount; i < currentCount + nextBatch; i++) {
        addCandidateCard(filteredCandidates[i], candidatesGrid);
    }

    currentCount += nextBatch;
    if (currentCount >= filteredCandidates.length) {
        document.querySelector('.load-more-btn').style.display = 'none';
    } else {
        document.querySelector('.load-more-btn').onclick = () => 
            loadMoreCandidates(filteredCandidates, currentCount);
    }
}
