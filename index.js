// ==========================================
// CONFIGURATION SUPABASE & INITIALISATION SÉCURISÉE
// ==========================================
const SUPABASE_URL = 'https://ucjhxdgrdzfmlvuzoocn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjamh4ZGdyZHpmbWx2dXpvb2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2ODAxMTAsImV4cCI6MjEwNTI1NjExMH0.I2TUv1H00mT40q8emMqWHtGifLmMWz0OyXBEYyhw_Cg';

// Initialisation sécurisée pour éviter tout blocage silencieux
let supabaseClient = null;
try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error("Le SDK Supabase n'est pas chargé.");
    }
} catch (e) {
    console.error("Erreur lors de l'initialisation de Supabase :", e);
}

// APPLICATION DIRECTE DU NOM PRÉCHARGÉ (Élimine tout délai visuel)
(function() {
    const userDataStr = localStorage.getItem('artizpro_user');
    const typeCompte = localStorage.getItem('artizpro_type');
    const lienConnexion = document.querySelector('a[href="connexion.html"]');
    
    if (userDataStr && lienConnexion) {
        try {
            const user = window.__preloadedUser || JSON.parse(userDataStr);
            lienConnexion.innerHTML = `<i class="fa-solid fa-user-check"></i> ${user.nom_entreprise || 'Mon Espace'}`;
            
            if (typeCompte === 'Pro') {
                lienConnexion.setAttribute('href', 'clientproconnexion.html');
            } else {
                lienConnexion.setAttribute('href', 'clientconnexion.html');
            }
            
            lienConnexion.style.color = 'var(--primary)';
            lienConnexion.style.fontWeight = 'bold';
        } catch(e) {}
    }
})();

