// --- NEU: Importieren Sie alle benötigten Module ---
import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
// Importieren Sie das korrekte ARButton-Modul
import { ARButton } from 'https://unpkg.com/three@0.158.0/examples/jsm/webxr/ARButton.js';


let camera, scene, renderer;
let model; 

init(); 
// Die animate() Funktion wird jetzt von renderer.setAnimationLoop(render) aufgerufen

function init() {
    // === 1. BASIS-SZENE EINRICHTEN ===
    scene = new THREE.Scene();
    
    // Test-Licht
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
    scene.add(light);
    
    // OPTIONAL: Füge zur besseren Sichtbarkeit ein Grid-Helferlein hinzu
    const grid = new THREE.GridHelper(10, 10, 0xaaaaaa, 0xaaaaaa);
    grid.position.y = -0.5; // Auf den Boden setzen
    scene.add(grid);


    // === 2. KAMERA & RENDERER EINRICHTEN ===
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    camera.position.z = 3; // Kamera ein wenig zurücksetzen, um das Modell zu sehen

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // FEHLER BEHOBEN: outputEncoding wurde entfernt, stattdessen outputColorSpace
    renderer.outputColorSpace = THREE.SRGBColorSpace; // Korrekte, neue Eigenschaft


    // === 3. WEBXR FÜR AR AKTIVIEREN ===
    renderer.xr.enabled = true; 
    
    // FEHLER BEHOBEN: ARButton ist jetzt ein importiertes Modul
    // Fügt den "Start AR" Button hinzu
    document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'local-floor' ] } ) );


    // === 4. GLB-MODELL LADEN ===
    const loader = new GLTFLoader(); // GLTFLoader ist jetzt ein importiertes Modul
    loader.load( 
        'neuerHafen.glb', 
        function ( gltf ) {
            model = gltf.scene;
            // Positionierung anpassen, damit es im AR-Modus vor dem Nutzer erscheint
            model.position.set(0, 0, -1); 
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
    // Nur Rotation, wenn wir NICHT im AR-Modus sind
    if (model && !renderer.xr.isPresenting) {
        model.rotation.y += 0.005; 
    }
    
    renderer.render( scene, camera );

}
