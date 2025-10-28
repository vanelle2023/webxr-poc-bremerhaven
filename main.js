// --- Importieren der notwendigen Module (Wichtig: Läuft nur über HTTP-Server) ---
import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'https://unpkg.com/three@0.158.0/examples/jsm/webxr/ARButton.js';


let camera, scene, renderer;
let model; 

init(); 
// Die animate-Funktion wird nun über renderer.setAnimationLoop(render) in init() aufgerufen

function init() {
    // === 1. BASIS-SZENE EINRICHTEN ===
    scene = new THREE.Scene();
    
    // Hintergrundfarbe für den Nicht-AR-Modus
    scene.background = new THREE.Color(0x87ceeb); // Himmelblau

    // --- BELEUCHTUNG FÜR GROSSE SZENEN ANPASSEN (WICHTIG FÜR BLENDERGIS-MODELLE) ---
    
    // 1. Hemisphere Light (Umgebungslicht, sehr hell für große Fläche)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 10); // Intensität von 10
    scene.add(hemiLight);

    // 2. Directional Light (Simuliert Sonnenlicht)
    const dirLight = new THREE.DirectionalLight(0xffffff, 5); // Intensität 5
    dirLight.position.set(50, 50, 50); // Licht kommt von weit oben rechts
    scene.add(dirLight);


    // === 2. KAMERA & RENDERER EINRICHTEN ===
    
    // ANPASSUNG: Sichtweite auf 5000 Meter für große BlenderGIS-Modelle
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 5000); 
    
    // ANPASSUNG: Kamera weit zurücksetzen und anheben, um das große Modell zu sehen
    camera.position.set(200, 200, 200); 
    camera.lookAt(0, 0, 0); // Blickrichtung zum Zentrum der Szene

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // NEU: Korrekte Eigenschaft für Farbraum
    renderer.outputColorSpace = THREE.SRGBColorSpace; 


    // === 3. WEBXR FÜR AR AKTIVIEREN ===
    renderer.xr.enabled = true; 
    
    // Fügt den "Start AR" Button hinzu
    document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'local-floor' ] } ) );


    // === 4. GLB-MODELL LADEN ===
    const loader = new GLTFLoader(); 
    loader.load( 
        'neuerHafen.glb', 
        function ( gltf ) {
            model = gltf.scene;
            
            // WICHTIG: Wenn das Modell in Blender um den Ursprung zentriert wurde,
            // ist dies die Position. Wenn nicht, müssen Sie diese anpassen.
            // Versuchen Sie zunächst eine kleine Skalierung, falls das Modell immer noch riesig ist (z.B. 1:100)
            // model.scale.set(0.01, 0.01, 0.01); 

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


// === 5. RENDERING-SCHLEIFE ===
function render() {
    // Rotation nur im Desktop-Modus (nicht im AR-Modus, da es dort irritiert)
    if (model && !renderer.xr.isPresenting) {
        // Optionale: Wenn das Modell geladen ist, kann man es drehen
        // model.rotation.y += 0.005; 
        
        // HILFE: Wenn nichts sichtbar ist, ändern Sie die Rotation, 
        // um zu sehen, ob das Modell am Rand des Bildschirms vorbeizieht!
    }
    
    renderer.render( scene, camera );
}
