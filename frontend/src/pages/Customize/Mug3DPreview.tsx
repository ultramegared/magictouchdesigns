import { useEffect, useRef } from "react";

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

type ThreeModule = any;

const TAU = Math.PI * 2;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function Mug3DPreview(props: Mug3DPreviewProps) {
    const mountRef = useRef<HTMLDivElement>(null);
    const stateRef = useRef<any>(null);
    const rotationRef = useRef(props.rotation);

    useEffect(() => { rotationRef.current = props.rotation; }, [props.rotation]);

    useEffect(() => {
        let cancelled = false;
        let cleanup = () => {};
        const loadThree = new Function("return import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js')") as () => Promise<ThreeModule>;

        const init = async () => {
            const THREE = await loadThree();
            if (cancelled || !mountRef.current) return;

            const mount = mountRef.current;
            const scene = new THREE.Scene();
            scene.background = new THREE.Color("#f4f1ec");

            const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
            camera.position.set(4.8, 2.7, 5.4);
            camera.lookAt(0, 0.15, 0);

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.12;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            mount.innerHTML = "";
            mount.appendChild(renderer.domElement);

            const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8178, 2.1);
            scene.add(hemi);
            const key = new THREE.DirectionalLight(0xffffff, 3.4);
            key.position.set(4, 6, 5);
            key.castShadow = true;
            scene.add(key);
            const fill = new THREE.DirectionalLight(0xdfe8ff, 1.1);
            fill.position.set(-4, 2, 3);
            scene.add(fill);

            const floor = new THREE.Mesh(
                new THREE.CircleGeometry(3.2, 64),
                new THREE.ShadowMaterial({ opacity: 0.16 })
            );
            floor.rotation.x = -Math.PI / 2;
            floor.position.y = -1.63;
            floor.receiveShadow = true;
            scene.add(floor);

            const group = new THREE.Group();
            scene.add(group);

            const bodyMaterial = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(props.mugBodyColor),
                roughness: 0.24,
                metalness: 0,
                clearcoat: 0.28,
                clearcoatRoughness: 0.18,
            });

            const bodyGeometry = new THREE.CylinderGeometry(1.36, 1.43, 2.62, 96, 1, false);
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.castShadow = true;
            body.receiveShadow = true;
            group.add(body);

            const rimMaterial = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(props.mugAccentColor),
                roughness: 0.18,
                clearcoat: 0.4,
            });
            const rim = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.085, 20, 96), rimMaterial);
            rim.rotation.x = Math.PI / 2;
            rim.position.y = 1.31;
            rim.castShadow = true;
            group.add(rim);

            const inner = new THREE.Mesh(
                new THREE.CylinderGeometry(1.18, 1.18, 0.08, 96),
                new THREE.MeshPhysicalMaterial({ color: 0x262626, roughness: 0.55 })
            );
            inner.position.y = 1.30;
            group.add(inner);

            const handleGeometry = new THREE.TorusGeometry(0.78, 0.18, 24, 64, Math.PI * 1.72);
            const handle = new THREE.Mesh(handleGeometry, rimMaterial);
            handle.rotation.y = Math.PI / 2;
            handle.rotation.z = -Math.PI / 2;
            handle.position.set(1.48, 0.1, 0);
            handle.castShadow = true;
            group.add(handle);

            const base = new THREE.Mesh(
                new THREE.TorusGeometry(1.38, 0.055, 16, 96),
                new THREE.MeshPhysicalMaterial({ color: new THREE.Color(props.mugBodyColor), roughness: 0.32 })
            );
            base.rotation.x = Math.PI / 2;
            base.position.y = -1.31;
            group.add(base);

            const artworkCanvas = document.createElement("canvas");
            artworkCanvas.width = 2048;
            artworkCanvas.height = 1024;
            const artworkCtx = artworkCanvas.getContext("2d");
            const texture = new THREE.CanvasTexture(artworkCanvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

            const artworkMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                depthWrite: false,
                side: THREE.FrontSide,
                polygonOffset: true,
                polygonOffsetFactor: -1,
                polygonOffsetUnits: -1,
            });

            const printGeometry = new THREE.CylinderGeometry(1.371, 1.441, 2.28, 128, 1, true, 0, TAU);
            const printSurface = new THREE.Mesh(printGeometry, artworkMaterial);
            printSurface.position.y = 0;
            printSurface.castShadow = false;
            group.add(printSurface);

            const updateArtwork = () => {
                if (!artworkCtx) return;
                artworkCtx.clearRect(0, 0, artworkCanvas.width, artworkCanvas.height);
                if (!props.designUrl) {
                    texture.needsUpdate = true;
                    return;
                }
                const image = new Image();
                image.onload = () => {
                    if (cancelled) return;
                    artworkCtx.clearRect(0, 0, artworkCanvas.width, artworkCanvas.height);
                    const scale = clamp(props.designScale, 0.4, 1.6);
                    const aspect = image.width / Math.max(1, image.height);
                    const h = Math.min(760 * scale, 900);
                    const w = Math.min(1500 * scale, h * aspect);
                    const x = artworkCanvas.width / 2 + (props.designX / 100) * 560;
                    const y = artworkCanvas.height / 2 - (props.designY / 100) * 280;
                    artworkCtx.save();
                    artworkCtx.translate(x, y);
                    artworkCtx.rotate((props.designRotation * Math.PI) / 180);
                    artworkCtx.imageSmoothingEnabled = true;
                    artworkCtx.drawImage(image, -w / 2, -h / 2, w, h);
                    artworkCtx.restore();
                    texture.needsUpdate = true;
                };
                image.src = props.designUrl;
            };
            updateArtwork();

            const resize = () => {
                const rect = mount.getBoundingClientRect();
                const width = Math.max(1, rect.width);
                const height = Math.max(1, rect.height);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height, false);
            };
            const observer = new ResizeObserver(resize);
            observer.observe(mount);
            resize();

            let dragging = false;
            let lastX = 0;
            const onPointerDown = (event: PointerEvent) => {
                dragging = true;
                lastX = event.clientX;
                renderer.domElement.setPointerCapture?.(event.pointerId);
                renderer.domElement.style.cursor = "grabbing";
            };
            const onPointerMove = (event: PointerEvent) => {
                if (!dragging) return;
                const delta = event.clientX - lastX;
                lastX = event.clientX;
                const next = rotationRef.current + delta * 0.012;
                rotationRef.current = next;
                props.onRotationChange(next);
            };
            const onPointerUp = () => {
                dragging = false;
                renderer.domElement.style.cursor = "grab";
            };
            const onWheel = (event: WheelEvent) => {
                event.preventDefault();
                const next = clamp(camera.position.z + (event.deltaY > 0 ? 0.22 : -0.22), 3.8, 7);
                camera.position.z = next;
            };
            renderer.domElement.addEventListener("pointerdown", onPointerDown);
            renderer.domElement.addEventListener("pointermove", onPointerMove);
            renderer.domElement.addEventListener("pointerup", onPointerUp);
            renderer.domElement.addEventListener("pointercancel", onPointerUp);
            renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
            renderer.domElement.style.touchAction = "none";
            renderer.domElement.style.cursor = "grab";

            let frame = 0;
            const animate = () => {
                frame = requestAnimationFrame(animate);
                group.rotation.y = rotationRef.current;
                renderer.render(scene, camera);
            };
            animate();

            stateRef.current = { THREE, scene, renderer, group, bodyMaterial, rimMaterial, texture, updateArtwork };
            cleanup = () => {
                cancelAnimationFrame(frame);
                observer.disconnect();
                renderer.domElement.removeEventListener("pointerdown", onPointerDown);
                renderer.domElement.removeEventListener("pointermove", onPointerMove);
                renderer.domElement.removeEventListener("pointerup", onPointerUp);
                renderer.domElement.removeEventListener("pointercancel", onPointerUp);
                renderer.domElement.removeEventListener("wheel", onWheel);
                bodyGeometry.dispose();
                handleGeometry.dispose();
                printGeometry.dispose();
                artworkMaterial.dispose();
                texture.dispose();
                renderer.dispose();
                mount.replaceChildren();
                stateRef.current = null;
            };
        };

        void init().catch(() => {
            if (!cancelled && mountRef.current) {
                mountRef.current.innerHTML = '<div class="mug-3d-preview__fallback">3D preview could not load. Please refresh and try again.</div>';
            }
        });

        return () => { cancelled = true; cleanup(); };
    }, []);

    useEffect(() => {
        const state = stateRef.current;
        if (!state) return;
        state.bodyMaterial.color.set(props.mugBodyColor);
        state.rimMaterial.color.set(props.mugAccentColor);
        state.updateArtwork();
    }, [props.mugBodyColor, props.mugAccentColor, props.designUrl, props.designScale, props.designX, props.designY, props.designRotation]);

    return (
        <div className="mug-3d-preview">
            <div className="mug-3d-preview__topbar">
                <span className="mug-3d-preview__badge"><span className="mug-3d-preview__live-dot" /> REAL 3D PREVIEW</span>
                <span className="mug-3d-preview__size">{props.mugSize} · {props.mugStyle === "solid" ? "Solid" : "Colored Handle"}</span>
            </div>
            <div ref={mountRef} className="mug-3d-preview__canvas mug-3d-preview__webgl" aria-label="Interactive realistic 3D custom mug preview" />
            {!props.designUrl && <div className="mug-3d-preview__empty"><strong>Your artwork will appear here</strong><span>Upload an image to see your custom mug come to life.</span></div>}
            <div className="mug-3d-preview__hint"><span>↔</span> Drag to rotate 360° · Scroll/pinch to zoom · Inspect every side</div>
        </div>
    );
}

export default Mug3DPreview;
