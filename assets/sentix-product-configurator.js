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
      this.initialVariantId = Number(this.dataset.initialVariantId || 0);
      this.variantData = this.normalizeVariants(this.parseJson('sellable-variants'));
      this.sellableVariants = this.getSellableVariants(this.variantData);
      this.lensColorContent = this.parseJson('lens-color-content');
      this.swatchMap = this.parseJson('swatch-map');
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

      if (!this.sellableVariants.length) return;

      this.addEventListener('click', this.handleClick.bind(this));
      this.addEventListener('keydown', this.handleKeydown.bind(this));

      const initialVariant = this.sellableVariants.find((variant) => variant.id === this.initialVariantId) || this.sellableVariants[0];
      this.syncUIFromVariant(initialVariant);
    }

    parseJson(key) {
      const node = this.querySelector(`[data-${key}]`);
      return node ? JSON.parse(node.textContent) : {};
    }

    normalizeVariants(variants) {
      return variants.map((variant) => ({
        id: variant.id,
        title: variant.title,
        available: Boolean(variant.available),
        price: variant.price,
        sku: variant.sku || '',
        option1: variant.option1 || variant.lens_type || variant.options?.[0] || '',
        option2: variant.option2 || variant.lens_color || variant.options?.[1] || '',
        option3: variant.option3 || variant.frame_color || variant.options?.[2] || '',
        lens_type: variant.lens_type || variant.option1 || variant.options?.[0] || '',
        lens_color: variant.lens_color || variant.option2 || variant.options?.[1] || '',
        frame_color: variant.frame_color || variant.option3 || variant.options?.[2] || '',
        featured_media_id: variant.featured_media?.id || null,
      }));
    }

    getSellableVariants(variants) {
      return variants.filter((variant) => variant.available);
    }

    matchesSelection(variant, selected) {
      return Object.entries(selected).every(([key, value]) => !value || variant[key] === value);
    }

    getMatchingVariants(variants, selected) {
      return variants.filter((variant) => this.matchesSelection(variant, selected));
    }

    getValidValuesForOption(variants, selected, targetPosition) {
      const key = this.optionKeys[targetPosition - 1];
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

    getFallbackVariant(variants, selected, lastChangedPosition) {
      const changedKey = this.optionKeys[lastChangedPosition - 1];
      let bestVariant = null;
      let bestScore = -1;

      variants.forEach((variant) => {
        if (selected[changedKey] && variant[changedKey] !== selected[changedKey]) return;

        let score = 0;
        this.optionKeys.forEach((key, index) => {
          if (!selected[key]) return;
          if (variant[key] !== selected[key]) return;

          if (index + 1 === lastChangedPosition) {
            score += 100;
          } else if (index + 1 < lastChangedPosition) {
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

      const position = Number(button.dataset.optionPosition);
      const key = this.optionKeys[position - 1];
      const nextSelection = { ...this.selected, [key]: button.dataset.optionValue };
      const resolvedVariant = this.findExactVariant(this.sellableVariants, nextSelection)
        || this.getFallbackVariant(this.sellableVariants, nextSelection, position);

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
      const upstreamSelections = {
        1: {},
        2: { lens_type: this.selected.lens_type },
        3: {
          lens_type: this.selected.lens_type,
          lens_color: this.selected.lens_color,
        },
      };

      this.optionKeys.forEach((key) => {
        const position = this.optionPositions[key];
        const values = this.getValidValuesForOption(this.sellableVariants, upstreamSelections[position], position);
        const node = this.groupNodes[key];
        if (!node) return;

        node.innerHTML = values.map((value) => this.renderOptionButton(key, position, value)).join('');
      });
    }

    renderOptionButton(key, position, value) {
      const selected = this.selected[key] === value;
      const swatchUrl = this.swatchMap?.[this.optionNames[key]]?.[value] || '';
      const classes = [
        'sentix-configurator__option',
        swatchUrl ? 'sentix-configurator__option--swatch' : 'sentix-configurator__option--text',
      ].join(' ');
      const swatchMarkup = swatchUrl
        ? `<span class="sentix-configurator__swatch-visual"><img src="${swatchUrl}" alt="" loading="lazy"></span><span class="visually-hidden">${value}</span>`
        : `<span class="sentix-configurator__option-text">${value}</span>`;

      return `
        <button
          type="button"
          class="${classes}"
          role="radio"
          aria-checked="${selected ? 'true' : 'false'}"
          aria-disabled="false"
          tabindex="${selected ? '0' : '-1'}"
          data-option-position="${position}"
          data-option-value="${this.escapeAttribute(value)}"
        >
          ${swatchMarkup}
        </button>
      `;
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
      };

      this.lensColorSupportTitle.textContent = content.title || variant.lens_color;
      this.lensColorSupportBody.textContent = content.body || '';
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
      if (!this.currentVariant?.featured_media_id) return;

      const mediaGallery = document.getElementById(`MediaGallery-${this.sectionId}`);
      if (mediaGallery?.setActiveMedia) {
        mediaGallery.setActiveMedia(`${this.sectionId}-${this.currentVariant.featured_media_id}`, true);
      }

      const modalContent = document.querySelector(`#ProductModal-${this.sectionId} .product-media-modal__content`);
      if (!modalContent) return;
      const newMediaModal = modalContent.querySelector(`[data-media-id="${this.currentVariant.featured_media_id}"]`);
      if (newMediaModal) modalContent.prepend(newMediaModal);
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
