if (!customElements.get('sentix-variant-configurator')) {
  class SentixVariantConfigurator extends HTMLElement {
    constructor() {
      super();

      this.optionKeys = ['lens_type', 'lens_color', 'frame_color'];
      this.optionPositions = {
        lens_type: 1,
        lens_color: 2,
        frame_color: 3,
      };
      this.optionNames = {
        lens_type: 'Lens Type',
        lens_color: 'Lens Color',
        frame_color: 'Frame Color',
      };
      this.selected = {};
      this.currentVariant = null;
    }

    connectedCallback() {
      this.sectionId = this.dataset.section;
      this.productUrl = this.dataset.url;
      this.productHandle = String(this.productUrl || '').split('/').filter(Boolean).pop() || '';
      this.initialVariantId = Number(this.dataset.initialVariantId || 0);
      this.optionPositions = {
        ...this.optionPositions,
        ...this.parseJson('option-position-map', {}),
      };
      this.nativeVariantsById = this.indexVariantsById(this.parseJson('native-variants', []));
      this.variantMediaMap = this.normalizeVariantMediaMap(this.parseJson('variant-media-map', {}));
      this.variantGalleryFiles = this.normalizeVariantGalleryFiles(this.parseJson('variant-gallery-files', {}));
      const defaultLensColorContent = this.parseJson('lens-color-content', {});
      const lensColorContentOverrides = this.parseJson('lens-color-content-variant-overrides', {});
      this.lensColorContent = this.mergeLensColorContent(defaultLensColorContent, lensColorContentOverrides);
      this.swatchMap = this.buildSwatchMap(this.parseJson('swatch-entries', []));
      this.groupNodes = {
        lens_type: this.querySelector('[data-option-group="lens_type"]'),
        lens_color: this.querySelector('[data-option-group="lens_color"]'),
        frame_color: this.querySelector('[data-option-group="frame_color"]'),
      };
      this.selectedLabelNodes = {
        lens_type: this.querySelector('[data-selected-label="lens_type"]'),
        lens_color: this.querySelector('[data-selected-label="lens_color"]'),
        frame_color: this.querySelector('[data-selected-label="frame_color"]'),
      };
      this.lensColorSupportTitle = this.querySelector('[data-lens-color-support-title]');
      this.lensColorSupportBody = this.querySelector('[data-lens-color-support-body]');
      this.lensColorSupportBodySecondary = this.querySelector('[data-lens-color-support-body-secondary]');
      this.clearVariantMediaSelection();

      this.variantData = this.normalizeVariants(this.parseJson('sellable-variants', []));
      this.sellableVariants = this.getSellableVariants(this.variantData);

      if (!this.sellableVariants.length) return;

      this.addEventListener('click', this.handleClick.bind(this));
      this.addEventListener('keydown', this.handleKeydown.bind(this));

      const initialVariant = this.sellableVariants.find((variant) => variant.id === this.initialVariantId) || this.sellableVariants[0];
      this.syncUIFromVariant(initialVariant);
    }

    parseJson(key, fallback = {}) {
      const node = this.querySelector(`[data-${key}]`);
      if (!node) return fallback;
      try {
        return JSON.parse(node.textContent);
      } catch (_error) {
        return fallback;
      }
    }

    buildSwatchMap(entries) {
      const map = {};
      (entries || []).forEach((entry) => {
        const group = entry?.group;
        const value = entry?.value;
        const image = entry?.image;
        if (!group || !value || !image) return;
        map[group] ||= {};
        map[group][this.normalizeSwatchKey(value)] = image;
      });
      return map;
    }

    mergeLensColorContent(defaults, overrides) {
      const merged = { ...(defaults || {}) };
      Object.entries(overrides || {}).forEach(([key, value]) => {
        merged[key] = {
          ...(merged[key] || {}),
          ...(value || {}),
        };
      });
      return merged;
    }

    normalizeSwatchKey(value) {
      return String(value || '')
        .toLowerCase()
        .trim()
        // Drop punctuation so "w/Black" and "w/ Black" converge.
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    normalizeVariants(variants) {
      const rows = Array.isArray(variants) ? variants : [];
      return rows.map((variant) => {
        const native = this.nativeVariantsById.get(Number(variant.id)) || {};
        const lensType = variant.lens_type || this.getVariantOptionValue(variant, this.optionPositions.lens_type) || this.getVariantOptionValue(native, this.optionPositions.lens_type);
        const lensColor = variant.lens_color || this.getVariantOptionValue(variant, this.optionPositions.lens_color) || this.getVariantOptionValue(native, this.optionPositions.lens_color);
        const frameColor = variant.frame_color || this.getVariantOptionValue(variant, this.optionPositions.frame_color) || this.getVariantOptionValue(native, this.optionPositions.frame_color);

        return {
          ...native,
          id: variant.id,
          title: variant.title,
          available: Boolean(variant.available),
          price: variant.price ?? native.price,
          sku: variant.sku || native.sku || '',
          option1: this.getVariantOptionValue(native, 1) || this.getVariantOptionValue(variant, 1) || '',
          option2: this.getVariantOptionValue(native, 2) || this.getVariantOptionValue(variant, 2) || '',
          option3: this.getVariantOptionValue(native, 3) || this.getVariantOptionValue(variant, 3) || '',
          lens_type: lensType || '',
          lens_color: lensColor || '',
          frame_color: frameColor || '',
          featured_media_id: variant.featured_media_id || variant.featured_media?.id || native.featured_media?.id || null,
          featured_image_src: native.featured_image?.src || variant.featured_image?.src || '',
        };
      });
    }

    getVariantOptionValue(variant, position) {
      if (!variant || !position) return '';
      const byOption = variant[`option${position}`];
      if (byOption) return byOption;
      const idx = Number(position) - 1;
      return variant.options?.[idx] || '';
    }

    indexVariantsById(variants) {
      const index = new Map();
      variants.forEach((variant) => {
        if (variant?.id) index.set(Number(variant.id), variant);
      });
      return index;
    }

    getSellableVariants(variants) {
      return variants.filter((variant) => variant.available);
    }

    normalizeVariantMediaMap(rawMap) {
      const entries = rawMap && typeof rawMap === 'object' ? Object.entries(rawMap) : [];
      const normalized = {};

      entries.forEach(([variantId, ids]) => {
        const key = String(variantId || '').trim();
        if (!key) return;

        const source = Array.isArray(ids) ? ids : String(ids || '').split(',');
        const unique = [];
        const seen = new Set();

        source.forEach((candidate) => {
          const numeric = Number(String(candidate || '').trim());
          if (!Number.isInteger(numeric) || numeric <= 0 || seen.has(numeric)) return;
          seen.add(numeric);
          unique.push(numeric);
        });

        if (unique.length) {
          normalized[key] = unique;
        }
      });

      return normalized;
    }

    normalizeVariantGalleryFiles(rawMap) {
      const entries = rawMap && typeof rawMap === 'object' ? Object.entries(rawMap) : [];
      const normalized = {};

      entries.forEach(([variantId, urls]) => {
        const key = String(variantId || '').trim();
        if (!key) return;

        const source = Array.isArray(urls) ? urls : [];
        const unique = [];
        const seen = new Set();

        source.forEach((url) => {
          const filename = this.extractFilename(url);
          if (!filename || seen.has(filename)) return;
          seen.add(filename);
          unique.push(filename);
        });

        if (unique.length) normalized[key] = unique;
      });

      return normalized;
    }

    getOrderedOptionKeys() {
      return [...this.optionKeys];
    }

    matchesSelection(variant, selected) {
      return Object.entries(selected).every(([key, value]) => !value || variant[key] === value);
    }

    getMatchingVariants(variants, selected) {
      return variants.filter((variant) => this.matchesSelection(variant, selected));
    }

    getValidValuesForOption(variants, selected, targetKey) {
      const key = targetKey;
      const values = [];
      const seen = new Set();
      this.getMatchingVariants(variants, selected).forEach((variant) => {
        const value = variant[key];
        if (value && !seen.has(value)) {
          seen.add(value);
          values.push(value);
        }
      });
      return values;
    }

    findExactVariant(variants, selected) {
      return variants.find((variant) => this.optionKeys.every((key) => variant[key] === selected[key])) || null;
    }

    getFallbackVariant(variants, selected, lastChangedKey) {
      const orderedKeys = this.getOrderedOptionKeys();
      const changedIndex = orderedKeys.indexOf(lastChangedKey);
      let bestVariant = null;
      let bestScore = -1;

      variants.forEach((variant) => {
        if (selected[lastChangedKey] && variant[lastChangedKey] !== selected[lastChangedKey]) return;

        let score = 0;
        orderedKeys.forEach((key, index) => {
          if (!selected[key]) return;
          if (variant[key] !== selected[key]) return;

          if (key === lastChangedKey) {
            score += 100;
          } else if (changedIndex !== -1 && index < changedIndex) {
            score += 25 - index;
          } else {
            score += 10 - index;
          }
        });

        if (score > bestScore) {
          bestScore = score;
          bestVariant = variant;
        }
      });

      return bestVariant || variants[0] || null;
    }

    handleClick(event) {
      const button = event.target.closest('[data-option-position][data-option-value]');
      if (!button || button.getAttribute('aria-disabled') === 'true') return;

      const key = button.dataset.optionKey;
      if (!key) return;
      const nextSelection = { ...this.selected, [key]: button.dataset.optionValue };
      const resolvedVariant = this.findExactVariant(this.sellableVariants, nextSelection)
        || this.getFallbackVariant(this.sellableVariants, nextSelection, key);

      if (resolvedVariant) this.syncUIFromVariant(resolvedVariant);
    }

    handleKeydown(event) {
      const button = event.target.closest('[data-option-position][role="radio"]');
      if (!button) return;

      const group = button.closest('[role="radiogroup"]');
      const buttons = Array.from(group.querySelectorAll('[role="radio"]'));
      const currentIndex = buttons.indexOf(button);
      let nextIndex = currentIndex;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % buttons.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = buttons.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      const nextButton = buttons[nextIndex];
      nextButton.focus();
      nextButton.click();
    }

    renderOptionGroups() {
      const upstreamSelectionsByKey = {
        lens_type: {},
        lens_color: { lens_type: this.selected.lens_type },
        frame_color: {
          lens_type: this.selected.lens_type,
          lens_color: this.selected.lens_color,
        },
      };

      this.optionKeys.forEach((key) => {
        const position = this.optionPositions[key];
        const upstreamSelections = upstreamSelectionsByKey[key] || {};
        const values = this.getValidValuesForOption(this.sellableVariants, upstreamSelections, key);
        const node = this.groupNodes[key];
        if (!node) return;

        node.innerHTML = values.map((value) => this.renderOptionButton(key, position, value)).join('');
      });

      this.bindSwatchFallbackHandlers();
    }

    renderOptionButton(key, position, value) {
      const selected = this.selected[key] === value;
      const swatchUrl = this.swatchMap?.[key]?.[this.normalizeSwatchKey(value)] || '';
      const isSwatchOption = key === 'lens_color' || key === 'frame_color';
      const classes = [
        'sentix-configurator__option',
        isSwatchOption ? 'sentix-configurator__option--swatch' : 'sentix-configurator__option--text',
        `sentix-configurator__option--${key.replace('_', '-')}`,
        selected ? 'is-active' : '',
      ].join(' ');
      const swatchFallback = this.getSwatchFallbackColor(key, value);
      const swatchImageMarkup = swatchUrl
        ? `<img src="${swatchUrl}" alt="" loading="lazy" decoding="async">`
        : '';
      const swatchMarkup = isSwatchOption
        ? `<span class="sentix-configurator__swatch-visual" data-swatch-visual style="--sentix-swatch-fallback:${swatchFallback}">${swatchImageMarkup}</span><span class="visually-hidden">${value}</span>`
        : `<span class="sentix-configurator__option-text">${value}</span>`;

      return `
        <button
          type="button"
          class="${classes}"
          role="radio"
          aria-checked="${selected ? 'true' : 'false'}"
          aria-disabled="false"
          tabindex="${selected ? '0' : '-1'}"
          data-option-key="${key}"
          data-option-position="${position}"
          data-option-value="${this.escapeAttribute(value)}"
        >
          ${swatchMarkup}
        </button>
      `;
    }

    bindSwatchFallbackHandlers() {
      const images = Array.from(this.querySelectorAll('[data-swatch-visual] img'));
      images.forEach((img) => {
        if (img.dataset.sentixBound === 'true') return;
        img.dataset.sentixBound = 'true';

        img.addEventListener('error', () => {
          const visual = img.closest('[data-swatch-visual]');
          if (visual) visual.setAttribute('data-swatch-broken', 'true');
        });
      });
    }

    getSwatchFallbackColor(key, value) {
      const normalized = String(value || '').toLowerCase();

      if (key === 'frame_color') {
        if (normalized.includes('tan')) return '#c9a57a';
        if (normalized.includes('graphite')) return '#5a5f66';
        if (normalized.includes('gunmetal')) return '#5f6b73';
        return '#111111';
      }

      if (normalized.includes('inferno') || normalized.includes('photochromic')) return '#9aa0a6';
      if (normalized.includes('rose')) return '#b26b7b';
      if (normalized.includes('smoke')) return '#4a4a4a';
      return '#777777';
    }

    syncSelectedLabels(variant) {
      this.selectedLabelNodes.lens_type.textContent = variant.lens_type;
      this.selectedLabelNodes.lens_color.textContent = variant.lens_color;
      this.selectedLabelNodes.frame_color.textContent = variant.frame_color;
    }

    syncLensColorSupportText(variant) {
      const content = this.lensColorContent[variant.lens_color] || {
        title: variant.lens_color,
        body: '',
        secondary_body: '',
      };
      const selectedLensColor = String(variant.lens_color || '').trim();
      const title = String(content.title || variant.lens_color || '').trim();
      const body = String(content.body || '').trim();
      const secondaryBody = String(content.secondary_body || '').trim();
      const hideTitle = !title || title.toLowerCase() === selectedLensColor.toLowerCase();

      if (this.lensColorSupportTitle) {
        this.lensColorSupportTitle.textContent = title;
        this.lensColorSupportTitle.hidden = hideTitle;
      }
      if (this.lensColorSupportBody) {
        this.lensColorSupportBody.textContent = body;
      }
      if (this.lensColorSupportBodySecondary) {
        this.lensColorSupportBodySecondary.textContent = secondaryBody;
        this.lensColorSupportBodySecondary.hidden = !secondaryBody;
      }
    }

    syncUIFromVariant(variant) {
      if (!variant) return;

      this.currentVariant = variant;
      this.selected = {
        lens_type: variant.lens_type,
        lens_color: variant.lens_color,
        frame_color: variant.frame_color,
      };

      this.renderOptionGroups();
      this.syncSelectedLabels(variant);
      this.syncLensColorSupportText(variant);
      this.removeErrorMessage();
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateShareUrl();
      this.updatePickupAvailability();
      this.toggleAddButton(!variant.available, window.variantStrings.soldOut);
    }

    updateMedia() {
      const mediaGallery = document.getElementById(`MediaGallery-${this.sectionId}`);
      if (!mediaGallery) return;
      const mappedMediaIds = this.getMappedMediaIdsForCurrentVariant(mediaGallery);

      if (mappedMediaIds.length) {
        this.applyVariantMediaSelection(mediaGallery, mappedMediaIds);
        this.moveActiveModalMedia(String(mappedMediaIds[0]), mappedMediaIds);
        return;
      }

      this.clearVariantMediaSelection(mediaGallery);
      const primaryMediaId = this.getPrimaryMediaId();

      if (primaryMediaId && mediaGallery.setActiveMedia) {
        mediaGallery.setActiveMedia(primaryMediaId, true);
      }

      const numericMediaId = String(primaryMediaId || '').split('-')[1] || '';
      if (numericMediaId) this.moveActiveModalMedia(numericMediaId, []);
    }

    getPrimaryMediaId() {
      const featuredMediaId = Number(this.currentVariant?.featured_media_id || 0);
      return featuredMediaId ? `${this.sectionId}-${featuredMediaId}` : '';
    }

    getMappedMediaIdsForCurrentVariant(mediaGallery) {
      const key = String(this.currentVariant?.id || '');
      const configuredIds = this.variantMediaMap?.[key] || [];
      if (configuredIds.length) {
        const available = new Set(
          Array.from(mediaGallery.querySelectorAll('[data-media-id]'))
            .map((node) => Number(String(node.getAttribute('data-media-id') || '').split('-')[1]))
            .filter((value) => Number.isInteger(value) && value > 0),
        );

        return configuredIds.filter((id) => available.has(id));
      }

      const configuredFiles = this.variantGalleryFiles?.[key] || [];
      if (!configuredFiles.length) return [];

      return this.resolveMediaIdsByFilenames(mediaGallery, configuredFiles);
    }

    resolveMediaIdsByFilenames(mediaGallery, filenames) {
      const mediaEntries = Array.from(mediaGallery.querySelectorAll('[data-media-id]')).map((node) => {
        const id = Number(String(node.getAttribute('data-media-id') || '').split('-')[1]);
        const fileSet = new Set();

        node.querySelectorAll('img').forEach((img) => {
          this.collectFilenameFromSrc(fileSet, img.getAttribute('src'));
          this.collectFilenamesFromSrcset(fileSet, img.getAttribute('srcset'));
        });
        node.querySelectorAll('source').forEach((source) => {
          this.collectFilenamesFromSrcset(fileSet, source.getAttribute('srcset'));
        });

        return { id, fileSet };
      }).filter((entry) => Number.isInteger(entry.id) && entry.id > 0);

      const ordered = [];
      const seen = new Set();

      filenames.forEach((filename) => {
        const match = mediaEntries.find((entry) => entry.fileSet.has(filename));
        if (!match || seen.has(match.id)) return;
        seen.add(match.id);
        ordered.push(match.id);
      });

      return ordered;
    }

    collectFilenameFromSrc(targetSet, src) {
      const filename = this.extractFilename(src);
      if (filename) targetSet.add(filename);
    }

    collectFilenamesFromSrcset(targetSet, srcset) {
      String(srcset || '')
        .split(',')
        .map((part) => part.trim().split(/\s+/)[0])
        .forEach((urlPart) => this.collectFilenameFromSrc(targetSet, urlPart));
    }

    extractFilename(url) {
      const raw = String(url || '').trim();
      if (!raw) return '';
      const clean = raw.split('?')[0].split('#')[0];
      const last = clean.split('/').pop() || '';
      return last.toLowerCase();
    }

    applyVariantMediaSelection(mediaGallery, mediaIds) {
      const selectedIds = new Set(mediaIds.map((id) => Number(id)));

      mediaGallery.querySelectorAll('[data-media-id]').forEach((node) => {
        const numeric = Number(String(node.getAttribute('data-media-id') || '').split('-')[1]);
        const shouldShow = selectedIds.has(numeric);
        node.classList.toggle('sentix-configurator__media-hidden', !shouldShow);
        if (!shouldShow) node.classList.remove('is-active');
      });

      mediaGallery.querySelectorAll('[data-target]').forEach((node) => {
        const numeric = Number(String(node.dataset.target || '').split('-')[1]);
        const shouldShow = selectedIds.has(numeric);
        node.classList.toggle('sentix-configurator__thumb-hidden', !shouldShow);
      });

      const primaryId = mediaIds[0];
      if (primaryId && mediaGallery.setActiveMedia) {
        mediaGallery.setActiveMedia(`${this.sectionId}-${primaryId}`, true);
      }
    }

    clearVariantMediaSelection(mediaGallery = document.getElementById(`MediaGallery-${this.sectionId}`)) {
      if (!mediaGallery) return;

      mediaGallery.querySelectorAll('.product__media-item--variant').forEach((node) => {
        node.classList.remove('product__media-item--variant');
      });
      mediaGallery.querySelectorAll('.thumbnail-list_item--variant').forEach((node) => {
        node.classList.remove('thumbnail-list_item--variant');
      });

      mediaGallery.querySelectorAll('.sentix-configurator__media-hidden').forEach((node) => {
        node.classList.remove('sentix-configurator__media-hidden');
      });
      mediaGallery.querySelectorAll('.sentix-configurator__thumb-hidden').forEach((node) => {
        node.classList.remove('sentix-configurator__thumb-hidden');
      });

      const modalContent = document.querySelector(`#ProductModal-${this.sectionId} .product-media-modal__content`);
      if (!modalContent) return;
      modalContent.querySelectorAll('.sentix-configurator__modal-media-hidden').forEach((node) => {
        node.classList.remove('sentix-configurator__modal-media-hidden');
      });
    }

    moveActiveModalMedia(numericMediaId, mappedMediaIds) {
      const modalContent = document.querySelector(`#ProductModal-${this.sectionId} .product-media-modal__content`);
      if (!modalContent) return;

      const selected = Number(numericMediaId);
      const activeMedia = modalContent.querySelector(`[data-media-id="${selected}"]`);
      if (activeMedia) modalContent.prepend(activeMedia);

      const selectedIds = new Set(mappedMediaIds || []);
      if (!selectedIds.size) {
        modalContent.querySelectorAll('.sentix-configurator__modal-media-hidden').forEach((node) => {
          node.classList.remove('sentix-configurator__modal-media-hidden');
        });
        return;
      }

      modalContent.querySelectorAll('[data-media-id]').forEach((node) => {
        const mediaId = Number(node.getAttribute('data-media-id'));
        node.classList.toggle('sentix-configurator__modal-media-hidden', !selectedIds.has(mediaId));
      });
    }

    updateURL() {
      if (!this.currentVariant) return;
      window.history.replaceState({}, '', `${this.productUrl}?variant=${this.currentVariant.id}`);
    }

    updateShareUrl() {
      const shareButton = document.getElementById(`Share-${this.sectionId}`);
      if (!shareButton || !shareButton.updateUrl) return;
      shareButton.updateUrl(`${window.shopUrl}${this.productUrl}?variant=${this.currentVariant.id}`);
    }

    updateVariantInput() {
      const productForms = document.querySelectorAll(`#product-form-${this.sectionId}, #product-form-installment-${this.sectionId}`);
      productForms.forEach((productForm) => {
        const input = productForm.querySelector('input[name="id"]');
        if (!input) return;
        input.value = this.currentVariant.id;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    updatePickupAvailability() {
      const pickUpAvailability = document.querySelector('pickup-availability');
      if (!pickUpAvailability) return;

      if (this.currentVariant?.available) {
        pickUpAvailability.fetchAvailability(this.currentVariant.id);
      } else {
        pickUpAvailability.removeAttribute('available');
        pickUpAvailability.innerHTML = '';
      }
    }

    removeErrorMessage() {
      const section = this.closest('section');
      if (!section) return;
      const productForm = section.querySelector('product-form');
      if (productForm) productForm.handleErrorMessage();
    }

    renderProductInfo() {
      fetch(`${this.productUrl}?variant=${this.currentVariant.id}&section_id=${this.sectionId}`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const priceDestination = document.getElementById(`price-${this.sectionId}`);
          const priceSource = html.getElementById(`price-${this.sectionId}`);
          if (priceSource && priceDestination) priceDestination.innerHTML = priceSource.innerHTML;

          const skuDestination = document.getElementById(`Sku-${this.sectionId}`);
          const skuSource = html.getElementById(`Sku-${this.sectionId}`);
          if (skuSource && skuDestination) {
            skuDestination.innerHTML = skuSource.innerHTML;
            skuDestination.className = skuSource.className;
          }

          if (priceDestination) priceDestination.classList.remove('visibility-hidden');
        });
    }

    toggleAddButton(disable = true, text) {
      const productForm = document.getElementById(`product-form-${this.sectionId}`);
      if (!productForm) return;
      const addButton = productForm.querySelector('[name="add"]');
      const addButtonText = productForm.querySelector('[name="add"] > span');
      if (!addButton || !addButtonText) return;

      if (disable) {
        addButton.setAttribute('disabled', 'disabled');
        addButtonText.textContent = text || window.variantStrings.soldOut;
      } else {
        addButton.removeAttribute('disabled');
        addButtonText.textContent = window.variantStrings.addToCart;
      }
    }

    escapeAttribute(value) {
      return value
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
    }
  }

  customElements.define('sentix-variant-configurator', SentixVariantConfigurator);
}
