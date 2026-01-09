class CustomCursor {
  private cursor: HTMLElement | null = null;
  private cursorX: number = 0;
  private cursorY: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;
  private isPointer: boolean = false;
  private animationFrame: number | null = null;
  private isVisible: boolean = false;

  constructor() {
    if (this.isTouchDevice()) return;
    this.init();
  }

  private isTouchDevice(): boolean {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(hover: none)").matches
    );
  }

  private init(): void {
    const initCursor = () => {
      this.cursor = document.querySelector(".custom-cursor");
      if (!this.cursor) {
        setTimeout(initCursor, 100);
        return;
      }
      this.cursorX = window.innerWidth / 2;
      this.cursorY = window.innerHeight / 2;
      this.targetX = this.cursorX;
      this.targetY = this.cursorY;
      this.cursor.style.opacity = "0";
      this.bindEvents();
      this.animate();
    };
    initCursor();
  }

  private bindEvents(): void {
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    document.addEventListener("mouseover", this.handleMouseOver.bind(this));
    document.addEventListener("mouseout", this.handleMouseOut.bind(this));
    document.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
    document.addEventListener("mouseenter", this.handleMouseEnter.bind(this));
  }

  private handleMouseMove(e: MouseEvent): void {
    this.targetX = e.clientX;
    this.targetY = e.clientY;
    if (!this.isVisible && this.cursor) {
      this.cursor.style.opacity = "1";
      this.isVisible = true;
    }
  }

  private handleMouseOver(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const interactiveSelectors = [
      "a",
      "button",
      "input",
      "textarea",
      "select",
      '[role="button"]',
      ".clickable",
      "[data-cursor='pointer']",
      "label",
    ];
    const isInteractive = interactiveSelectors.some((selector) => {
      return target.matches(selector) || target.closest(selector);
    });
    if (isInteractive && !this.isPointer) {
      this.setPointer(true);
    }
  }

  private handleMouseOut(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;
    const interactiveSelectors = [
      "a",
      "button",
      "input",
      "textarea",
      "select",
      '[role="button"]',
      ".clickable",
      "[data-cursor='pointer']",
      "label",
    ];
    const isLeavingInteractive = interactiveSelectors.some((selector) => {
      return target.matches(selector) || target.closest(selector);
    });
    const isEnteringInteractive =
      relatedTarget &&
      interactiveSelectors.some((selector) => {
        return (
          relatedTarget.matches(selector) || relatedTarget.closest(selector)
        );
      });
    if (isLeavingInteractive && !isEnteringInteractive && this.isPointer) {
      this.setPointer(false);
    }
  }

  private handleMouseLeave(): void {
    if (this.cursor) {
      this.cursor.style.opacity = "0";
      this.isVisible = false;
    }
  }

  private handleMouseEnter(): void {
    if (this.cursor && this.isVisible) {
      this.cursor.style.opacity = "1";
    }
  }

  private setPointer(isPointer: boolean): void {
    this.isPointer = isPointer;
    if (this.cursor) {
      if (isPointer) {
        this.cursor.classList.add("is-pointer");
      } else {
        this.cursor.classList.remove("is-pointer");
      }
    }
  }

  private animate(): void {
    const ease = 0.15;
    this.cursorX += (this.targetX - this.cursorX) * ease;
    this.cursorY += (this.targetY - this.cursorY) * ease;
    if (this.cursor) {
      this.cursor.style.transform = `translate(${this.cursorX}px, ${this.cursorY}px)`;
    }
    this.animationFrame = requestAnimationFrame(this.animate.bind(this));
  }

  public destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    document.removeEventListener("mousemove", this.handleMouseMove.bind(this));
    document.removeEventListener("mouseover", this.handleMouseOver.bind(this));
    document.removeEventListener("mouseout", this.handleMouseOut.bind(this));
    document.removeEventListener(
      "mouseleave",
      this.handleMouseLeave.bind(this)
    );
    document.removeEventListener(
      "mouseenter",
      this.handleMouseEnter.bind(this)
    );
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new CustomCursor();
  });
} else {
  new CustomCursor();
}
