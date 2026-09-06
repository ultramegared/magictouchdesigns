/**
 * ================================================================
 * Author: ultramegared
 * Project: Magic Touch Designs
 * File: Mug3DPreview.tsx
 * Module: Frontend
 * Language: TypeScript React
 * Description:
 * Client-side realistic 3D mug renderer used by the Customize page.
 * The customer's uploaded artwork remains client-side only.
 * ================================================================
 */

import { useEffect, useRef } from "react";

const THREE_CDN =
    "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.min.js";

declare global {
    interface Window {
        THREE?: any;
    }
}

type Mug3DPreviewProps = {
    mugColor: string;
    designUrl: string | null;
    designScale: number;
    designX: number;
    designY: number;
    designRotation: number;
    rotation: number;
    onRotationChange: (rotation: number) => void;
};

function loadThree(): Promise<any> {
    if (window.THREE) {
        return Promise.resolve(window.THREE);
    }

    return new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
            'script[data-mtd-three="true"]'
        );

        if (existing) {
            existing.addEventListener("load", () => {
                if (window.THREE) {
                    resolve(window.THREE);
                } else {
                    reject(new Error("Three.js did not initialize."));
                }
            });
            existing.addEventListener("error", () => {
                reject(new Error("Three.js could not be loaded."));
            });
            return;
        }

        const script = document.createElement("script");
        script.src = THREE_CDN;
        script.async = true;
        script.dataset.mtdThree = "true";
        script.onload = () => {
            if (window.THREE) {
                resolve(window.THREE);
            } else {
                reject(new Error("Three.js did not initialize."));
            }
        };
        script.onerror = () => reject(new Error("Three.js could not be loaded."));
        document.head.appendChild(script);
    });
}

