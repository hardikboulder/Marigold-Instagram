declare module "gif.js.optimized" {
  interface GifJsOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    repeat?: number;
    background?: string;
    transparent?: string | null;
    dither?: boolean | string;
    debug?: boolean;
  }

  interface AddFrameOptions {
    delay?: number;
    copy?: boolean;
    dispose?: number;
  }

  class GifJsInstance {
    constructor(options?: GifJsOptions);
    addFrame(
      image:
        | CanvasRenderingContext2D
        | HTMLCanvasElement
        | HTMLImageElement
        | ImageData,
      options?: AddFrameOptions,
    ): void;
    on(event: "finished", cb: (blob: Blob) => void): void;
    on(event: "progress", cb: (progress: number) => void): void;
    on(event: "abort", cb: () => void): void;
    on(event: "start", cb: () => void): void;
    render(): void;
    abort(): void;
  }

  export default GifJsInstance;
}
