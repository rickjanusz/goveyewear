class FeaturedCollectionMegaMenu {
  constructor(container) {
    this.container = container;
    this.wrapper = container.closest('[class*="view-all-wrap"]');
    this.triggers = Array.from(container.querySelectorAll('[data-mega-menu-trigger]'));
    this.panels = Array.from(container.querySelectorAll('[data-mega-menu-panel]'));

    if (!this.triggers.length || !this.panels.length) return;

    this.bindEvents();
    this.activate(this.triggers[0].dataset.megaMenuTrigger);
  }

  bindEvents() {
    if (this.wrapper) {
      this.wrapper.addEventListener('mouseenter', () => this.open());
      this.wrapper.addEventListener('mouseleave', () => this.close());
      this.wrapper.addEventListener('focusin', () => this.open());
      this.wrapper.addEventListener('focusout', (event) => {
        if (!this.wrapper.contains(event.relatedTarget)) {
          this.close();
        }
      });
    }

    this.triggers.forEach((trigger) => {
      trigger.addEventListener('mouseenter', () => {
        this.open();
        this.activate(trigger.dataset.megaMenuTrigger);
      });
      trigger.addEventListener('focus', () => {
        this.open();
        this.activate(trigger.dataset.megaMenuTrigger);
      });
    });
  }

  open() {
    if (this.wrapper) {
      this.wrapper.classList.add('is-open');
    }
  }

  close() {
    if (this.wrapper) {
      this.wrapper.classList.remove('is-open');
    }
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
