    // ── Toast + validation formulaire ─────────────────────────
    document.getElementById('submitBtn').addEventListener('click', function () {
      const form = document.getElementById('orderForm');
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }
      bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
      new bootstrap.Toast(document.getElementById('successToast'), { delay: 4000 }).show();
      form.reset();
      form.classList.remove('was-validated');
    });

    // ── Three.js setup ─────────────────────────────────────────
    const canvas = document.getElementById('three-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a0a');

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.01, 100);
    camera.position.set(0, 0, 3);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(2, 3, 2);
    scene.add(dir);

    // ── Orbit manuel ──────────────────────────────────────────
    let isDown = false, lastX = 0, lastY = 0, rotX = 0, rotY = 0;
    let autoRot = true;
    const group = new THREE.Group();
    scene.add(group);

    canvas.addEventListener('mousedown', e => { isDown = true; autoRot = false; lastX = e.clientX; lastY = e.clientY; document.getElementById('btn-rotate').textContent = '▶ Auto'; });
    canvas.addEventListener('mouseup', () => isDown = false);
    canvas.addEventListener('mousemove', e => {
      if (!isDown) return;
      rotY += (e.clientX - lastX) * 0.008;
      rotX += (e.clientY - lastY) * 0.008;
      rotX = Math.max(-1.2, Math.min(1.2, rotX));
      lastX = e.clientX; lastY = e.clientY;
    });

    function toggleRotation() {
      autoRot = !autoRot;
      document.getElementById('btn-rotate').textContent = autoRot ? '⏸ Auto' : '▶ Auto';
    }
    function resetRotation() { rotX = 0; rotY = 0; }

    // ── Matériaux ─────────────────────────────────────────────
    const textureLoader = new THREE.TextureLoader();
    let currentDesign = 1;
    let fondActuel = 'noir';
    let meshesBase = [], meshesDesign = [];

    const matD1 = new THREE.MeshStandardMaterial({ color: new THREE.Color('#ff9700'), roughness: 0.8 });
    const matFond = new THREE.MeshStandardMaterial({ color: new THREE.Color('#000000'), roughness: 0.8 });
    const matDesign2 = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      roughness: 0.8,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });

    const texDesign2 = textureLoader.load('img/mondesign3.png', () => {
      texDesign2.encoding = THREE.sRGBEncoding;
      texDesign2.flipY = false;
      matDesign2.map = texDesign2;
      matDesign2.needsUpdate = true;
    });

    function applyDesign1() {
      const tex = textureLoader.load('img/modeleSdesign.png');
      tex.encoding = THREE.sRGBEncoding;
      tex.flipY = false;
      matD1.map = tex;
      matD1.color.set(document.getElementById('color-d1').value);
      matD1.transparent = false;
      matD1.needsUpdate = true;
      meshesBase.forEach(m => { m.material = matD1; m.visible = true; });
      meshesDesign.forEach(m => m.visible = false);
    }

    function applyDesign2() {
      matFond.color.set(fondActuel === 'noir' ? '#000000' : '#ffffff');
      matFond.needsUpdate = true;
      meshesBase.forEach(m => { m.material = matFond; m.visible = true; });
      meshesDesign.forEach(m => m.visible = true);
    }

    function switchDesign(num, btn) {
      currentDesign = num;
      document.querySelectorAll('[onclick^="switchDesign"]').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline-primary');
      });
      btn.classList.remove('btn-outline-primary');
      btn.classList.add('btn-primary');
      document.getElementById('card-color-d1').classList.toggle('d-none', num !== 1);
      document.getElementById('card-color-d2').classList.toggle('d-none', num !== 2);
      if (num === 1) applyDesign1();
      else applyDesign2();
    }

    document.getElementById('color-d1').addEventListener('input', e => {
      matD1.color.set(e.target.value);
      document.getElementById('hex-d1').textContent = e.target.value.toUpperCase();
    });

    function setColor(hex) {
      document.getElementById('color-d1').value = hex;
      matD1.color.set(hex);
      document.getElementById('hex-d1').textContent = hex.toUpperCase();
    }

    function setFond(fond, btn) {
      fondActuel = fond;
      document.getElementById('btn-noir').className = fond === 'noir' ? 'btn btn-dark flex-fill' : 'btn btn-outline-secondary flex-fill';
      document.getElementById('btn-blanc').className = fond === 'blanc' ? 'btn btn-secondary flex-fill' : 'btn btn-outline-secondary flex-fill';
      applyDesign2();
    }

    new THREE.GLTFLoader().load('Hoodie_Mockup_Final_Template.glb', gltf => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const s = 2 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(s);
      model.position.sub(center.multiplyScalar(s));
      model.traverse(child => {
        if (!child.isMesh) return;
        child.material = matD1;
        meshesBase.push(child);
        const clone = child.clone();
        clone.material = matDesign2;
        clone.visible = false;
        child.parent.add(clone);
        meshesDesign.push(clone);
      });
      group.add(model);
      applyDesign1();
    });

    function animate() {
      requestAnimationFrame(animate);
      if (autoRot) rotY += 0.004;
      group.rotation.x = rotX;
      group.rotation.y = rotY;
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    });