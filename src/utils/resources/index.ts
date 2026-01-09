type ResourceType = "image" | "video" | "audio" | "background";

interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export default class ResourceLoader {
  private static instance: ResourceLoader | null = null;
  private resources: HTMLElement[] = [];
  private loadedCount: number = 0;
  private totalResources: number = 0;
  private onCompleteCallbacks: Array<() => void> = [];
  private isStarted: boolean = false;
  private isCompleted: boolean = false;
  private loadedElements: WeakSet<HTMLElement> = new WeakSet();

  private constructor() {}

  public static getInstance(): ResourceLoader {
    if (!ResourceLoader.instance) {
      ResourceLoader.instance = new ResourceLoader();
    }
    return ResourceLoader.instance;
  }

  public onComplete(callback: () => void): void {
    this.onCompleteCallbacks.push(callback);
    
    // Se já completou, executa o callback imediatamente
    if (this.isCompleted) {
      callback();
    }
  }

  public start(): void {
    // Se já foi iniciado, não faz nada
    if (this.isStarted) {
      return;
    }

    this.isStarted = true;
    this.collectResources();

    if (this.totalResources === 0) {
      console.log(
        "[ResourceLoader] Nenhum recurso encontrado, completando imediatamente"
      );
      this.complete();
      return;
    }

    this.monitorResources();
  }

  private collectResources(): void {
    const images = Array.from(
      document.querySelectorAll("img")
    ) as HTMLImageElement[];
    const videos = Array.from(
      document.querySelectorAll("video")
    ) as HTMLVideoElement[];
    const audios = Array.from(
      document.querySelectorAll("audio")
    ) as HTMLAudioElement[];
    const elementsWithBg = this.getElementsWithBackgroundImages();

    this.resources = [...images, ...videos, ...audios, ...elementsWithBg];
    this.totalResources = this.resources.length;

    this.logResourcesSummary(
      images.length,
      videos.length,
      audios.length,
      elementsWithBg.length
    );
  }

  private logResourcesSummary(
    images: number,
    videos: number,
    audios: number,
    backgrounds: number
  ): void {
    console.log(`[ResourceLoader] Total de recursos: ${this.totalResources}`);
    console.log(`- Imagens: ${images}`);
    console.log(`- Vídeos: ${videos}`);
    console.log(`- Áudios: ${audios}`);
    console.log(`- Backgrounds: ${backgrounds}`);
  }

  private getElementsWithBackgroundImages(): HTMLElement[] {
    const elements: HTMLElement[] = [];
    const allElements = document.querySelectorAll("*");

    allElements.forEach((element) => {
      const bgImage = window.getComputedStyle(element).backgroundImage;
      if (bgImage && bgImage !== "none" && bgImage.includes("url(")) {
        elements.push(element as HTMLElement);
      }
    });

    return elements;
  }

  private monitorResources(): void {
    this.resources.forEach((resource) => {
      if (resource instanceof HTMLImageElement) {
        this.monitorImage(resource);
      } else if (resource instanceof HTMLVideoElement) {
        this.monitorVideo(resource);
      } else if (resource instanceof HTMLAudioElement) {
        this.monitorAudio(resource);
      } else {
        this.monitorBackgroundImage(resource);
      }
    });
  }

  private monitorImage(img: HTMLImageElement): void {
    const resourceUrl = img.src || "imagem";
    
    if (img.complete && img.naturalHeight !== 0) {
      this.onResourceLoaded(img, resourceUrl);
    } else {
      img.addEventListener("load", () =>
        this.onResourceLoaded(img, resourceUrl), { once: true }
      );
      img.addEventListener("error", () =>
        this.onResourceError(img, resourceUrl), { once: true }
      );
    }
  }

  private monitorVideo(video: HTMLVideoElement): void {
    const resourceUrl = video.src || video.currentSrc || "vídeo";
    
    if (video.readyState >= 3) {
      this.onResourceLoaded(video, resourceUrl);
    } else {
      video.addEventListener("canplaythrough", () =>
        this.onResourceLoaded(video, resourceUrl), { once: true }
      );
      video.addEventListener("error", () =>
        this.onResourceError(video, resourceUrl), { once: true }
      );
    }
  }

  private monitorAudio(audio: HTMLAudioElement): void {
    const resourceUrl = audio.src || audio.currentSrc || "áudio";
    
    if (audio.readyState >= 3) {
      this.onResourceLoaded(audio, resourceUrl);
    } else {
      audio.addEventListener("canplaythrough", () =>
        this.onResourceLoaded(audio, resourceUrl), { once: true }
      );
      audio.addEventListener("error", () =>
        this.onResourceError(audio, resourceUrl), { once: true }
      );
    }
  }

  private monitorBackgroundImage(element: HTMLElement): void {
    const bgImage = window.getComputedStyle(element).backgroundImage;
    const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);

    if (!urlMatch) {
      this.onResourceLoaded(element, "background");
      return;
    }

    const imageUrl = urlMatch[1];
    const img = new Image();

    img.onload = () => this.onResourceLoaded(element, imageUrl);
    img.onerror = () => this.onResourceError(element, imageUrl);
    img.src = imageUrl;
  }

  private onResourceLoaded(element: HTMLElement, resourceName: string): void {
    // Verifica se o elemento já foi processado
    if (this.loadedElements.has(element)) {
      return;
    }

    // Marca elemento como processado
    this.loadedElements.add(element);
    this.loadedCount++;

    const percentage = Math.floor(
      (this.loadedCount / this.totalResources) * 100
    );

    console.log(
      `[ResourceLoader] Carregado (${this.loadedCount}/${this.totalResources}): ${resourceName}`
    );

    const progress: LoadProgress = {
      loaded: this.loadedCount,
      total: this.totalResources,
      percentage,
    };

    if (this.loadedCount >= this.totalResources) {
      this.complete();
    }
  }

  private onResourceError(element: HTMLElement, resourceName: string): void {
    console.warn(`[ResourceLoader] Erro ao carregar: ${resourceName}`);
    this.onResourceLoaded(element, resourceName);
  }

  private complete(): void {
    console.log("[ResourceLoader] Todos os recursos carregados!");
    this.isCompleted = true;
    
    // Executa todos os callbacks registrados
    this.onCompleteCallbacks.forEach(callback => callback());
  }
}
