class HeaderMegaMenuFullscreenOverlay {
  constructor(container) {
    this.container = container;
    this.grid = container.querySelector('[class*="view-all-menu-grid"]');
    this.triggers = Array.from(container.querySelectorAll('[data-mega-menu-trigger]'));
    this.stages = Array.from(container.querySelectorAll('[data-mega-menu-stage]'));
    this.backButtons = Array.from(container.querySelectorAll('[data-mega-menu-back]'));
    this.secondaryMenu = container.querySelector('[data-mega-menu-secondary]');
    this.secondaryMenuFor = this.secondaryMenu ? this.secondaryMenu.dataset.megaMenuSecondaryFor : '';
    this.titleElement = container.querySelector('[data-mega-menu-title]');
    this.defaultTitle = this.titleElement ? this.titleElement.textContent.trim() : 'Shop';
    this.closeButton = container.querySelector('[data-mega-menu-close]');
    this.activeBrandKey = null;
    this.activeBrandTitle = '';
    this.activeFrameKey = null;
    this.activeFrameTitle = '';
    this.handleKeydown = this.handleKeydown.bind(this);

    if (!this.stages.length) return;

    this.mountToBody();
    this.bindEvents();
    this.showBrands({ immediate: true });
  }

  bindEvents() {
    this.triggers.forEach((trigger) => {
      trigger.addEventListener('mouseenter', () => {
        this.activate(trigger.dataset.megaMenuTrigger);
      });
      trigger.addEventListener('focus', () => {
        this.activate(trigger.dataset.megaMenuTrigger);
      });
      trigger.addEventListener('click', (event) => {
        const nextStage = trigger.dataset.megaMenuNext;
        if (!nextStage) return;
        event.preventDefault();
        if (nextStage === 'frames') {
          this.showFramesStage(trigger.dataset.megaMenuTrigger, trigger.textContent.trim());
          return;
        }
        if (nextStage === 'content') {
          this.showContentStage(trigger.dataset.megaMenuTrigger, trigger.textContent.trim());
        }
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
          this.showFramesStage(this.activeBrandKey, this.activeBrandTitle, { immediate: true });
        }
      });
    });

    if (this.closeButton) {
      this.closeButton.addEventListener('click', (event) => {
        event.preventDefault();
        this.close();
      });
    }
  }

  open() {
    this.container.removeAttribute('hidden');
    this.container.classList.add('is-open');
    this.container.style.display = 'block';
    this.container.style.removeProperty('visibility');
    this.container.style.removeProperty('pointer-events');
    document.body.classList.add('overflow-hidden');
    document.addEventListener('keydown', this.handleKeydown);
    this.showBrands({ immediate: true });
  }

  close() {
    this.container.classList.remove('is-open');
    this.container.style.display = 'none';
    this.container.style.visibility = 'hidden';
    this.container.style.pointerEvents = 'none';
    this.container.setAttribute('hidden', '');
    document.body.classList.remove('overflow-hidden');
    document.removeEventListener('keydown', this.handleKeydown);
  }

  mountToBody() {
    if (this.container.parentElement !== document.body) {
      document.body.appendChild(this.container);
    }
  }

  handleKeydown(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  activate(targetId) {
    this.triggers.forEach((trigger) => {
      trigger.classList.toggle('is-active', trigger.dataset.megaMenuTrigger === targetId);
    });
  }

  showBrands(options = {}) {
    this.activeBrandKey = null;
    this.activeBrandTitle = '';
    this.activeFrameKey = null;
    this.activeFrameTitle = '';
    this.updateChrome({ showBack: 'none', title: this.defaultTitle });
    this.syncSecondaryMenuVisibility();
    this.transitionToStageByType('brands', null, options);
  }

  showFramesStage(targetId, title, options = {}) {
    if (!targetId) return;
    this.activeBrandKey = targetId;
    this.activeBrandTitle = title || this.defaultTitle;
    this.updateChrome({ showBack: 'brands', title: this.activeBrandTitle });
    this.syncSecondaryMenuVisibility();
    this.transitionToStageByType('frames', targetId, options);
  }

  showContentStage(targetId, title, options = {}) {
    if (!targetId) return;
    this.activeFrameKey = targetId;
    this.activeFrameTitle = title || this.defaultTitle;
    this.updateChrome({ showBack: 'frames', title: this.activeFrameTitle });
    this.syncSecondaryMenuVisibility();
    this.transitionToStageByType('content', targetId, options);
  }

  transitionToStageByType(stageType, targetKey, { immediate = false } = {}) {
    const currentStage = this.stages.find((stage) => stage.classList.contains('is-active'));
    const nextStage = this.resolveStageByType(stageType, targetKey);

    if (!nextStage) return;

    if (immediate || currentStage === nextStage || !currentStage) {
      this.setActiveStage(nextStage);
      return;
    }

    currentStage.classList.remove('is-active');
    nextStage.classList.add('is-active');
  }

  resolveStageByType(stageType, targetKey) {
    if (stageType === 'brands') {
      return this.stages.find((stage) => stage.dataset.megaMenuStage === 'brands');
    }
    if (stageType === 'frames') {
      return this.stages.find((stage) => stage.dataset.megaMenuFrames === targetKey);
    }
    if (stageType === 'content') {
      return this.stages.find((stage) => stage.dataset.megaMenuContent === targetKey);
    }
    return null;
  }

  setActiveStage(nextStage) {
    this.stages.forEach((stage) => {
      stage.classList.toggle('is-active', stage === nextStage);
    });
  }

  syncSecondaryMenuVisibility() {
    if (!this.grid || !this.secondaryMenu) return;
    const shouldShowSecondary = !!this.activeBrandKey && this.activeBrandKey === this.secondaryMenuFor;
    this.grid.classList.toggle('is-secondary-hidden', !shouldShowSecondary);
    this.secondaryMenu.classList.toggle('is-hidden', !shouldShowSecondary);
  }

  updateChrome({ showBack, title }) {
    this.backButtons.forEach((button) => {
      const target = button.dataset.megaMenuBack;
      const shouldShow = (target === 'brands' && showBack === 'brands') || (target === 'frames' && showBack === 'frames');
      button.classList.toggle('is-hidden', !shouldShow);
    });

    if (this.titleElement) {
      this.titleElement.textContent = title || this.defaultTitle;
    }
  }
}

const initHeaderMegaMenuFullscreen = () => {
  const overlays = Array.from(document.querySelectorAll('[data-header-mega-menu]'));
  const overlayMap = new Map();

  overlays.forEach((container) => {
    if (container.dataset.megaMenuInitialized === 'true') return;
    container.dataset.megaMenuInitialized = 'true';
    const instance = new HeaderMegaMenuFullscreenOverlay(container);
    const key = container.dataset.fullscreenId || container.id;
    if (key) overlayMap.set(key, instance);
  });

  document.querySelectorAll('[data-fullscreen-trigger]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = trigger.dataset.fullscreenTarget;
      const overlay = overlayMap.get(targetId);
      if (overlay) overlay.open();
    });
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeaderMegaMenuFullscreen);
} else {
  initHeaderMegaMenuFullscreen();
}
