import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'https://unpkg.com/three@0.158.0/examples/jsm/webxr/ARButton.js';


let camera, scene, renderer;
let model; 

init(); 

function init() {
    // === 1. BASIS-SZENE EINRICHTEN ===
    scene = new THREE.Scene();
    
    // Hintergrundfarbe für den Nicht-AR-Modus
    scene.background = new THREE.Color(0x87ceeb); // Himmelblau

    // --- BELEUCHTUNG FÜR REALISMUS ANPASSEN ---
    
    // 1. Hemisphere Light (Umgebungslicht)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 10); // Intensität 10 für Helligkeit
    scene.add(hemiLight);

    // 2. Directional Light (Simuliert Sonnenlicht)
    const dirLight = new THREE.DirectionalLight(0xffffff, 5); // Intensität 5
    dirLight.position.set(50, 50, 50); 
    scene.add(dirLight);


    // === 2. KAMERA & RENDERER EINRICHTEN ===
    
    // ANPASSUNG: Große maximale Sichtweite (1000m) für den Fall, dass das Modell doch groß ist.
    // Die Kamera-Position wird dynamisch festgelegt.
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
    
    // Vorerst neutrale Position, die durch den Loader überschrieben wird
    camera.position.set(50, 50, 50); 
    camera.lookAt(0, 0, 0); 

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Korrekte Eigenschaft für Farbraum
    renderer.outputColorSpace = THREE.SRGBColorSpace; 


    // === 3. WEBXR FÜR AR AKTIVIEREN ===
    renderer.xr.enabled = true; 
    
    // Fügt den "Start AR" Button hinzu
    document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'local-floor' ] } ) );


    // === 4. GLB-MODELL LADEN & DYNAMISCH ANPASSEN ===
    const loader = new GLTFLoader(); 
    loader.load( 
        'schiff_stadt_koln.glb', 
        function ( gltf ) {
            model = gltf.scene;
            
            // --- DYNAMISCHE KAMERA-ANPASSUNG HIER ---
            
            // 1. BOUNDING BOX BERECHNEN
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());   
            const center = box.getCenter(new THREE.Vector3()); 
            
            // 2. MODELL SKALIEREN (Skaliere die größte Dimension auf 5 Meter für AR-Präsentation)
            const targetSize = 5; // z.B. 5 Meter
            const maxDim = Math.max(size.x, size.y, size.z);
            const scaleFactor = targetSize / maxDim;
            model.scale.set(scaleFactor, scaleFactor, scaleFactor);

            // Box/Größe nach der Skalierung neu berechnen
            box.setFromObject(model);
            size.copy(box.getSize(new THREE.Vector3()));
            center.copy(box.getCenter(new THREE.Vector3()));
            
            // 3. KAMERA-POSITION BERECHNEN: Abstand basierend auf der größten Dimension des SKALIERTEN Modells
            const maxComponent = Math.max(size.x, size.y, size.z);
            const camDistance = maxComponent * 1.5; // 1.5x die größte Dimension

            // 4. KAMERA VERSCHIEBEN & AUSRICHTEN (Desktop-Ansicht):
            // Bewege die Kamera zum Zentrum des Modells (center.x, center.y) und füge den Abstand hinzu (center.z + dist)
            camera.position.set(center.x, center.y + camDistance * 0.5, center.z + camDistance);
            camera.lookAt(center);
            
            // 5. AR-MODUS POSITIONIERUNG: Setze das Modell auf den virtuellen Boden (y=0)
            // Verschiebe das Modell so, dass sein unterer Rand bei Y=0 im Weltursprung liegt
            // (center.y * scaleFactor) ist der Abstand vom Modell-Ursprung zum unteren Rand
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
    
    // Startet den Animations-Loop
    renderer.setAnimationLoop( render ); 
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}


function render() {
    // Optionale: Rotation nur im Desktop-Modus
    if (model && !renderer.xr.isPresenting) {
        // model.rotation.y += 0.005; // Aktivieren dies, wenn eine leichte Drehung gewünscht wird
    }
    
    renderer.render( scene, camera );
}
