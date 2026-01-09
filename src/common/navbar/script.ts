import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ResourceLoader from "@/utils/resources";
import { WrapCharacters } from "@/utils/wrap-characters";
import { MagneticEffect } from "@/utils/magnetic";

gsap.registerPlugin(ScrollTrigger);

export default class NavbarAnimation {
  private navbar: HTMLElement | null = null;
  private lines: NodeListOf<HTMLElement> | null = null;
  private logo: HTMLElement | null = null;
  private links: NodeListOf<HTMLElement> | null = null;
  private letsTalk: HTMLElement | null = null;
  private timeline: gsap.core.Timeline;
  private clickSound: HTMLAudioElement | null = null;
  private crystalImage: HTMLImageElement | null = null;

  constructor() {
    this.timeline = gsap.timeline({ paused: true });
    this.navbar = document.querySelector(".navbar");
    if (this.navbar) {
      this.lines = this.navbar.querySelectorAll(".navbar-line");
      this.logo = this.navbar.querySelector(".navbar-logo");
      this.links = this.navbar.querySelectorAll(".navbar-links li");
      this.letsTalk = this.navbar.querySelector(".navbar-letstalk");
      this.clickSound = this.navbar.querySelector("#clickSound");
      this.crystalImage = this.navbar.querySelector(".navbar-crystal");
    }

    this.init();
  }

  private init(): void {
    this.setup();

    const resourceLoader = ResourceLoader.getInstance();
    resourceLoader.onComplete(() => this.onLoadComplete());
    resourceLoader.start();
  }

  private setup(): void {
    this.animateLogo();
    this.animateLinks();
    this.animateletsTalk();
    this.animateCrystal();
  }

  private animateLogo(): void {
    if (!this.logo) return;

    const iconBar = this.logo.querySelector(".icon-bar") as HTMLElement;
    const canvas = this.logo.querySelector(
      ".fireworks-canvas"
    ) as HTMLCanvasElement;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth * 2;
      canvas.height = window.innerHeight * 2;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(2, 2);
    };
    updateCanvasSize();

    window.addEventListener("resize", updateCanvasSize);

    const colours = ["#0E4D85", "#A6B0AB", "#4A90E2", "#7BA3C7", "#5C8FB5"];
    let balls: Ball[] = [];
    let animationFrame: number | null = null;

    class Ball {
      x: number;
      y: number;
      prevX: number;
      prevY: number;
      angle: number;
      multiplier: number;
      vx: number;
      vy: number;
      length: number;
      opacity: number;
      color: string;
      goingUp: boolean;

      constructor(x: number, y: number, goingUp: boolean) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.goingUp = goingUp;

        const angleVariation = (Math.random() - 0.5) * (Math.PI / 6);
        this.angle = goingUp
          ? -Math.PI / 2 + angleVariation
          : Math.PI / 2 + angleVariation;

        this.multiplier = this.randBetween(2, 4);
        this.vx =
          (this.multiplier + Math.random() * 0.3) * Math.cos(this.angle);
        this.vy =
          (this.multiplier + Math.random() * 0.3) * Math.sin(this.angle);
        this.length = this.randBetween(8, 15);
        this.opacity = 1;
        this.color = colours[Math.floor(Math.random() * colours.length)];
      }

      update() {
        this.prevX = this.x;
        this.prevY = this.y;
        this.x += this.vx;
        this.y += this.vy;
        this.opacity -= 0.015;
        this.vx *= 0.95;
        this.vy *= 0.95;
      }

      randBetween(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
    }

    const pushBalls = (count: number, centerX: number, centerY: number) => {
      const gapSize = 15;
      const halfCount = Math.floor(count / 2);

      for (let i = 0; i < halfCount; i++) {
        const offsetY = -gapSize - Math.random() * 15;
        balls.push(new Ball(centerX, centerY + offsetY, true));
      }

      for (let i = 0; i < count - halfCount; i++) {
        const offsetY = gapSize + Math.random() * 15;
        balls.push(new Ball(centerX, centerY + offsetY, false));
      }
    };

    const loop = () => {
      if (!ctx || balls.length === 0) {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        if (b.opacity <= 0) continue;

        ctx.strokeStyle = b.color;
        ctx.globalAlpha = b.opacity;
        ctx.lineWidth = 1;
        ctx.beginPath();

        const endX = b.x + (b.vx / Math.abs(b.vx + b.vy)) * b.length;
        const endY = b.y + (b.vy / Math.abs(b.vx + b.vy)) * b.length;

        ctx.moveTo(b.x, b.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.globalAlpha = 1;

        b.update();
      }

      removeBall();
      animationFrame = requestAnimationFrame(loop);
    };

    const removeBall = () => {
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        if (
          b.x < 0 ||
          b.x > window.innerWidth ||
          b.y < 0 ||
          b.y > window.innerHeight ||
          b.opacity <= 0
        ) {
          balls.splice(i, 1);
        }
      }
    };

    this.logo.addEventListener("mouseenter", () => {
      gsap.to(iconBar, {
        bottom: "1rem",
        duration: 0.2,
        ease: "power2.out",
      });
    });

    this.logo.addEventListener("mouseleave", () => {
      gsap.to(iconBar, {
        bottom: "0.4rem",
        duration: 0.2,
        ease: "power2.out",
      });
    });

