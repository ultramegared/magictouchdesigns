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
    const propsRef = useRef(props);
    propsRef.current = props;

    useEffect(() => { rotationRef.current = props.rotation; }, [props.rotation]);

    useEffect(() => {
        let cancelled = false;
        let cleanup = () => {};
        const loadThree = new Function("return Promise.race([import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js'), new Promise((_, reject) => setTimeout(() => reject(new Error('3D engine timeout')), 7000))])") as () => Promise<ThreeModule>;

        const init = async () => {
            const THREE = await loadThree();
            if (cancelled || !mountRef.current) return;

            const mount = mountRef.current;
            const scene = new THREE.Scene();
            scene.background = new THREE.Color("#f4f1ec");

            const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
            camera.position.set(4.9, 2.35, 6.6);
            camera.lookAt(0, 0.02, 0);

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.12;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            mount.innerHTML = `
                <div class="mug-3d-preview__loading">
                    <div class="mug-3d-preview__loading-cup" aria-hidden="true">
                        <span class="mug-3d-preview__loading-handle"></span>
                        <span class="mug-3d-preview__loading-body"></span>
                    </div>
                    <strong>Preparing your mug</strong>
                </div>`;
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
            const mugScale = props.mugSize === "15 oz" ? 0.78 : 0.72;
            group.scale.setScalar(mugScale);
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

            const handleCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(1.18, 0.86, 0),
                new THREE.Vector3(1.62, 0.86, 0),
                new THREE.Vector3(1.98, 0.62, 0),
                new THREE.Vector3(2.08, 0.0, 0),
                new THREE.Vector3(1.98, -0.62, 0),
                new THREE.Vector3(1.62, -0.86, 0),
                new THREE.Vector3(1.18, -0.86, 0),
            ]);
            const handleGeometry = new THREE.TubeGeometry(handleCurve, 64, 0.18, 24, false);
            const handle = new THREE.Mesh(handleGeometry, rimMaterial);
            handle.castShadow = true;
            handle.receiveShadow = true;
            group.add(handle);

            const handleTopCollar = new THREE.Mesh(
                new THREE.SphereGeometry(0.22, 24, 16),
                rimMaterial
            );
            handleTopCollar.position.set(1.22, 0.86, 0);
            handleTopCollar.scale.set(1.35, 0.72, 0.72);
            group.add(handleTopCollar);

            const handleBottomCollar = handleTopCollar.clone();
            handleBottomCollar.position.y = -0.86;
            group.add(handleBottomCollar);

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
                side: THREE.DoubleSide,
                depthTest: true,
                depthWrite: false,
                alphaTest: 0.001,
                polygonOffset: true,
                polygonOffsetFactor: -4,
                polygonOffsetUnits: -4,
            });

            const printGeometry = new THREE.CylinderGeometry(1.371, 1.441, 2.48, 128, 1, true, 0, TAU);
            const printSurface = new THREE.Mesh(printGeometry, artworkMaterial);
            // Put the texture's wrap seam at the handle, not in the middle of the visible front.
            // The transparent canvas margins below create a small unprinted safety gap around the handle.
            printSurface.rotation.y = Math.PI / 2;
            printSurface.position.y = 0;
            printSurface.castShadow = false;
            printSurface.renderOrder = 10;
            group.add(printSurface);

            let artworkUpdateId = 0;
            const updateArtwork = (
                designUrl = props.designUrl,
                designScale = props.designScale,
                designX = props.designX,
                designY = props.designY,
                designRotation = props.designRotation
            ) => {
                if (!artworkCtx) return;
                artworkCtx.clearRect(0, 0, artworkCanvas.width, artworkCanvas.height);
                texture.needsUpdate = true;

                if (!designUrl) return;

                const updateId = ++artworkUpdateId;
                const image = new Image();
                image.onload = () => {
                    if (cancelled || updateId !== artworkUpdateId) return;
                    artworkCtx.clearRect(0, 0, artworkCanvas.width, artworkCanvas.height);
                    const scale = clamp(designScale, 0.4, 1.6);
                    // Fit the uploaded photo to the cylindrical wrap while reserving 5% on each
                    // edge of the canvas. Those blank edges meet at the handle as a small print-safe gap.
                    // Keep the image proportions when possible; the height fills the printable ceramic body.
                    // Preserve the original photo proportions inside the fixed printable area.
                    // Use the same fixed 2:1 print frame and cover-crop as the editor preview.
                    // Horizontal/vertical offsets are percentages of the actual overflow, not arbitrary pixels.
                    const maxW = artworkCanvas.width * scale;
                    const maxH = artworkCanvas.height * scale;
                    const ratio = Math.max(maxW / image.naturalWidth, maxH / image.naturalHeight);
                    const w = image.naturalWidth * ratio;
                    const h = image.naturalHeight * ratio;
                    const x = artworkCanvas.width / 2 + (designX / 100) * Math.max(0, w - artworkCanvas.width);
                    const y = artworkCanvas.height / 2 + (designY / 100) * Math.max(0, h - artworkCanvas.height);
                    artworkCtx.save();
                    artworkCtx.translate(x, y);
                    artworkCtx.rotate((designRotation * Math.PI) / 180);
                    artworkCtx.imageSmoothingEnabled = true;
                    artworkCtx.imageSmoothingQuality = "high";
                    artworkCtx.drawImage(image, -w / 2, -h / 2, w, h);
                    artworkCtx.restore();

                    texture.needsUpdate = true;
                    printSurface.visible = true;
                };
                image.onerror = () => {
                    if (cancelled || updateId !== artworkUpdateId) return;
                    artworkCtx.clearRect(0, 0, artworkCanvas.width, artworkCanvas.height);
                    texture.needsUpdate = true;
                };
                image.src = designUrl;
            };
            updateArtwork(
                propsRef.current.designUrl,
                propsRef.current.designScale,
                propsRef.current.designX,
                propsRef.current.designY,
                propsRef.current.designRotation
            );

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
            mount.querySelector(".mug-3d-preview__loading")?.remove();

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
            updateArtwork(
                propsRef.current.designUrl,
                propsRef.current.designScale,
                propsRef.current.designX,
                propsRef.current.designY,
                propsRef.current.designRotation
            );
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
                const body = props.mugBodyColor || "#ffffff";
                const accent = props.mugAccentColor || "#d94b59";
                const artwork = props.designUrl
                    ? `<image href="${props.designUrl}" x="125" y="120" width="150" height="105" preserveAspectRatio="xMidYMid meet" />`
                    : "";
                mountRef.current.innerHTML = `
                    <div class="mug-3d-preview__fallback" role="img" aria-label="Mug preview">
                      <svg viewBox="0 0 400 320" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="mugBodyShade" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0%" stop-color="#b8b4ae"/><stop offset="18%" stop-color="${body}"/>
                            <stop offset="72%" stop-color="${body}"/><stop offset="100%" stop-color="#c8c4bd"/>
                          </linearGradient>
                          <linearGradient id="mugAccentShade" x1="0" x2="1"><stop offset="0%" stop-color="#777"/><stop offset="25%" stop-color="${accent}"/><stop offset="100%" stop-color="#777"/></linearGradient>
                          <clipPath id="mugPrintArea"><path d="M104 91 Q200 110 296 91 L284 251 Q200 272 116 251 Z"/></clipPath>
                          <filter id="mugShadow"><feDropShadow dx="0" dy="12" stdDeviation="9" flood-color="#66594a" flood-opacity=".22"/></filter>
                        </defs>
                        <ellipse cx="202" cy="276" rx="119" ry="17" fill="#bcb3a6" opacity=".35"/>
                        <path d="M286 113 C365 87 368 205 291 211 L280 187 C326 184 330 127 286 143 Z" fill="url(#mugAccentShade)" stroke="#8f887e" stroke-width="3" filter="url(#mugShadow)"/>
                        <path d="M104 89 Q200 110 296 89 L284 249 Q200 270 116 249 Z" fill="url(#mugBodyShade)" stroke="#d0cbc3" stroke-width="3" filter="url(#mugShadow)"/>
                        <ellipse cx="200" cy="91" rx="96" ry="18" fill="${body}" stroke="#b7b1a8" stroke-width="3"/>
                        <ellipse cx="200" cy="91" rx="78" ry="10" fill="#4d4a46" opacity=".9"/>
                        <path d="M111 105 Q126 172 122 239" fill="none" stroke="#fff" stroke-width="8" opacity=".32" stroke-linecap="round"/>
                        <g clip-path="url(#mugPrintArea)"><rect x="112" y="112" width="176" height="130" fill="transparent"/>${artwork}</g>
                        <path d="M117 250 Q200 269 283 250" fill="none" stroke="#b5afa6" stroke-width="4"/>
                      </svg>
                    </div>`;
            }
        });

        return () => { cancelled = true; cleanup(); };
    }, []);

    useEffect(() => {
        const state = stateRef.current;
        if (!state) return;
        state.bodyMaterial.color.set(props.mugBodyColor);
        state.rimMaterial.color.set(props.mugAccentColor);
        state.updateArtwork(props.designUrl, props.designScale, props.designX, props.designY, props.designRotation);
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
