/**
 * GPU-driven Mars globe renderer using WebGL fragment shading.
 * Keeps the previous drag/zoom behavior while moving per-pixel work to the GPU.
 */
import { useEffect, useRef, useCallback } from "react";

interface Props {
  className?: string;
}

interface TexCache {
  source: HTMLImageElement | HTMLCanvasElement;
  w: number;
  h: number;
}

interface GLResources {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  quadBuffer: WebGLBuffer;
  texture: WebGLTexture;
  uniforms: {
    resolution: WebGLUniformLocation;
    yaw: WebGLUniformLocation;
    pitch: WebGLUniformLocation;
    scale: WebGLUniformLocation;
    lightDir: WebGLUniformLocation;
    tex: WebGLUniformLocation;
  };
}

let texCache: TexCache | null = null;
let texLoading = false;
const texCallbacks: Array<() => void> = [];

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function isPowerOfTwo(v: number) {
  return (v & (v - 1)) === 0;
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) {
    if (vs) gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return null;
  }

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function getUniformLocation(gl: WebGLRenderingContext, program: WebGLProgram, name: string) {
  const loc = gl.getUniformLocation(program, name);
  if (!loc) return null;
  return loc;
}

function loadTexture(onReady: () => void) {
  if (texCache) {
    onReady();
    return;
  }
  texCallbacks.push(onReady);
  if (texLoading) return;
  texLoading = true;

  const img = new Image();
  img.src = "/textures/8k_mars.jpg";
  img.onload = () => {
    texCache = {
      source: img,
      w: img.naturalWidth,
      h: img.naturalHeight,
    };
    texCallbacks.forEach((cb) => cb());
    texCallbacks.length = 0;
  };
  img.onerror = () => {
    const W = 1024;
    const H = 512;
    const tc = document.createElement("canvas");
    tc.width = W;
    tc.height = H;
    const ctx = tc.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#b03a14";
      ctx.fillRect(0, 0, W, H);
      const tones = ["#c24420", "#cf4e28", "#a02e10", "#b83c18", "#d05530", "#8a2508"];
      for (let i = 0; i < 200; i++) {
        ctx.beginPath();
        ctx.ellipse(
          Math.random() * W,
          Math.random() * H,
          Math.random() * 80 + 10,
          Math.random() * 35 + 8,
          Math.random() * Math.PI,
          0,
          Math.PI * 2,
        );
        const alphaHex = Math.floor(60 + Math.random() * 100)
          .toString(16)
          .padStart(2, "0");
        ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)] + alphaHex;
        ctx.fill();
      }
    }
    texCache = { source: tc, w: W, h: H };
    texCallbacks.forEach((cb) => cb());
    texCallbacks.length = 0;
  };
}

