if (!window.GovEyewearImageBannerParallax) {
  window.GovEyewearImageBannerParallax = (() => {
    const instances = new Map();
    let ticking = false;

    class BannerParallax {
      constructor(element) {
        this.element = element;
        this.media = element.querySelector('.banner__media');
        this.image = this.media ? this.media.querySelector('img') : null;
        this.speed = Number(element.dataset.parallaxStrength || 24);
        this.direction = element.dataset.parallaxDirection || 'up';
        this.inView = false;
        this.rafId = null;

        if (!this.media || !this.image) return;

        this.handleIntersect = this.handleIntersect.bind(this);
        this.update = this.update.bind(this);

        this.observer = new IntersectionObserver(this.handleIntersect, {
          threshold: [0, 1]
        });

        this.observer.observe(this.element);
        this.update();
      }

      handleIntersect(entries) {
        const [entry] = entries;
        this.inView = entry.isIntersecting;

        if (this.inView) {
          requestTick();
        } else {
          this.reset();
        }
      }

      update() {
        if (!this.isActive()) {
          this.reset();
          return;
        }

        const rect = this.element.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const progress = ((viewportHeight - rect.top) / (viewportHeight + rect.height)) - 0.5;
        const offset = Math.max(-this.speed, Math.min(this.speed, progress * this.speed * 2));

        let offsetX = 0;
        let offsetY = 0;
        let baseX = 0;
        let baseY = 0;

        switch (this.direction) {
          case 'down':
            baseY = -this.speed;
            offsetY = offset;
            break;
          case 'left':
            baseX = this.speed;
            offsetX = -offset;
            break;
          case 'right':
            baseX = -this.speed;
            offsetX = offset;
            break;
          default:
            baseY = this.speed;
            offsetY = -offset;
            break;
        }

        this.element.style.setProperty('--parallax-offset-x', `${(baseX + offsetX).toFixed(2)}px`);
        this.element.style.setProperty('--parallax-offset-y', `${(baseY + offsetY).toFixed(2)}px`);
      }

      reset() {
        this.element.style.setProperty('--parallax-offset-x', '0px');
        this.element.style.setProperty('--parallax-offset-y', '0px');
      }

      isActive() {
        return (
          this.element.classList.contains('banner--parallax') &&
          window.innerWidth >= 750 &&
          !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        );
      }

      destroy() {
        if (this.observer) this.observer.disconnect();
        this.reset();
      }
    }

    function requestTick() {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        instances.forEach((instance) => {
          if (instance.inView) instance.update();
        });
        ticking = false;
      });
    }

    function connect(root = document) {
      root.querySelectorAll('[data-image-banner-parallax]').forEach((element) => {
        if (instances.has(element)) return;
        instances.set(element, new BannerParallax(element));
      });
      requestTick();
    }

    function disconnect(root) {
      root.querySelectorAll('[data-image-banner-parallax]').forEach((element) => {
        const instance = instances.get(element);
        if (!instance) return;
        instance.destroy();
        instances.delete(element);
      });
    }

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);
    document.addEventListener('shopify:section:load', (event) => connect(event.target));
    document.addEventListener('shopify:section:unload', (event) => disconnect(event.target));

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => connect(document), { once: true });
    } else {
      connect(document);
    }

    return { connect, disconnect };
  })();
}
