import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ResourceLoader from "@/utils/resources";

gsap.registerPlugin(ScrollTrigger);

export default class HeaderAnimation {
  private header: HTMLElement | null = null;
  private videoDown: HTMLVideoElement | null = null;
  private timeline: gsap.core.Timeline;
  private scrollTrigger: ScrollTrigger | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private maskImage: HTMLImageElement | null = null;
  private maskImageOffsetX: number = 0;
  private maskImageScaledWidth: number = 0;
  private maskImageScaledHeight: number = 0;
  private lastFrameTime: number = 0;
  private isRendering: boolean = false;
  private letterOffsets: { x: number; y: number }[] = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ];
  private letterHoverOffsets: { y: number; rotation: number }[] = [
    { y: 0, rotation: 0 },
    { y: 0, rotation: 0 },
    { y: 0, rotation: 0 },
    { y: 0, rotation: 0 },
    { y: 0, rotation: 0 },
  ];
  private hoveredLetterIndex: number = -1;
  private isDragging: boolean = false;
  private draggedLetterIndex: number = -1;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private animationFrameId: number | null = null;

  constructor() {
    this.timeline = gsap.timeline({ paused: true });
    this.header = document.querySelector(".header");

    if (this.header) {
      this.videoDown = this.header.querySelector(".header-video-down");
      this.canvas = this.header.querySelector("#header-canvas");

      if (this.canvas) {
        this.ctx = this.canvas.getContext("2d");
        this.loadMaskImage();
      }
    }

    this.init();
  }

  private loadMaskImage(): void {
    this.maskImage = new Image();
    this.maskImage.onload = () => {
      this.setupCanvas();
      this.setupDragAndDrop();
      this.startRenderLoop();
    };
    this.maskImage.src = "/imgs/header/mask.png";
  }

  private setupDragAndDrop(): void {
    if (!this.canvas) return;

    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    document.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    document.addEventListener("mouseup", () => this.handleMouseUp());
    this.canvas.addEventListener("mouseleave", () => this.handleMouseLeave());
  }

  private handleMouseLeave(): void {
    // Reset hover quando sai do canvas
    if (this.hoveredLetterIndex !== -1) {
      gsap.to(this.letterHoverOffsets[this.hoveredLetterIndex], {
        y: 0,
        rotation: 0,
        duration: 0.3,
        ease: "power2.out",
      });
      this.hoveredLetterIndex = -1;
    }

    if (this.canvas) {
      this.canvas.removeAttribute("data-cursor");
    }
  }

  private startRenderLoop(): void {
    if (this.animationFrameId !== null) {
      return;
    }

    const render = (currentTime: number) => {
      if (this.isRendering) {
        this.animationFrameId = requestAnimationFrame(render);
        return;
      }

      this.isRendering = true;

      const deltaTime = this.lastFrameTime
        ? currentTime - this.lastFrameTime
        : 16.67;
      this.lastFrameTime = currentTime;

      const pixelsPerSecond = 18;
      const movement = (pixelsPerSecond * deltaTime) / 1000;
      this.maskImageOffsetX -= movement;

      if (
        this.maskImageScaledWidth > 0 &&
        this.maskImageOffsetX <= -this.maskImageScaledWidth
      ) {
        this.maskImageOffsetX = 0;
      }

      this.drawLetters();

      this.isRendering = false;
      this.animationFrameId = requestAnimationFrame(render);
    };
    this.animationFrameId = requestAnimationFrame(render);
  }

  private getLetterAtPosition(x: number, y: number): number {
    const letterSpacing = 40;
    const letterWidth = 332;
    const letterHeight = 440;
    const totalLetters = 5;

    const targetWidth = this.canvas!.width * 0.9;
    const baseContentWidth =
      letterWidth * totalLetters + letterSpacing * (totalLetters - 1);
    const scale = targetWidth / baseContentWidth;

    const offsetX = this.canvas!.width * 0.05;
    const offsetY =
      (this.canvas!.height - (letterHeight + 45 * 10) * scale) / 2 + 250;

    for (let i = 0; i < totalLetters; i++) {
      const letterX =
        offsetX +
        i * (letterWidth + letterSpacing) * scale +
        this.letterOffsets[i].x;
      const letterY =
        offsetY + this.letterOffsets[i].y + this.letterHoverOffsets[i].y;
      const scaledWidth = letterWidth * scale;
      const scaledHeight = letterHeight * scale;

      if (
        x >= letterX &&
        x <= letterX + scaledWidth &&
        y >= letterY &&
        y <= letterY + scaledHeight
      ) {
        return i;
      }
    }

    return -1;
  }

  private handleMouseDown(e: MouseEvent): void {
    const rect = this.canvas!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const letterIndex = this.getLetterAtPosition(mouseX, mouseY);

    if (letterIndex !== -1) {
      this.isDragging = true;
      this.draggedLetterIndex = letterIndex;
      this.dragStartX = mouseX;
      this.dragStartY = mouseY;

      gsap.to(this.letterHoverOffsets[letterIndex], {
        rotation: 0,
        duration: 0.2,
        ease: "power2.out",
      });

      this.letterHoverOffsets[letterIndex].y = -50;
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (this.isDragging && this.draggedLetterIndex !== -1) {
      const deltaX = mouseX - this.dragStartX;
      const deltaY = mouseY - this.dragStartY;

      this.letterOffsets[this.draggedLetterIndex].x = deltaX;
      this.letterOffsets[this.draggedLetterIndex].y = deltaY;
    } else {
      const letterIndex = this.getLetterAtPosition(mouseX, mouseY);

      if (letterIndex !== this.hoveredLetterIndex) {
        if (this.hoveredLetterIndex !== -1) {
          gsap.to(this.letterHoverOffsets[this.hoveredLetterIndex], {
            y: 0,
            rotation: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        }

        if (letterIndex !== -1) {
          gsap.to(this.letterHoverOffsets[letterIndex], {
            y: -50,
            rotation: -5,
            duration: 0.3,
            ease: "power2.out",
          });

          this.canvas!.setAttribute("data-cursor", "pointer");
        } else {
          this.canvas!.removeAttribute("data-cursor");
        }

        this.hoveredLetterIndex = letterIndex;
      }
    }
  }

  private handleMouseUp(): void {
    if (!this.isDragging || this.draggedLetterIndex === -1) return;

    const index = this.draggedLetterIndex;

    gsap.to(this.letterOffsets[index], {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    });

    gsap.to(this.letterHoverOffsets[index], {
      y: 0,
      rotation: 0,
      duration: 0.3,
      ease: "power2.out",
    });

    if (this.canvas) {
      this.canvas.removeAttribute("data-cursor");
    }

    this.isDragging = false;
    this.draggedLetterIndex = -1;
    this.hoveredLetterIndex = -1;
  }

  private init(): void {
    this.setup();

    const resourceLoader = ResourceLoader.getInstance();
    resourceLoader.onComplete(() => this.onLoadComplete());
    resourceLoader.start();
  }

  private setupCanvas(): void {
    if (!this.canvas || !this.ctx) return;

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    if (this.maskImage) {
      const imgWidth = this.maskImage.width;
      const imgHeight = this.maskImage.height;
      const scaleX = this.canvas.width / imgWidth;
      const scaleY = this.canvas.height / imgHeight;
      const imageScale = Math.max(scaleX, scaleY);
      this.maskImageScaledWidth = Math.ceil(imgWidth * imageScale);
      this.maskImageScaledHeight = Math.ceil(imgHeight * imageScale);
    }
  }

  private drawLetters(): void {
    if (!this.ctx || !this.canvas || !this.maskImage) return;

    const letterSpacing = 40;
    const letterWidth = 332;
    const letterHeight = 440;
    const totalLetters = 5;
    const rectHeight = 45 * 10;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const targetWidth = this.canvas.width * 0.9;
    const baseContentWidth =
      letterWidth * totalLetters + letterSpacing * (totalLetters - 1);
    const scale = targetWidth / baseContentWidth;

    const contentWidth = baseContentWidth * scale;
    const contentHeight = (letterHeight + rectHeight) * scale;

    const offsetX = this.canvas.width * 0.05;
    const offsetY = (this.canvas.height - contentHeight) / 2 + 250;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) return;

    const letters = [
      {
        name: "G",
        path: "M0.0300266 61.2537L0.0300128 377.796C0.0300113 411.632 33.0446 439.08 73.7707 439.08L331.803 439.08L331.803 199.097L188.87 199.097L188.87 280.779L250.14 280.779L250.14 311.421L117.419 311.421L117.419 127.599L331.803 127.599L331.803 0L73.7406 -1.12828e-05C33.0145 -1.30634e-05 -6.22334e-05 27.418 -6.37133e-05 61.2838L0.0300266 61.2537Z",
      },
      {
        name: "U",
        path: "M331.648 306.381L183.196 439.04H21C9.40213 439.04 0 429.638 0 418.04V0H107.186V344.814H221.297V0H331.648V306.381ZM331.648 418.04C331.648 429.638 322.246 439.04 310.648 439.04H230.575L331.648 353.759V418.04Z",
      },
      {
        name: "S",
        path: "M331.171 79.3818H91.7852V192.253H331.171V418.08C331.171 429.678 321.769 439.08 310.171 439.08H0V372.103H240.626V259.231H0V21C0.00020104 9.40228 9.40227 0.000150005 21 0H331.171V79.3818Z",
      },
      {
        name: "T",
        path: "M218.3 107.909V439.08H114.111V107.909H0V0H331.171V107.909H218.3Z",
      },
      {
        name: "A",
        path: "M310.171 0C321.769 0.000214122 331.171 9.40233 331.171 21V439.08H220.78V267.914H106.669V439.08H0V21C0.000206466 9.4022 9.40215 0 21 0H310.171ZM127.669 79.3818C116.071 79.3818 106.669 88.784 106.669 100.382V202.175H220.78V100.382C220.78 88.7841 211.378 79.382 199.78 79.3818H127.669Z",
      },
    ];

    letters.forEach((letter, index) => {
      tempCtx.save();

      const xPosition =
        offsetX +
        index * (letterWidth + letterSpacing) * scale +
        this.letterOffsets[index].x;
      const yPosition =
        offsetY +
        this.letterOffsets[index].y +
        this.letterHoverOffsets[index].y;
      tempCtx.translate(xPosition, yPosition);

      tempCtx.translate((letterWidth * scale) / 2, (letterHeight * scale) / 2);

      const rotation =
        this.letterHoverOffsets[index].rotation * (Math.PI / 180);
      tempCtx.rotate(rotation);

      tempCtx.translate(
        (-letterWidth * scale) / 2,
        (-letterHeight * scale) / 2
      );

      tempCtx.scale(scale, scale);

      const path = new Path2D(letter.path);

      if (index === 0) {
        tempCtx.globalCompositeOperation = "source-over";
      } else {
        tempCtx.globalCompositeOperation = "xor";
      }

      tempCtx.fillStyle = "#FFFFFF";
      tempCtx.fill(path);

      tempCtx.restore();
    });

    tempCtx.save();
    tempCtx.globalCompositeOperation = "xor";

    const borderRadius = 8.4 * 10;
    const rectY = offsetY + 268 * scale;
    const rectWidthBase =
      letterWidth * totalLetters + letterSpacing * (totalLetters - 1);

    tempCtx.beginPath();
    tempCtx.roundRect(
      offsetX,
      rectY,
      rectWidthBase * scale,
      rectHeight * scale,
      [
        borderRadius * scale,
        borderRadius * scale,
        borderRadius * scale,
        borderRadius * scale,
      ]
    );
    tempCtx.fillStyle = "#FFFFFF";
    tempCtx.fill();

    tempCtx.restore();

    const scaledWidth = this.maskImageScaledWidth;
    const scaledHeight = this.maskImageScaledHeight;

    this.ctx.drawImage(
      this.maskImage,
      Math.floor(this.maskImageOffsetX),
      0,
      scaledWidth,
      scaledHeight
    );

    this.ctx.drawImage(
      this.maskImage,
      Math.floor(this.maskImageOffsetX + scaledWidth) - 1,
      0,
      scaledWidth,
      scaledHeight
    );

    this.ctx.drawImage(
      this.maskImage,
      Math.floor(this.maskImageOffsetX + scaledWidth * 2) - 2,
      0,
      scaledWidth,
      scaledHeight
    );

    this.ctx.globalCompositeOperation = "destination-in";
    this.ctx.drawImage(tempCanvas, 0, 0);

    this.ctx.globalCompositeOperation = "source-over";
  }

  private setup(): void {
    if (this.videoDown) {
      gsap.set(this.videoDown, { x: "32%", y: "100vh", opacity: 0 });
      this.videoDown.loop = true;
    }

    this.animateVideos();
  }

  private animateVideos(): void {
    if (this.videoDown) {
      this.timeline.to(
        this.videoDown,
        {
          x: "42%",
          y: "65%",
          opacity: 1,
          duration: 1.2,
          ease: "power2.out",
          onStart: () => {
            this.videoDown?.play().catch(() => {});
          },
        },
        0.2
      );
    }
  }

  private setupScrollAnimation(): void {
    if (!this.videoDown) return;

    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.header,
      start: "top top",
      end: "bottom top",
      scrub: 1,
      scroller: "#smooth-wrapper",
      onUpdate: (self) => {
        if (this.videoDown) {
          const scrollSpeed = self.getVelocity() / 1000;
          const playbackRate = 1 + Math.abs(scrollSpeed) * 2;
          this.videoDown.playbackRate = Math.min(playbackRate, 3);
        }
      },
    });

    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (this.videoDown) {
          gsap.to(this.videoDown, {
            playbackRate: 1,
            duration: 0.5,
            ease: "power2.out",
          });
        }
      }, 150);
    });
  }

  private onLoadComplete(): void {
    this.timeline.play();

    this.timeline.eventCallback("onComplete", () => {
      this.setupScrollAnimation();
    });
  }
}

new HeaderAnimation();