function createGLResources(canvas: HTMLCanvasElement): GLResources | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
  });
  if (!gl) return null;

  const vertexShader = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const fragmentShader = `
    precision mediump float;

    varying vec2 v_uv;

    uniform sampler2D u_tex;
    uniform vec2 u_resolution;
    uniform float u_yaw;
    uniform float u_pitch;
    uniform float u_scale;
    uniform vec3 u_lightDir;

    const float PI = 3.141592653589793;
    const float PI2 = 6.283185307179586;

    void main() {
      vec2 p = vec2((v_uv.x - 0.5) * 2.0, (0.5 - v_uv.y) * 2.0);
      p.x *= u_resolution.x / max(u_resolution.y, 1.0);
      p /= max(u_scale, 0.0001);

      float r2 = dot(p, p);
      float radial = sqrt(max(r2, 0.0));

      float sphereAlpha = 1.0 - smoothstep(0.995, 1.005, radial);
      if (sphereAlpha <= 0.0 && radial > 1.08) {
        discard;
      }

      float atmosphere = (1.0 - smoothstep(1.0, 1.07, radial)) * smoothstep(0.84, 1.0, radial);

      if (r2 > 1.0) {
        vec3 atmColor = vec3(0.82, 0.35, 0.12);
        gl_FragColor = vec4(atmColor * atmosphere * 0.45, atmosphere * 0.33);
        return;
      }

      float nz = sqrt(max(1.0 - r2, 0.0));
      vec3 n = vec3(p.x, p.y, nz);

      float cp = cos(u_pitch);
      float sp = sin(u_pitch);
      vec3 nRot = vec3(
        n.x,
        n.y * cp - n.z * sp,
        n.y * sp + n.z * cp
      );

      float phi = asin(clamp(nRot.y, -1.0, 1.0));
      float theta = atan(nRot.x, nRot.z) + u_yaw;
      vec2 texUv = vec2(fract(theta / PI2), 0.5 - phi / PI);

      vec3 base = texture2D(u_tex, texUv).rgb;

      vec3 lightDir = normalize(u_lightDir);
      float rawDiff = dot(nRot, lightDir);
      float diff = rawDiff > 0.0 ? (rawDiff * rawDiff * 0.5 + rawDiff * 0.5) : 0.0;
      float ambient = 0.08;
      float lightTerm = ambient + (1.0 - ambient) * diff;

      float limb = pow(max(n.z, 0.0), 0.35);
      float brightness = lightTerm * limb;

      vec3 color = base * vec3(1.05, 1.00, 0.95) * brightness;

      vec3 viewDir = vec3(0.0, 0.0, 1.0);
      vec3 reflectDir = reflect(-lightDir, nRot);
      float spec = pow(max(dot(reflectDir, viewDir), 0.0), 30.0) * 0.18;
      color += vec3(1.0, 0.84, 0.66) * spec;

      float hardLimb = smoothstep(0.60, 1.0, radial);
      color *= mix(1.0, 0.48, hardLimb * hardLimb);

      vec3 atmColor = vec3(0.80, 0.33, 0.10);
      color += atmColor * atmosphere * 0.16;

      gl_FragColor = vec4(color, max(sphereAlpha, atmosphere * 0.33));
    }
  `;

  const program = createProgram(gl, vertexShader, fragmentShader);
  if (!program) return null;

  const quadBuffer = gl.createBuffer();
  const texture = gl.createTexture();
  if (!quadBuffer || !texture) {
    gl.deleteProgram(program);
    if (quadBuffer) gl.deleteBuffer(quadBuffer);
    if (texture) gl.deleteTexture(texture);
    return null;
  }

  gl.useProgram(program);

  const positionLoc = gl.getAttribLocation(program, "a_pos");
  if (positionLoc < 0) {
    gl.deleteTexture(texture);
    gl.deleteBuffer(quadBuffer);
    gl.deleteProgram(program);
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  const resolution = getUniformLocation(gl, program, "u_resolution");
  const yaw = getUniformLocation(gl, program, "u_yaw");
  const pitch = getUniformLocation(gl, program, "u_pitch");
  const scale = getUniformLocation(gl, program, "u_scale");
  const lightDir = getUniformLocation(gl, program, "u_lightDir");
  const tex = getUniformLocation(gl, program, "u_tex");

  if (!resolution || !yaw || !pitch || !scale || !lightDir || !tex) {
    gl.deleteTexture(texture);
    gl.deleteBuffer(quadBuffer);
    gl.deleteProgram(program);
    return null;
  }

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(tex, 0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.clearColor(0, 0, 0, 0);

  return {
    gl,
    program,
    quadBuffer,
    texture,
    uniforms: { resolution, yaw, pitch, scale, lightDir, tex },
  };
}

function destroyGLResources(resources: GLResources | null) {
  if (!resources) return;
  const { gl, texture, quadBuffer, program } = resources;
  gl.deleteTexture(texture);
  gl.deleteBuffer(quadBuffer);
  gl.deleteProgram(program);
}

export default function ProceduralMarsGlobe({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<GLResources | null>(null);
  const supportsWebGLRef = useRef(true);

  const stateRef = useRef({
    yaw: 0.4,
    pitch: 0.08,
    scale: 1.0,
    dragging: false,
    lx: 0,
    ly: 0,
    velX: 0,
    velY: 0,
    rafId: 0,
    ready: false,
  });

  const uploadTextureIfReady = useCallback(() => {
    const resources = glRef.current;
    if (!resources || !texCache) return;

    const { gl, texture } = resources;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texCache.source);

    if (isPowerOfTwo(texCache.w) && isPowerOfTwo(texCache.h)) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  }, []);

  const renderFallback2D = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { scale } = stateRef.current;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.46 * scale;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    if (texCache) {
      ctx.drawImage(texCache.source, cx - R, cy - R, R * 2, R * 2);
    } else {
      ctx.fillStyle = "#b03a14";
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    }

    const shade = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.35, R * 0.1, cx, cy, R);
    shade.addColorStop(0, "rgba(255,220,180,0.12)");
    shade.addColorStop(0.6, "rgba(0,0,0,0.08)");
    shade.addColorStop(1, "rgba(0,0,0,0.62)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current.ready) return;

    const { yaw, pitch, scale } = stateRef.current;
    const resources = glRef.current;

    if (!resources) {
      renderFallback2D();
      return;
    }

    const { gl, program, uniforms } = resources;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.yaw, yaw);
    gl.uniform1f(uniforms.pitch, pitch);
    gl.uniform1f(uniforms.scale, scale);
    gl.uniform3f(uniforms.lightDir, -0.42, 0.58, 0.70);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [renderFallback2D]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resources = createGLResources(canvas);
    glRef.current = resources;
    supportsWebGLRef.current = !!resources;

    const s = stateRef.current;
    loadTexture(() => {
      s.ready = true;
      uploadTextureIfReady();
      render();
    });

    const loop = () => {
      if (s.ready) {
        if (!s.dragging) {
          s.velX *= 0.92;
          s.velY *= 0.92;
          if (Math.abs(s.velX) < 0.0005 && Math.abs(s.velY) < 0.0005) {
            s.velX = 0.0018;
          }
          s.yaw += s.velX;
          s.pitch += s.velY;
          s.pitch = clamp(s.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
        }
        render();
      }
      s.rafId = requestAnimationFrame(loop);
    };
    s.rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(s.rafId);
      destroyGLResources(glRef.current);
      glRef.current = null;
    };
  }, [render, uploadTextureIfReady]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current;
    s.dragging = true;
    s.lx = e.clientX;
    s.ly = e.clientY;
    s.velX = 0;
    s.velY = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const s = stateRef.current;
      if (!s.dragging) return;
      const dx = e.clientX - s.lx;
      const dy = e.clientY - s.ly;
      s.velX = dx * 0.005;
      s.velY = dy * 0.004;
      s.yaw += s.velX;
      s.pitch += s.velY;
      s.pitch = clamp(s.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
      s.lx = e.clientX;
      s.ly = e.clientY;
      render();
    },
    [render],
  );

  const onPointerUp = useCallback(() => {
    stateRef.current.dragging = false;
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      s.scale = clamp(s.scale * (e.deltaY > 0 ? 0.93 : 1.08), 0.4, 3.5);
      render();
    },
    [render],
  );

  const touchRef = useRef({ dist: 0 });
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchRef.current.dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    }
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        const s = stateRef.current;
        s.scale = clamp(s.scale * (dist / Math.max(touchRef.current.dist, 1)), 0.4, 3.5);
        touchRef.current.dist = dist;
        render();
      }
    },
    [render],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const nextW = Math.max(1, Math.round(rect.width * dpr));
      const nextH = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }

      if (supportsWebGLRef.current) {
        uploadTextureIfReady();
      }
      render();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    return () => ro.disconnect();
  }, [render, uploadTextureIfReady]);

  return (
    <div
      className={className}
      style={{ borderRadius: "50%", overflow: "hidden", position: "relative" }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          touchAction: "none",
          cursor: "grab",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      />
    </div>
  );
}
