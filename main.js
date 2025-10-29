import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'https://unpkg.com/three@0.158.0/examples/jsm/webxr/ARButton.js';

// Globale Variablen für Three.js und Interaktion
let camera, scene, renderer;
let model; 
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let infoBox = null; 
let infoContent = null;

init(); 

function init() {
    // === 1. BASIS-SZENE EINRICHTEN ===
    scene = new THREE.Scene();
    
    // Hintergrundfarbe für den Desktop-Modus
    scene.background = new THREE.Color(0x87ceeb); 

    // --- BELEUCHTUNG ---
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 10);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 5); 
    dirLight.position.set(50, 50, 50); 
    scene.add(dirLight);


    // === 2. KAMERA & RENDERER EINRICHTEN ===
    // Kamera-Sichtweite: 0.01m bis 1000m
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace; 


    // === 3. WEBXR FÜR AR AKTIVIEREN ===
    renderer.xr.enabled = true; 
    document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'local-floor' ] } ) );


    // === 4. GLB-MODELL LADEN & DYNAMISCH ANPASSEN ===
    const loader = new GLTFLoader(); 
    loader.load( 
        'schiff_stadt_koln.glb', // IHR SCHIFFSNAME
        function ( gltf ) {
            model = gltf.scene;
            
            // --- DYNAMISCHE KAMERA-ANPASSUNG ---
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());   
            const center = box.getCenter(new THREE.Vector3()); 
            
            // 1. Skalierung (z.B. größte Dimension auf 5 Meter skalieren)
            const targetSize = 0.5; 
            const maxDim = Math.max(size.x, size.y, size.z);
            const scaleFactor = targetSize / maxDim;
            model.scale.set(scaleFactor, scaleFactor, scaleFactor);

            // Nach Skalierung Box neu berechnen
            box.setFromObject(model);
            size.copy(box.getSize(new THREE.Vector3()));
            center.copy(box.getCenter(new THREE.Vector3()));
            
            // 2. Kamera-Abstand und Position (Desktop-Ansicht):
            const camDistance = Math.max(size.x, size.y, size.z) * 1.5; 
            camera.position.set(center.x, center.y + camDistance * 0.5, center.z + camDistance);
            camera.lookAt(center);
            
            // 3. AR-Positionierung: Modell auf virtuellen Boden setzen (y=0)
            model.position.set(-center.x, -center.y + (size.y / 2), -center.z); 

            scene.add( model );

        }, 
        undefined, 
        function ( error ) {
            console.error( 'Fehler beim Laden der GLB:', error );
        } 
    );
    
    document.body.appendChild(renderer.domElement);
    window.addEventListener( 'resize', onWindowResize, false );
    
    // --- INTERAKTION EINRICHTEN ---
    infoBox = document.getElementById('info-box');
    infoContent = document.getElementById('info-content');
    window.addEventListener('click', onPointerClick);
    
    // Startet den Animations-Loop
    renderer.setAnimationLoop( render ); 
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onPointerClick(event) {
    // Normalisierung der Mauskoordinaten für Raycasting
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);

    if (!model) return;
    
    // Suche nach Treffern im geladenen Modell (rekursiv)
    const intersects = raycaster.intersectObjects(model.children, true);

    if (intersects.length > 0) {
        // Ein Objekt wurde getroffen.
        const hitPoint = intersects[0].point; // Der 3D-Punkt, an dem das Schiff getroffen wurde

        // --- 1. 3D-POSITION IN 2D-BILDSCHIRMKOORDINATE UMWANDELN ---
        
        // Klonen Sie den Trefferpunkt, um ihn zu transformieren
        const tempVector = new THREE.Vector3().copy(hitPoint);
        
        // Projizieren Sie den 3D-Vektor auf die 2D-Kamera-Ebene
        tempVector.project(camera);

        // Berechnen Sie die 2D-Koordinaten in Pixeln
        let x = (tempVector.x * 0.5 + 0.5) * window.innerWidth;
        let y = (-tempVector.y * 0.5 + 0.5) * window.innerHeight;

        // Verschieben Sie die Box leicht nach rechts und oben, damit sie nicht direkt über dem Klickpunkt liegt
        x += 20; // 20 Pixel rechts
        y -= 20; // 20 Pixel nach oben

        // 2. Info-Box befüllen und positionieren
        const schiffsDaten = {
            Name: "MS Stadt Köln",
            Typ: "Ausflugsdampfer (Fiktiv)",
            Länge: "250 Meter",
            Baujahr: "2018",
            Zuletzt_gesehen: "Neuer Hafen, Liegeplatz A"
        };

        let htmlContent = `<b>${schiffsDaten.Name}</b><hr>`;
        for (const [key, value] of Object.entries(schiffsDaten)) {
            htmlContent += `<b>${key}:</b> ${value}<br>`;
        }
        
        infoContent.innerHTML = htmlContent;
        
        // Positionierung der Info-Box
        infoBox.style.left = `${x}px`;
        infoBox.style.top = `${y}px`;
        infoBox.style.display = 'block';

    } else {
        // Nichts getroffen -> Info-Box ausblenden
        infoBox.style.display = 'none';
    }
}


function render() {
    // Wenn wir im AR-Modus sind
    if (model && renderer.xr.isPresenting) {
        // Optionale: Das Schiff langsam drehen, damit der Nutzer es ohne Gehen betrachten kann
        model.rotation.y += 0.005; 
        
        // Optionale: Wenn das Modell einen "Rauch"-Auslass hat, könnten Sie hier eine Partikel-Simulation einfügen
    }
    
    // Rotation im Desktop-Modus wieder aktivieren (damit es dort auch beeindruckend aussieht)
    if (model && !renderer.xr.isPresenting) {
         model.rotation.y += 0.002; 
    }
    renderer.render( scene, camera );
}
