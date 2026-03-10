document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('review-modal-overlay');
  const modalText = document.getElementById('modal-text');
  const modalFooter = document.getElementById('modal-footer');
  const modalClose = document.getElementById('modal-close');

  function openModal(cardEl) {
    const fullId = cardEl.dataset.full;
    const fullEl = document.getElementById(fullId);
    if (!fullEl) return;

    const para = fullEl.querySelector('p');
    const footer = fullEl.querySelector('footer');

    modalText.textContent = para ? para.textContent : '';
    if (footer) {
      const name = footer.dataset.name || '';
      const location = footer.dataset.location || '';
      const avatar = footer.dataset.avatar || '?';
      modalFooter.innerHTML = `
        <div class="review-avatar">${avatar}</div>
        <div>
          <div class="review-name">${name}</div>
          <div class="review-location">${location}</div>
        </div>
      `;
    }

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.review-card').forEach((card) => {
    card.addEventListener('click', () => openModal(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(card);
      }
    });
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Read full review');
  });

  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
});