function Mug3DPreview({
    mugColor,
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
    const mugRef = useRef<any>(null);
    const artworkRef = useRef<any>(null);
    const animationRef = useRef<number | null>(null);
    const rotationRef = useRef(rotation);
    const interactionRef = useRef({
        active: false,
        startX: 0,
        startRotation: 0,
    });
    const textureCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const textureRef = useRef<any>(null);
    const designImageRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        rotationRef.current = rotation;
    }, [rotation]);

    useEffect(() => {
        let disposed = false;

        const setup = async () => {
            const THREE = await loadThree();
            if (disposed || !hostRef.current) {
                return;
            }

            const host = hostRef.current;
            const scene = new THREE.Scene();
            scene.background = new THREE.Color("#f3f4f6");
            sceneRef.current = scene;

            const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
            camera.position.set(4.5, 2.8, 5.8);
            camera.lookAt(0, 0, 0);
            cameraRef.current = camera;

            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: false,
                preserveDrawingBuffer: true,
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            host.replaceChildren(renderer.domElement);
            rendererRef.current = renderer;

            const ambient = new THREE.HemisphereLight("#ffffff", "#b8b8b8", 2.2);
            scene.add(ambient);

            const key = new THREE.DirectionalLight("#ffffff", 3.4);
            key.position.set(4, 6, 5);
            key.castShadow = true;
            key.shadow.mapSize.set(1024, 1024);
            scene.add(key);

            const fill = new THREE.DirectionalLight("#ffffff", 1.4);
            fill.position.set(-4, 2, 2);
            scene.add(fill);

            const floor = new THREE.Mesh(
                new THREE.PlaneGeometry(20, 20),
                new THREE.MeshStandardMaterial({
                    color: "#e7e7e7",
                    roughness: 0.96,
                    metalness: 0,
                })
            );
            floor.rotation.x = -Math.PI / 2;
            floor.position.y = -1.52;
            floor.receiveShadow = true;
            scene.add(floor);

            const mug = new THREE.Group();
            mug.rotation.y = rotationRef.current;
            mugRef.current = mug;
            scene.add(mug);

            const body = new THREE.Mesh(
                new THREE.CylinderGeometry(1.38, 1.48, 2.65, 96, 32, true),
                new THREE.MeshPhysicalMaterial({
                    color: mugColor,
                    roughness: 0.22,
                    metalness: 0,
                    clearcoat: 0.28,
                    clearcoatRoughness: 0.2,
                })
            );
            body.castShadow = true;
            body.receiveShadow = true;
            mug.add(body);

            const topRim = new THREE.Mesh(
                new THREE.TorusGeometry(1.38, 0.095, 32, 96),
                new THREE.MeshPhysicalMaterial({
                    color: mugColor,
                    roughness: 0.18,
                    clearcoat: 0.35,
                })
            );
            topRim.rotation.x = Math.PI / 2;
            topRim.position.y = 1.325;
            topRim.castShadow = true;
            mug.add(topRim);

            const bottomRim = new THREE.Mesh(
                new THREE.TorusGeometry(1.47, 0.075, 24, 96),
                new THREE.MeshStandardMaterial({
                    color: mugColor,
                    roughness: 0.3,
                })
            );
            bottomRim.rotation.x = Math.PI / 2;
            bottomRim.position.y = -1.325;
            mug.add(bottomRim);

            const interior = new THREE.Mesh(
                new THREE.CylinderGeometry(1.18, 1.18, 0.18, 96),
                new THREE.MeshPhysicalMaterial({
                    color: "#171717",
                    roughness: 0.22,
                    metalness: 0.04,
                })
            );
            interior.position.y = 1.19;
            mug.add(interior);

            const innerWell = new THREE.Mesh(
                new THREE.CircleGeometry(1.17, 96),
                new THREE.MeshStandardMaterial({
                    color: "#111111",
                    roughness: 0.35,
                    side: THREE.DoubleSide,
                })
            );
            innerWell.rotation.x = -Math.PI / 2;
            innerWell.position.y = 1.29;
            mug.add(innerWell);

            const handle = new THREE.Mesh(
                new THREE.TorusGeometry(0.83, 0.18, 36, 96, Math.PI * 1.78),
                new THREE.MeshPhysicalMaterial({
                    color: mugColor,
                    roughness: 0.2,
                    clearcoat: 0.3,
                })
            );
            handle.rotation.y = Math.PI / 2;
            handle.position.set(1.43, 0, 0);
            handle.castShadow = true;
            handle.receiveShadow = true;
            mug.add(handle);

            const handleInner = new THREE.Mesh(
                new THREE.TorusGeometry(0.61, 0.055, 20, 64, Math.PI * 1.72),
                new THREE.MeshStandardMaterial({
                    color: "#d8d8d8",
                    roughness: 0.75,
                })
            );
            handleInner.rotation.y = Math.PI / 2;
            handleInner.position.set(1.44, 0, 0);
            mug.add(handleInner);

            const textureCanvas = document.createElement("canvas");
            textureCanvas.width = 2048;
            textureCanvas.height = 1024;
            textureCanvasRef.current = textureCanvas;

            const texture = new THREE.CanvasTexture(textureCanvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            textureRef.current = texture;

            const artwork = new THREE.Mesh(
                new THREE.CylinderGeometry(1.405, 1.505, 2.61, 96, 32, true),
                new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    depthWrite: false,
                    side: THREE.FrontSide,
                })
            );
            artworkRef.current = artwork;
            mug.add(artwork);

            const resize = () => {
                if (!hostRef.current) return;
                const width = Math.max(320, hostRef.current.clientWidth);
                const height = Math.max(420, hostRef.current.clientHeight);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height, false);
            };

            resize();
            const observer = new ResizeObserver(resize);
            observer.observe(host);

            const render = () => {
                if (disposed) return;
                mug.rotation.y = rotationRef.current;
                renderer.render(scene, camera);
                animationRef.current = requestAnimationFrame(render);
            };

            render();

            return () => observer.disconnect();
        };

        void setup().catch((error) => {
            console.error("Magic Touch 3D preview failed to initialize.", error);
        });

        return () => {
            disposed = true;
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
            }
            rendererRef.current?.dispose?.();
            textureRef.current?.dispose?.();
            sceneRef.current?.traverse?.((object: any) => {
                object.geometry?.dispose?.();
                if (Array.isArray(object.material)) {
                    object.material.forEach((material: any) => material.dispose?.());
                } else {
                    object.material?.dispose?.();
                }
            });
        };
    }, []);

    useEffect(() => {
        const mug = mugRef.current;
        if (!mug) return;

        mug.traverse((object: any) => {
            const material = object.material;
            if (!material?.color) return;
            if (object.geometry?.type === "CylinderGeometry" && object !== artworkRef.current) {
                material.color.set(mugColor);
            }
            if (object.geometry?.type === "TorusGeometry") {
                material.color.set(mugColor);
            }
        });
    }, [mugColor]);

    useEffect(() => {
        const canvas = textureCanvasRef.current;
        const texture = textureRef.current;
        if (!canvas || !texture) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        if (!designUrl) {
            texture.needsUpdate = true;
            designImageRef.current = null;
            return;
        }

        const image = new Image();
        image.onload = () => {
            designImageRef.current = image;
            context.clearRect(0, 0, canvas.width, canvas.height);

            const printableWidth = canvas.width * 0.78;
            const printableHeight = canvas.height * 0.68;
            const imageRatio = image.width / image.height;

            let width = printableWidth;
            let height = width / imageRatio;
            if (height > printableHeight) {
                height = printableHeight;
                width = height * imageRatio;
            }

            width *= designScale;
            height *= designScale;

            const centerX = canvas.width / 2 + (designX / 100) * canvas.width * 0.35;
            const centerY = canvas.height / 2 + (designY / 100) * canvas.height * 0.25;

            context.save();
            context.translate(centerX, centerY);
            context.rotate((designRotation * Math.PI) / 180);
            context.drawImage(image, -width / 2, -height / 2, width, height);
            context.restore();

            texture.needsUpdate = true;
        };
        image.onerror = () => {
            designImageRef.current = null;
            context.clearRect(0, 0, canvas.width, canvas.height);
            texture.needsUpdate = true;
        };
        image.src = designUrl;
    }, [designUrl, designScale, designX, designY, designRotation]);

    const beginDrag = (clientX: number) => {
        interactionRef.current = {
            active: true,
            startX: clientX,
            startRotation: rotationRef.current,
        };
    };

    const moveDrag = (clientX: number) => {
        if (!interactionRef.current.active) return;
        const delta = clientX - interactionRef.current.startX;
        const next = interactionRef.current.startRotation + delta * 0.012;
        rotationRef.current = next;
        onRotationChange(next);
    };

    const endDrag = () => {
        interactionRef.current.active = false;
    };

    return (
        <div
            ref={hostRef}
            className="customize-3d-preview"
            onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                beginDrag(event.clientX);
            }}
            onPointerMove={(event) => moveDrag(event.clientX)}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            role="application"
            aria-label="Interactive 3D mug preview. Drag to rotate the mug."
        >
            <div className="customize-3d-preview__hint">
                <span>360°</span>
                Drag to rotate
            </div>
            {!designUrl && (
                <div className="customize-3d-preview__empty">
                    <strong>Your design will appear here</strong>
                    <span>Upload an image to preview it on the mug.</span>
                </div>
            )}
        </div>
    );
}

export default Mug3DPreview;