// Injection des styles CSS pour l'effet lumineux (glow) du badge Vedette
(function() {
    const styleId = 'vedette-glow-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            @keyframes effetLumineux {
                0% { box-shadow: 0 0 5px rgba(37, 99, 235, 0.4), 0 0 10px rgba(37, 99, 235, 0.2); }
                50% { box-shadow: 0 0 15px rgba(37, 99, 235, 0.9), 0 0 25px rgba(37, 99, 235, 0.6); }
                100% { box-shadow: 0 0 5px rgba(37, 99, 235, 0.4), 0 0 10px rgba(37, 99, 235, 0.2); }
            }
            .badge-vedette-lumineux {
                animation: effetLumineux 2s infinite ease-in-out;
            }
        `;
        document.head.appendChild(style);
    }
})();

document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================
    // 1. GESTION DU MENU MOBILE RESPONSIVE
    // ==========================================
    const menuBtn = document.getElementById('menuBtn');
    const navMenu = document.getElementById('navMenu');

    if (menuBtn && navMenu) {
        menuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = menuBtn.querySelector('i');
            if (navMenu.classList.contains('active')) {
                if (icon) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-xmark');
                }
            } else {
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            }
        });

        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = menuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    // ==========================================
    // 2. AUTOCOMPLÉTION INTELLIGENTE (TABLE MÉTIERS)
    // ==========================================
    const searchInput = document.getElementById('searchInput');
    const suggestionsBox = document.getElementById('suggestionsBox');

    if (searchInput && suggestionsBox && supabaseClient) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();

            if (query.length < 1) { 
                suggestionsBox.style.display = 'none';
                suggestionsBox.innerHTML = '';
                return;
            }

            try {
                const { data: metiers, error } = await supabaseClient
                    .from('metiers')
                    .select('nom, categorie')
                    .or(`nom.ilike.%${query}%,categorie.ilike.%${query}%`)
                    .limit(6);

                if (error || !metiers || metiers.length === 0) {
                    suggestionsBox.style.display = 'none';
                    suggestionsBox.innerHTML = '';
                    return;
                }

                suggestionsBox.innerHTML = '';
                metiers.forEach(item => {
                    const div = document.createElement('div');
                    div.style.padding = '12px 16px';
                    div.style.cursor = 'pointer';
                    div.style.borderBottom = '1px solid #F1F5F9';
                    div.style.color = '#1E293B';
                    div.style.fontSize = '0.95rem';
                    div.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span><i class="fa-solid fa-hammer" style="color: var(--primary); margin-right: 8px;"></i> <strong>${item.nom}</strong></span>
                            <span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">${item.categorie}</span>
                        </div>
                    `;
                    
                    div.addEventListener('mouseover', () => { div.style.backgroundColor = '#F8FAFC'; });
                    div.addEventListener('mouseout', () => { div.style.backgroundColor = 'white'; });

                    div.addEventListener('click', () => {
                        searchInput.value = item.nom;
                        suggestionsBox.style.display = 'none';
                        lancerRecherche();
                    });

                    suggestionsBox.appendChild(div);
                });

                suggestionsBox.style.display = 'block';
            } catch (err) {
                console.error("Erreur lors de la recherche intelligente :", err);
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
                suggestionsBox.style.display = 'none';
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                lancerRecherche();
            }
        });
    }

    // ==========================================
    // 3. CHARGEMENT INSTANTANÉ & TEMPS RÉEL DES TALENTS EN VEDETTE
    // ==========================================
    const grid = document.getElementById('verifiedProsGrid');

    function afficherTalents(prestataires) {
        if (!grid) return;
        if (!prestataires || prestataires.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">Aucun talent en vedette pour le moment.</p>';
            return;
        }

        grid.innerHTML = '';
        
        const listeAffichee = prestataires.length > 1 ? [...prestataires, ...prestataires] : prestataires;

        listeAffichee.forEach((p, index) => {
            const card = document.createElement('div');
            card.className = 'talent-promo-card'; 
            card.setAttribute('data-original-index', index % prestataires.length);

            const photoUrl = p.photo_url || p['photo-url'];
            const avatarHtml = photoUrl 
                ? `<img src="${photoUrl}" alt="${p.nom_entreprise}" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary); flex-shrink: 0;">`
                : `<div style="width: 55px; height: 55px; border-radius: 50%; background: #e0f2fe; color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0;"><i class="fa-solid fa-user"></i></div>`;

            card.innerHTML = `
                ${avatarHtml}
                <div style="flex-grow: 1; overflow: hidden;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                        <h3 style="font-size: 1.05rem; color: var(--dark); margin: 0; display: flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${p.nom_entreprise || 'Prestataire'} 
                            <i class="fa-solid fa-circle-check" style="color: #2563EB; font-size: 0.85rem;" title="Vérifié Pro"></i>
                        </h3>
                    </div>
                    <p style="color: var(--primary); font-weight: 600; font-size: 0.9rem; margin: 0 0 2px 0;">
                        ${p.specialite || 'Spécialité non spécifiée'}
                    </p>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px;">
                        <p style="color: #64748b; font-size: 0.82rem; margin: 0;">
                            <i class="fa-solid fa-location-dot" style="font-size: 0.75rem; margin-right: 3px;"></i> ${p.ville || 'Tunisie'}
                        </p>
                        <!-- Badge VEDETTE en bas avec effet lumineux -->
                        <span class="badge-vedette-lumineux" style="background: var(--primary); color: white; font-size: 0.65rem; padding: 3px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Vedette</span>
                    </div>
                </div>
                <div onclick="event.stopPropagation()">
                    <a href="tel:${p.telephone}" title="Appeler" style="background: #f0fdf4; color: #16a34a; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; flex-shrink: 0; border: 1px solid #bbf7d0;">
                        <i class="fa-solid fa-phone" style="font-size: 0.9rem;"></i>
                    </a>
                </div>
            `;

            card.addEventListener('click', () => {
                window.location.href = `profil-prestataire.html?id=${p.id}&table=verifie`;
            });

            grid.appendChild(card);
        });

        creerIndicateursPoints(prestataires.length);
    }

    if (window.__preloadedTalents) {
        afficherTalents(window.__preloadedTalents);
    }

    async function chargerTalentsVedetteSilencieux() {
        if (!grid || !supabaseClient) return;
        try {
            const { data: prestataires, error } = await supabaseClient
                .from('prestatairesverifie')
                .select('*')
                .eq('en_vedette', true) 
                .order('id', { ascending: false })
                .limit(4);

            if (error) throw error;
            
            if (prestataires) {
                localStorage.setItem('artizpro_talents_vedette', JSON.stringify(prestataires));
                afficherTalents(prestataires);
            }
        } catch (err) {
            console.error("Erreur de synchronisation des talents :", err);
        }
    }

    await chargerTalentsVedetteSilencieux();

    if (supabaseClient) {
        supabaseClient
            .channel('public:prestatairesverifie')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'prestatairesverifie' }, payload => {
                chargerTalentsVedetteSilencieux();
            })
            .subscribe();
    }
});

