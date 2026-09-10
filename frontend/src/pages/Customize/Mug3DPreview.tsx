/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Mug3DPreview.tsx
 * Module: Customize
 * Language: TypeScript React
 * Description:
 * Client-side realistic 3D mug renderer. Supports the real Magic Touch
 * mug families, 11 oz / 15 oz proportions, artwork wrapping and touch
 * interaction without permanently storing the customer's artwork.
 * ================================================================
 */

import { useEffect, useRef } from "react";

const THREE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.185.1/three.min.js";

declare global {
    interface Window {
        THREE?: any;
    }
}

type MugStyle = "colored-handle" | "solid";
type MugSize = "11 oz" | "15 oz";

type Mug3DPreviewProps = {
    mugStyle: MugStyle;
    mugSize: MugSize;
    mugBodyColor: string;
    mugAccentColor: string;
    designUrl: string | null;
    designScale: number;
    designX: number;
    designY: number;
    designRotation: number;
    rotation: number;
    onRotationChange: (rotation: number) => void;
};

function loadThree(): Promise<any> {
    if (window.THREE) return Promise.resolve(window.THREE);

    return new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-mtd-three="true"]');

        if (existing) {
            existing.addEventListener("load", () => window.THREE ? resolve(window.THREE) : reject(new Error("Three.js did not initialize.")));
            existing.addEventListener("error", () => reject(new Error("Three.js could not be loaded.")));
            return;
        }

        const script = document.createElement("script");
        script.src = THREE_CDN;
        script.async = true;
        script.dataset.mtdThree = "true";
        script.onload = () => window.THREE ? resolve(window.THREE) : reject(new Error("Three.js did not initialize."));
        script.onerror = () => reject(new Error("Three.js could not be loaded."));
        document.head.appendChild(script);
    });
}

function drawArtworkTexture(
    THREE: any,
    designUrl: string | null,
    bodyColor: string,
    scale: number,
    x: number,
    y: number,
    rotation: number
) {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 900;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = bodyColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;

    if (!designUrl) return { texture, canvas };

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
        const maxWidth = 920 * scale;
        const maxHeight = 620 * scale;
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const width = image.width * ratio;
        const height = image.height * ratio;
        const centerX = canvas.width * (0.5 + x / 100);
        const centerY = canvas.height * (0.5 - y / 100);

        context.save();
        context.translate(centerX, centerY);
        context.rotate((rotation * Math.PI) / 180);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, -width / 2, -height / 2, width, height);
        context.restore();
        texture.needsUpdate = true;
    };
    image.src = designUrl;

    return { texture, canvas };
}