    this.logo.addEventListener("click", (e) => {
      e.preventDefault();

      gsap.to(iconBar, {
        bottom: "0rem",
        duration: 0.1,
        ease: "power2.in",
        onComplete: () => {
          gsap.to(iconBar, {
            bottom: "0.4rem",
            duration: 0.15,
            ease: "power2.out",
          });
        },
      });

      const iconBarRect = iconBar.getBoundingClientRect();
      const barX = iconBarRect.left + iconBarRect.width / 2 - 10;
      const barY = iconBarRect.top + iconBarRect.height / 2;

      pushBalls(20, barX, barY);

      if (!animationFrame) {
        loop();
      }

      if (this.clickSound) {
        setTimeout(() => {
          this.clickSound!.currentTime = 0;
          this.clickSound!.play();
        }, 100);
      }
    });
  }

  private animateLinks(): void {
    if (!this.links) return;

    this.links.forEach((link) => {
      const text = link.querySelector("p");
      const subText = link.querySelector("strong");

      if (!text || !subText) return;

      WrapCharacters(text);
      WrapCharacters(subText);

      link.addEventListener("mouseenter", () => {
        const spans = text.querySelectorAll("span");
        const subSpans = subText.querySelectorAll("span");

        if (spans.length === 0 || subSpans.length === 0) return;

        gsap.killTweensOf(spans);
        gsap.killTweensOf(subSpans);

        gsap.to(spans, {
          top: "-3rem",
          duration: 0.5,
          ease: "power2.inOut",
          delay: (index) => index * 0.05,
        });
        gsap.to(subSpans, {
          top: "-3rem",
          duration: 0.5,
          ease: "power2.inOut",
          delay: (index) => index * 0.05,
        });
      });

      link.addEventListener("mouseleave", () => {
        const spans = text.querySelectorAll("span");
        const subSpans = subText.querySelectorAll("span");

        if (spans.length === 0 || subSpans.length === 0) return;

        gsap.killTweensOf(spans);
        gsap.killTweensOf(subSpans);

        gsap.to(spans, {
          top: "0rem",
          duration: 0.3,
          ease: "power2.inOut",
          delay: (index) => index * 0.05,
        });
        gsap.to(subSpans, {
          top: "0rem",
          duration: 0.3,
          ease: "power2.inOut",
          delay: (index) => index * 0.05,
        });
      });
    });
  }

  private animateletsTalk(): void {
    if (!this.letsTalk) return;

    const flair = this.letsTalk.querySelector(
      ".navbar-letstalk-flair"
    ) as HTMLElement;
    if (!flair) return;

    const xSet = gsap.quickSetter(flair, "xPercent");
    const ySet = gsap.quickSetter(flair, "yPercent");

    const getXY = (e: MouseEvent) => {
      const { left, top, width, height } =
        this.letsTalk!.getBoundingClientRect();

      const xTransformer = gsap.utils.pipe(
        gsap.utils.mapRange(0, width, 0, 100),
        gsap.utils.clamp(0, 100)
      );

      const yTransformer = gsap.utils.pipe(
        gsap.utils.mapRange(0, height, 0, 100),
        gsap.utils.clamp(0, 100)
      );

      return {
        x: xTransformer(e.clientX - left),
        y: yTransformer(e.clientY - top),
      };
    };

    this.letsTalk.addEventListener("mouseenter", (e) => {
      const { x, y } = getXY(e);

      xSet(x);
      ySet(y);

      gsap.to(flair, {
        scale: 1,
        duration: 0.4,
        ease: "power2.out",
      });
    });

    this.letsTalk.addEventListener("mouseleave", (e) => {
      const { x, y } = getXY(e);

      gsap.killTweensOf(flair);

      gsap.to(flair, {
        xPercent: x > 90 ? x + 20 : x < 10 ? x - 20 : x,
        yPercent: y > 90 ? y + 20 : y < 10 ? y - 20 : y,
        scale: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    this.letsTalk.addEventListener("mousemove", (e) => {
      const { x, y } = getXY(e);

      gsap.to(flair, {
        xPercent: x,
        yPercent: y,
        duration: 0.4,
        ease: "power2",
      });
    });

    new MagneticEffect(this.letsTalk, 60, 200);
  }

  private animateCrystal(): void {
    if (!this.crystalImage) return;

    gsap.set(this.crystalImage, { y: "-100vh", opacity: 0 });

    this.timeline.to(
      this.crystalImage,
      {
        y: "0vh",
        opacity: 1,
        duration: 1.2,
        ease: "power2.out",
      },
      0
    );
  }

  private setupCrystalParallax(): void {
    if (!this.crystalImage) return;

    setTimeout(() => {
      // Movimento do crystal - reduzido para ficar visível por mais tempo
      gsap.fromTo(
        this.crystalImage,
        {
          y: "0vh",
        },
        {
          y: "-30vh",
          ease: "none",
          scrollTrigger: {
            trigger: "body",
            start: "top top",
            end: "+=800vh",
            scrub: 1,
          },
        }
      );

      // Fade out gradual ao longo de toda a animação
      gsap.fromTo(
        this.crystalImage,
        {
          opacity: 1,
        },
        {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: "body",
            start: "+=400vh",
            end: "+=800vh",
            scrub: 1,
          },
        }
      );

      ScrollTrigger.refresh();
      console.log("Crystal parallax configurado com ScrollSmoother");
    }, 100);
  }

  private onLoadComplete(): void {
    this.timeline.play();

    this.timeline.eventCallback("onComplete", () => {
      this.setupCrystalParallax();
    });
  }
}

new NavbarAnimation();