// ==========================================
// 4. FONCTION DE REDIRECTION / RECHERCHE
// ==========================================
function lancerRecherche() {
    const searchInput = document.getElementById('searchInput');
    const metierRecherche = searchInput ? searchInput.value.trim() : '';
    window.location.href = `metiers.html?q=${encodeURIComponent(metierRecherche)}`;
}

// ==========================================
// 5. GESTION DES POINTS INDICATEURS ET DÉFILEMENT CIRCULAIRE MANUEL
// ==========================================

function creerIndicateursPoints(nombreTalents) {
    let wrapper = document.querySelector('.featured-slider-wrapper');
    if (!wrapper) return;

    let ancienDots = document.getElementById('sliderDotsContainer');
    if (ancienDots) ancienDots.remove();

    if (nombreTalents <= 1) return;

    const dotsContainer = document.createElement('div');
    dotsContainer.id = 'sliderDotsContainer';
    dotsContainer.style.display = 'flex';
    dotsContainer.style.justifyContent = 'center';
    dotsContainer.style.gap = '8px';
    dotsContainer.style.marginTop = '15px';

    for (let i = 0; i < nombreTalents; i++) {
        const dot = document.createElement('button');
        dot.className = 'slider-dot';
        dot.setAttribute('data-index', i);
        dot.style.width = i === 0 ? '24px' : '8px';
        dot.style.height = '8px';
        dot.style.borderRadius = '4px';
        dot.style.border = 'none';
        dot.style.backgroundColor = i === 0 ? 'var(--primary)' : '#cbd5e1';
        dot.style.cursor = 'pointer';
        dot.style.transition = 'all 0.3s ease';
        dot.setAttribute('aria-label', `Aller au talent ${i + 1}`);

        dot.addEventListener('click', () => {
            const container = document.getElementById('verifiedProsGrid');
            if (!container) return;
            const card = container.querySelector('.talent-promo-card');
            if (!card) return;
            const scrollStep = card.offsetWidth + 20;

            container.scrollTo({ left: scrollStep * i, behavior: 'smooth' });
            mettreAJourPoints(i);
        });

        dotsContainer.appendChild(dot);
    }

    wrapper.appendChild(dotsContainer);

    const container = document.getElementById('verifiedProsGrid');
    if (container) {
        container.addEventListener('scroll', () => {
            const card = container.querySelector('.talent-promo-card');
            if (!card) return;
            const scrollStep = card.offsetWidth + 20;
            const indexActuel = Math.round(container.scrollLeft / scrollStep) % nombreTalents;
            mettreAJourPoints(indexActuel);
        }, { passive: true });
    }
}

function mettreAJourPoints(activeIndex) {
    const dotsContainer = document.getElementById('sliderDotsContainer');
    if (!dotsContainer) return;
    const dots = dotsContainer.querySelectorAll('.slider-dot');
    dots.forEach((dot, idx) => {
        if (idx === activeIndex) {
            dot.style.width = '24px';
            dot.style.backgroundColor = 'var(--primary)';
        } else {
            dot.style.width = '8px';
            dot.style.backgroundColor = '#cbd5e1';
        }
    });
}

function defilerTalents(direction) {
    const container = document.getElementById('verifiedProsGrid');
    if (!container) return;
    
    const card = container.querySelector('.talent-promo-card');
    if (!card) return;
    const scrollStep = card.offsetWidth + 20;
    
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    if (maxScrollLeft <= 0) return;

    if (direction === 'droite') {
        if (container.scrollLeft >= maxScrollLeft / 2 - 10) {
            container.scrollTo({ left: 0, behavior: 'instant' });
            container.scrollBy({ left: scrollStep, behavior: 'smooth' });
        } else {
            container.scrollBy({ left: scrollStep, behavior: 'smooth' });
        }
    } else { // direction === 'gauche'
        if (container.scrollLeft <= 10) {
            container.scrollTo({ left: maxScrollLeft / 2, behavior: 'instant' });
            container.scrollBy({ left: -scrollStep, behavior: 'smooth' });
        } else {
            container.scrollBy({ left: -scrollStep, behavior: 'smooth' });
        }
    }
}