function Mug3DPreview({
    mugStyle,
    mugSize,
    mugBodyColor,
    mugAccentColor,
    designUrl,
    designScale,
    designX,
    designY,
    designRotation,
    rotation,
    onRotationChange,
}: Mug3DPreviewProps) {
    const hostRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<any>(null);
    const sceneRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const mugGroupRef = useRef<any>(null);
    const animationRef = useRef<number | null>(null);
    const rotationRef = useRef(rotation);
    const zoomRef = useRef(5.8);
    const interactionRef = useRef({ active: false, startX: 0, startRotation: 0 });

    useEffect(() => {
        rotationRef.current = rotation;
        if (mugGroupRef.current) mugGroupRef.current.rotation.y = rotation;
    }, [rotation]);

    useEffect(() => {
        let disposed = false;
        let resizeObserver: ResizeObserver | null = null;
        let cleanup: (() => void) | undefined;

        const setup = async () => {
            try {
                const THREE = await loadThree();
                if (disposed || !hostRef.current) return;

                const host = hostRef.current;
                const scene = new THREE.Scene();
                scene.background = new THREE.Color("#f1f3f5");
                sceneRef.current = scene;

                const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
                camera.position.set(0, 0.35, zoomRef.current);
                camera.lookAt(0, 0.1, 0);
                cameraRef.current = camera;

                const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.12;
                rendererRef.current = renderer;
                host.replaceChildren(renderer.domElement);

                scene.add(new THREE.HemisphereLight("#ffffff", "#777777", 2.25));
                const key = new THREE.DirectionalLight("#ffffff", 4.2);
                key.position.set(3.5, 5, 4.5);
                key.castShadow = true;
                key.shadow.mapSize.set(1024, 1024);
                scene.add(key);
                const fill = new THREE.DirectionalLight("#ffffff", 1.45);
                fill.position.set(-4, 2, 2);
                scene.add(fill);
                const rimLight = new THREE.DirectionalLight("#ffffff", 1.1);
                rimLight.position.set(1, 3, -4);
                scene.add(rimLight);

                const mugGroup = new THREE.Group();
                mugGroup.rotation.y = rotationRef.current;
                const sizeScale = mugSize === "15 oz" ? { x: 1.045, y: 1.16, z: 1.045 } : { x: 1, y: 1, z: 1 };
                mugGroup.scale.set(sizeScale.x, sizeScale.y, sizeScale.z);
                mugGroupRef.current = mugGroup;
                scene.add(mugGroup);

                const bodyMaterial = new THREE.MeshPhysicalMaterial({ color: mugBodyColor, roughness: 0.24, metalness: 0, clearcoat: 0.18, clearcoatRoughness: 0.2 });
                const body = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.36, 2.72, 128, 1, false), bodyMaterial);
                body.position.y = 0.05;
                body.castShadow = true;
                body.receiveShadow = true;
                mugGroup.add(body);

                const accent = mugStyle === "solid" ? mugBodyColor : mugAccentColor;
                const insideMaterial = new THREE.MeshPhysicalMaterial({ color: accent, roughness: 0.3, clearcoat: 0.12 });
                const inside = new THREE.Mesh(new THREE.CylinderGeometry(1.23, 1.23, 0.18, 128), insideMaterial);
                inside.position.y = 1.38;
                inside.castShadow = true;
                mugGroup.add(inside);

                const rimMaterial = new THREE.MeshPhysicalMaterial({ color: accent, roughness: 0.22, clearcoat: 0.22 });
                const rim = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.105, 24, 128), rimMaterial);
                rim.rotation.x = Math.PI / 2;
                rim.position.y = 1.43;
                rim.castShadow = true;
                mugGroup.add(rim);

                const bottomRing = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.045, 14, 128), bodyMaterial.clone());
                bottomRing.rotation.x = Math.PI / 2;
                bottomRing.position.y = -1.31;
                mugGroup.add(bottomRing);

                const handleMaterial = new THREE.MeshPhysicalMaterial({ color: accent, roughness: 0.25, clearcoat: 0.2 });
                const handle = new THREE.Mesh(new THREE.TorusGeometry(0.83, 0.19, 32, 128, Math.PI * 1.58), handleMaterial);
                handle.rotation.z = Math.PI / 2;
                handle.rotation.y = Math.PI;
                handle.position.set(1.48, 0.05, 0);
                handle.castShadow = true;
                mugGroup.add(handle);

                const artwork = drawArtworkTexture(THREE, designUrl, mugBodyColor, designScale, designX, designY, designRotation);
                if (artwork) {
                    const artworkMaterial = new THREE.MeshPhysicalMaterial({ map: artwork.texture, roughness: 0.31, metalness: 0, clearcoat: 0.08 });
                    const artworkMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.425, 1.365, 2.68, 128, 1, false, -Math.PI, Math.PI * 2), artworkMaterial);
                    artworkMesh.position.y = 0.05;
                    artworkMesh.castShadow = true;
                    artworkMesh.receiveShadow = true;
                    mugGroup.add(artworkMesh);
                }

                const floor = new THREE.Mesh(new THREE.CircleGeometry(4.4, 96), new THREE.MeshStandardMaterial({ color: "#d7dade", roughness: 0.82, metalness: 0 }));
                floor.rotation.x = -Math.PI / 2;
                floor.position.y = -1.42;
                floor.receiveShadow = true;
                scene.add(floor);

                const onPointerDown = (event: PointerEvent) => {
                    interactionRef.current = { active: true, startX: event.clientX, startRotation: rotationRef.current };
                    renderer.domElement.setPointerCapture?.(event.pointerId);
                    renderer.domElement.style.cursor = "grabbing";
                };
                const onPointerMove = (event: PointerEvent) => {
                    if (!interactionRef.current.active) return;
                    const delta = event.clientX - interactionRef.current.startX;
                    const next = interactionRef.current.startRotation + delta * 0.012;
                    rotationRef.current = next;
                    mugGroup.rotation.y = next;
                    onRotationChange(next);
                };
                const onPointerUp = () => {
                    interactionRef.current.active = false;
                    renderer.domElement.style.cursor = "grab";
                };
                const onWheel = (event: WheelEvent) => {
                    event.preventDefault();
                    zoomRef.current = Math.max(4.35, Math.min(7.4, zoomRef.current + event.deltaY * 0.0025));
                    camera.position.z = zoomRef.current;
                    camera.lookAt(0, 0.1, 0);
                };

                renderer.domElement.addEventListener("pointerdown", onPointerDown);
                renderer.domElement.addEventListener("pointermove", onPointerMove);
                renderer.domElement.addEventListener("pointerup", onPointerUp);
                renderer.domElement.addEventListener("pointercancel", onPointerUp);
                renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
                renderer.domElement.style.touchAction = "none";
                renderer.domElement.style.cursor = "grab";

                const resize = () => {
                    const width = Math.max(1, host.clientWidth);
                    const height = Math.max(1, host.clientHeight);
                    renderer.setSize(width, height, false);
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                };
                resizeObserver = new ResizeObserver(resize);
                resizeObserver.observe(host);
                resize();

                const animate = () => {
                    if (disposed) return;
                    animationRef.current = requestAnimationFrame(animate);
                    renderer.render(scene, camera);
                };
                animate();

                cleanup = () => {
                    renderer.domElement.removeEventListener("pointerdown", onPointerDown);
                    renderer.domElement.removeEventListener("pointermove", onPointerMove);
                    renderer.domElement.removeEventListener("pointerup", onPointerUp);
                    renderer.domElement.removeEventListener("pointercancel", onPointerUp);
                    renderer.domElement.removeEventListener("wheel", onWheel);
                    renderer.dispose();
                    scene.traverse((object: any) => {
                        object.geometry?.dispose?.();
                        const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
                        materials.forEach((material: any) => {
                            material.map?.dispose?.();
                            material.dispose?.();
                        });
                    });
                };
            } catch {
                if (!disposed && hostRef.current) hostRef.current.innerHTML = "<div class=\"mug-3d-preview__error\">3D preview could not be loaded. Please refresh and try again.</div>";
            }
        };

        void setup();
        return () => {
            disposed = true;
            if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
            resizeObserver?.disconnect();
            cleanup?.();
            rendererRef.current = null;
            sceneRef.current = null;
            cameraRef.current = null;
            mugGroupRef.current = null;
        };
    }, [mugStyle, mugSize, mugBodyColor, mugAccentColor, designUrl, designScale, designX, designY, designRotation, onRotationChange]);

    return (
        <div className="mug-3d-preview">
            <div className="mug-3d-preview__topbar">
                <span className="mug-3d-preview__badge">LIVE 3D PREVIEW</span>
                <span className="mug-3d-preview__size">{mugSize} · {mugStyle === "solid" ? "Solid" : "Colored Handle"}</span>
            </div>
            <div ref={hostRef} className="mug-3d-preview__canvas" />
            <div className="mug-3d-preview__hint"><span>↔</span> Drag to rotate · Scroll/pinch to zoom · Inspect every side</div>
        </div>
    );
}

export default Mug3DPreview;
