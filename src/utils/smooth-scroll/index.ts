import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export default class SmoothScroll {
  private smoother: ScrollSmoother | null = null;
  private wrapper: HTMLElement | null = null;
  private content: HTMLElement | null = null;

  constructor() {
    this.wrapper = document.querySelector("#smooth-wrapper");
    this.content = document.querySelector("#smooth-content");

    this.init();
  }

  private init(): void {
    if (!this.wrapper || !this.content) {
      console.warn(
        "[SmoothScroll] Wrapper ou content não encontrados. Certifique-se de ter #smooth-wrapper e #smooth-content no HTML."
      );
      return;
    }

    if (this.isTouchDevice()) {
      console.log(
        "[SmoothScroll] Dispositivo touch detectado, desabilitando smooth scroll"
      );
      return;
    }

    this.createSmoothScroll();
  }

  private isTouchDevice(): boolean {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(hover: none)").matches
    );
  }

  private createSmoothScroll(): void {
    try {
      this.smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.5,
        effects: true,
        smoothTouch: 0.1,
        normalizeScroll: false,
        ignoreMobileResize: true,
      });

      console.log("[SmoothScroll] Smooth scroll inicializado com sucesso");

      (window as any).smoother = this.smoother;
    } catch (error) {
      console.error("[SmoothScroll] Erro ao inicializar:", error);
    }
  }

  public scrollTo(
    target: string | number | Element,
    smooth: boolean = true
  ): void {
    if (this.smoother) {
      this.smoother.scrollTo(target, smooth);
    } else {
      if (typeof target === "string") {
        const element = document.querySelector(target);
        element?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
      } else if (typeof target === "number") {
        window.scrollTo({ top: target, behavior: smooth ? "smooth" : "auto" });
      }
    }
  }

  public paused(value?: boolean): boolean {
    if (this.smoother) {
      if (value !== undefined) {
        this.smoother.paused(value);
      }
      return this.smoother.paused();
    }
    return false;
  }

  public kill(): void {
    if (this.smoother) {
      this.smoother.kill();
      this.smoother = null;
    }
  }

  public getSmoother(): ScrollSmoother | null {
    return this.smoother;
  }
}
