class FeaturedCollectionMegaMenu {
  constructor(container) {
    this.container = container;
    this.triggers = Array.from(container.querySelectorAll('[data-mega-menu-trigger]'));
    this.panels = Array.from(container.querySelectorAll('[data-mega-menu-panel]'));

    if (!this.triggers.length || !this.panels.length) return;

    this.bindEvents();
    this.activate(this.triggers[0].dataset.megaMenuTrigger);
  }

  bindEvents() {
    this.triggers.forEach((trigger) => {
      trigger.addEventListener('mouseenter', () => this.activate(trigger.dataset.megaMenuTrigger));
      trigger.addEventListener('focus', () => this.activate(trigger.dataset.megaMenuTrigger));
    });
  }

  activate(targetId) {
    this.triggers.forEach((trigger) => {
      trigger.classList.toggle('is-active', trigger.dataset.megaMenuTrigger === targetId);
    });

    this.panels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.megaMenuPanel === targetId);
    });
  }
}

const initFeaturedCollectionMegaMenus = () => {
  document.querySelectorAll('[data-featured-collection-mega-menu]').forEach((container) => {
    if (container.dataset.megaMenuInitialized === 'true') return;
    container.dataset.megaMenuInitialized = 'true';
    new FeaturedCollectionMegaMenu(container);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFeaturedCollectionMegaMenus);
} else {
  initFeaturedCollectionMegaMenus();
}

document.addEventListener('shopify:section:load', initFeaturedCollectionMegaMenus);
