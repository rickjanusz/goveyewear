(() => {
  if (window.__govFeaturedCollectionMegaMenuLoaded) return;
  window.__govFeaturedCollectionMegaMenuLoaded = true;

class FeaturedCollectionMegaMenu {
  constructor(container) {
    this.container = container;
    this.wrapper = container.closest('[class*="view-all-wrap"]');
    this.grid = container.querySelector('[class*="view-all-menu-grid"]');
    this.secondaryMenu = container.querySelector('[data-mega-menu-secondary]');
    this.trigger = this.wrapper ? this.wrapper.querySelector('[data-mega-menu-open]') : null;
    this.shell = container.querySelector('[class*="view-all-menu-shell"]');
    this.triggers = Array.from(container.querySelectorAll('[data-mega-menu-trigger]'));
    this.panels = Array.from(container.querySelectorAll('[data-mega-menu-panel]'));
    this.stages = Array.from(container.querySelectorAll('[data-mega-menu-stage]'));
    this.backButtons = Array.from(container.querySelectorAll('[data-mega-menu-back]'));
    this.titleElement = container.querySelector('[data-mega-menu-title]');
    this.defaultTitle = this.titleElement ? this.titleElement.textContent.trim() : 'Shop';
    this.closeButton = container.querySelector('[data-mega-menu-close]');
    this.breadcrumb = {
      backBrands: container.querySelector('[data-mega-menu-back="brands"]'),
      backFrames: container.querySelector('[data-mega-menu-back="frames"]'),
      brandLabel: container.querySelector('[data-mega-menu-crumb-current="brand"]'),
      framesLabel: container.querySelector('[data-mega-menu-crumb-current="frames"]'),
      sepBrands: container.querySelector('[data-mega-menu-crumb-sep="brands"]'),
      sepFrames: container.querySelector('[data-mega-menu-crumb-sep="frames"]'),
    };
    this.activeBrandKey = null;
    this.activeBrandTitle = '';
    this.currentChromeTitle = this.defaultTitle;
    this.transitionToken = 0;
    this._hoverTimer = null;
    this.hasBrands = this.stages.some((stage) => stage.dataset.megaMenuStage === 'brands');
    this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
    this.handleTriggerEnter = this.handleTriggerEnter.bind(this);
    this.handleTriggerLeave = this.handleTriggerLeave.bind(this);
    this.handleTriggerClick = this.handleTriggerClick.bind(this);

    if (!this.wrapper || !this.trigger || !this.triggers.length) return;

    this.mountToBody();
    this.bindEvents();
    this.activate(this.triggers[0].dataset.megaMenuTrigger);
    if (this.hasBrands) {
      this.showBrands({ immediate: true });
    } else {
      this.showFrames({ immediate: true });
    }
  }

  mountToBody() {
    if (this.container.parentElement !== document.body) {
      document.body.appendChild(this.container);
    }
  }

  bindEvents() {
    this.trigger.addEventListener('mouseenter', this.handleTriggerEnter);
    this.trigger.addEventListener('mouseleave', this.handleTriggerLeave);
    this.trigger.addEventListener('focus', this.handleTriggerEnter);
    this.trigger.addEventListener('blur', this.handleTriggerLeave);
    this.trigger.addEventListener('click', this.handleTriggerClick);

    this.triggers.forEach((trigger) => {
      trigger.addEventListener('mouseenter', () => {
        this.activate(trigger.dataset.megaMenuTrigger);
      });
      trigger.addEventListener('focus', () => {
        this.activate(trigger.dataset.megaMenuTrigger);
      });
      trigger.addEventListener('click', (event) => {
        const nextStage = trigger.dataset.megaMenuNext;
        if (nextStage === 'frames') {
          event.preventDefault();
          this.showFrames(trigger.dataset.megaMenuTrigger, trigger.textContent.trim());
          return;
        }
        if (nextStage === 'versions' || nextStage === 'content') {
          event.preventDefault();
          this.showVersions(trigger.dataset.megaMenuTrigger, trigger.textContent.trim());
          return;
        }
        if (this.hasBrands) return;
        event.preventDefault();
        this.showVersions(trigger.dataset.megaMenuTrigger);
      });
    });

    this.backButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const target = button.dataset.megaMenuBack;
        if (target === 'brands') {
          this.showBrands();
          return;
        }
        if (target === 'frames') {
          this.showFrames(this.activeBrandKey, this.activeBrandTitle, { immediate: true });
          return;
        }
        this.showFrames();
      });
    });

    if (this.hasBrands && this.breadcrumb.brandLabel) {
      this.breadcrumb.brandLabel.addEventListener('click', () => {
        if (!this.activeBrandKey) return;
        this.showFrames(this.activeBrandKey, this.activeBrandTitle, { immediate: true });
      });
    }

    if (this.closeButton) {
      this.closeButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      });
    }
  }

  handleTriggerEnter(event) {
    if (event.type === 'mouseenter' && window.innerWidth < 990) return;
    // Start the fill animation
    this.trigger.classList.add('is-charging');
    // Auto-open after 1 second if hover is sustained
    this._hoverTimer = window.setTimeout(() => {
      this._hoverTimer = null;
      this.trigger.classList.remove('is-charging');
      this.open();
    }, 1000);
  }

  handleTriggerLeave(event) {
    // Cancel the pending open and reset the fill animation
    if (this._hoverTimer !== null) {
      clearTimeout(this._hoverTimer);
      this._hoverTimer = null;
    }
    // Force animation restart on next hover by removing and re-triggering
    this.trigger.classList.remove('is-charging');
  }

  handleTriggerClick(event) {
    event.preventDefault();
    // Cancel any pending hover-open and clear the fill animation
    if (this._hoverTimer !== null) {
      clearTimeout(this._hoverTimer);
      this._hoverTimer = null;
    }
    this.trigger.classList.remove('is-charging');
    this.open();
  }

  handleDocumentKeydown(event) {
    if (event.key === 'Escape' && this.wrapper.classList.contains('is-open')) {
      this.close();
    }
  }

  open() {
    this.wrapper.classList.add('is-open');
    this.container.classList.add('is-open');
    document.body.classList.add('overflow-hidden');
    document.addEventListener('keydown', this.handleDocumentKeydown);
  }

  close() {
    this.wrapper.classList.remove('is-open');
    this.container.classList.remove('is-open');
    document.body.classList.remove('overflow-hidden');
    document.removeEventListener('keydown', this.handleDocumentKeydown);
    if (this.hasBrands) {
      this.showBrands({ immediate: true });
    } else {
      this.showFrames({ immediate: true });
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

  showBrands(options = {}) {
    this.updateChrome({ showBack: 'none', title: this.defaultTitle });
    this.transitionToStage('brands', options);
  }

  showFrames(targetId, title, options = {}) {
    const targetStage = targetId ? this.resolveStage(targetId) : null;

    if (this.hasBrands && targetId) {
      this.activeBrandKey = targetId;
      this.activeBrandTitle = title || this.defaultTitle;
      this.updateChrome({ showBack: 'brands', title: `${this.activeBrandTitle} - Shop by Frame` });
      this.transitionToStage(targetId, options);
      return;
    }

    if (!this.hasBrands && targetStage && targetId !== 'frames') {
      this.updateChrome({ showBack: true, title: title || this.defaultTitle });
      this.transitionToStage(targetId, options);
      return;
    }

    this.updateChrome({ showBack: false, title: this.defaultTitle });
    this.transitionToStage('frames', options);
  }

  showVersions(targetId, titleOverride) {
    const trigger = this.triggers.find((item) => item.dataset.megaMenuTrigger === targetId);
    const title = titleOverride || (trigger ? trigger.textContent.trim() : this.defaultTitle);
    this.activate(targetId);
    this.updateChrome({ showBack: this.hasBrands ? 'frames' : true, title });
    this.transitionToStage(targetId);
  }

  transitionToStage(targetKey, { immediate = false } = {}) {
    const currentStage = this.stages.find((stage) => stage.classList.contains('is-active'));
    const nextStage = this.resolveStage(targetKey);

    if (!nextStage) return;

    if (immediate || currentStage === nextStage || !currentStage) {
      this.setActiveStage(nextStage);
      return;
    }

    const token = ++this.transitionToken;
    const currentCards = Array.from(currentStage.querySelectorAll('[class*="view-all-menu-card"]'));
    const nextCards = Array.from(nextStage.querySelectorAll('[class*="view-all-menu-card"]'));
    const currentDuration = this.transitionDuration(currentCards.length);
    const overlapDelay = Math.min(currentDuration, 60);

    currentStage.classList.add('is-transitioning-out');

    window.setTimeout(() => {
      if (this.transitionToken !== token) return;

      currentStage.classList.remove('is-active', 'is-transitioning-out');
      currentCards.forEach((card) => card.classList.remove('is-visible'));

      nextStage.classList.add('is-active', 'is-transitioning-in');
      nextCards.forEach((card) => card.classList.remove('is-visible'));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (this.transitionToken !== token) return;
          nextCards.forEach((card) => card.classList.add('is-visible'));
        });
      });

      window.setTimeout(() => {
        if (this.transitionToken !== token) return;
        nextStage.classList.remove('is-transitioning-in');
      }, this.transitionDuration(nextCards.length));
    }, overlapDelay);

    window.setTimeout(() => {
      if (this.transitionToken !== token) return;
      currentStage.classList.remove('is-active', 'is-transitioning-out');
      currentCards.forEach((card) => card.classList.remove('is-visible'));
    }, currentDuration);
  }

  resolveStage(targetKey) {
    if (targetKey === 'brands') {
      return this.stages.find((stage) => stage.dataset.megaMenuStage === 'brands');
    }

    if (targetKey === 'frames') {
      return this.stages.find((stage) => stage.dataset.megaMenuStage === 'frames');
    }

    const framesStage = this.stages.find((stage) => stage.dataset.megaMenuFrames === targetKey);
    if (framesStage) return framesStage;

    return this.stages.find((stage) => stage.dataset.megaMenuVersions === targetKey);
  }

  setActiveStage(nextStage) {
    this.syncSecondaryMenuVisibility(nextStage);
    this.stages.forEach((stage) => {
      stage.classList.toggle('is-active', stage === nextStage);
      stage.classList.remove('is-transitioning-in', 'is-transitioning-out');
      stage.querySelectorAll('[class*="view-all-menu-card"]').forEach((card) => {
        card.classList.toggle('is-visible', stage === nextStage);
      });
    });
  }

  syncSecondaryMenuVisibility(nextStage) {
    if (!this.grid || !this.secondaryMenu) return;
    const showSecondaryMenu = nextStage && nextStage.dataset.megaMenuRootStage === 'true';
    this.grid.classList.toggle('is-secondary-hidden', !showSecondaryMenu);
  }

  updateChrome({ showBack, title }) {
    this.currentChromeTitle = title || this.defaultTitle;

    this.backButtons.forEach((button) => {
      const target = button.dataset.megaMenuBack || 'frames';
      let shouldShow = false;

      if (showBack === true) {
        shouldShow = true;
      } else if (showBack === 'brands') {
        shouldShow = target === 'brands';
      } else if (showBack === 'frames') {
        shouldShow = target === 'frames';
      }

      button.classList.toggle('is-hidden', !shouldShow);
    });

    this.updateBreadcrumb(showBack);

    if (this.titleElement) {
      this.titleElement.textContent = this.currentChromeTitle;
    }
  }

  updateBreadcrumb(showBack) {
    if (!this.breadcrumb.backBrands && !this.breadcrumb.backFrames && !this.breadcrumb.framesLabel) return;

    if (!this.hasBrands) {
      const showSimpleCrumb = showBack === true;

      if (this.breadcrumb.backFrames) {
        this.breadcrumb.backFrames.textContent = 'Shop by Frame';
        this.breadcrumb.backFrames.classList.remove('is-hidden');
      }
      if (this.breadcrumb.sepBrands) {
        this.breadcrumb.sepBrands.classList.toggle('is-hidden', !showSimpleCrumb);
      }
      if (this.breadcrumb.brandLabel) {
        this.breadcrumb.brandLabel.textContent = showSimpleCrumb ? this.currentChromeTitle : '';
        this.breadcrumb.brandLabel.classList.toggle('is-hidden', !showSimpleCrumb);
      }
      if (this.breadcrumb.sepFrames) {
        this.breadcrumb.sepFrames.classList.add('is-hidden');
      }
      if (this.breadcrumb.framesLabel) {
        this.breadcrumb.framesLabel.classList.add('is-hidden');
      }
      return;
    }

    const showBrandCrumb = showBack === 'brands' || showBack === 'frames';
    const showFrameCrumb = showBack === 'frames';

    if (this.breadcrumb.backBrands) {
      this.breadcrumb.backBrands.textContent = 'Shop by Brand';
      this.breadcrumb.backBrands.classList.toggle('is-hidden', false);
    }
    if (this.breadcrumb.sepBrands) {
      this.breadcrumb.sepBrands.classList.toggle('is-hidden', !showBrandCrumb);
    }
    if (this.breadcrumb.brandLabel) {
      this.breadcrumb.brandLabel.textContent = this.activeBrandTitle
        ? `${this.activeBrandTitle} - Shop by Frame`
        : '';
      this.breadcrumb.brandLabel.classList.toggle('is-hidden', !showBrandCrumb);
    }
    if (this.breadcrumb.sepFrames) {
      this.breadcrumb.sepFrames.classList.toggle('is-hidden', !showFrameCrumb);
    }
    if (this.breadcrumb.framesLabel) {
      if (showFrameCrumb) {
        this.breadcrumb.framesLabel.textContent = this.currentChromeTitle || '';
      }
      this.breadcrumb.framesLabel.classList.toggle('is-hidden', !showFrameCrumb);
    }
  }

  transitionDuration(cardCount) {
    if (!cardCount) return 0;
    return Math.max((cardCount - 1) * 28 + 110, 110);
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

})();
