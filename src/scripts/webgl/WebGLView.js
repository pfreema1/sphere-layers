import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import glslify from 'glslify';
import Tweakpane from 'tweakpane';
import fullScreenTriFrag from '../../shaders/fullScreenTri.frag';
import fullScreenTriVert from '../../shaders/fullScreenTri.vert';
import testShaderFrag from '../../shaders/testShader.frag';
import testShaderVert from '../../shaders/testShader.vert';
import OrbitControls from 'three-orbitcontrols';
import TweenMax from 'TweenMax';

function remap(t, old_min, old_max, new_min, new_max) {
  let old_range = old_max - old_min;
  let normalizedT = t - old_min;
  let normalizedVal = normalizedT / old_range;
  let new_range = new_max - new_min;
  let newVal = normalizedVal * new_range + new_min;
  return newVal;
}

export default class WebGLView {
  constructor(app) {
    this.app = app;
    this.PARAMS = {
      rotSpeed: 0.001
    };

    this.init();
  }

  async init() {
    this.initThree();
    this.initBgScene();
    this.initLights();
    // this.initTweakPane();
    await this.loadMesh();
    this.setupMaterial();
    this.createMultipleSpheres();
    this.initRenderTri();
    this.setupMouseListener();
  }

  setupMouseListener() {
    this.mouse = new THREE.Vector2();
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    document.addEventListener('mousemove', ({ clientX, clientY }) => {
      this.mouse.x = (clientX / this.width) * 2 - 1;
      this.mouse.y = -(clientY / this.height) * 2 + 1;
    });
  }

  initTweakPane() {
    this.pane = new Tweakpane();

    this.pane
      .addInput(this.PARAMS, 'rotSpeed', {
        min: 0.0,
        max: 0.5
      })
      .on('change', value => {});
  }

  createMultipleSpheres() {
    this.spheres = [];
    this.numSpheres = 5;
    let scaleStep = 1.0;

    for (let i = 0; i < this.numSpheres; i++) {
      let clone = this.testMesh.clone();

      this.bgScene.add(clone);

      clone.scale.set(i * scaleStep, i * scaleStep, i * scaleStep);

      this.spheres.push(clone);
    }

    console.log(this.spheres);
  }

  initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.autoClear = true;

    this.clock = new THREE.Clock();
  }

  loadMesh() {
    return new Promise((res, rej) => {
      let loader = new GLTFLoader();

      loader.load('./sphere-layers.glb', object => {
        object;
        this.testMesh = object.scene.children[0];
        console.log(this.testMesh);
        this.testMesh.scale.set(15, 15, 15);
        this.bgScene.add(this.testMesh);

        res();
      });
    });
  }

  setupMaterial() {
    let material = new THREE.ShaderMaterial({
      fragmentShader: glslify(testShaderFrag),
      vertexShader: glslify(testShaderVert),
      uniforms: {
        u_time: {
          value: 0.0
        },
        u_texture: {
          value: new THREE.TextureLoader().load('./all-color.png', texture => {
            texture.flipY = false;
            texture.needsUpdate = true;
          })
        },
        uMouse: {
          value: 0.0
        }
      }
    });

    this.testMesh.material = this.testMeshMaterial = material;

    this.testMesh.material.needsUpdate = true;
  }

  returnRenderTriGeometry() {
    const geometry = new THREE.BufferGeometry();

    // triangle in clip space coords
    const vertices = new Float32Array([-1.0, -1.0, 3.0, -1.0, -1.0, 3.0]);

    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 2));

    return geometry;
  }

  initRenderTri() {
    // mostly taken from here: https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7

    this.resize();
    const geometry = this.returnRenderTriGeometry();

    const resolution = new THREE.Vector2();
    this.renderer.getDrawingBufferSize(resolution);

    this.RenderTriTarget = new THREE.WebGLRenderTarget(
      resolution.x,
      resolution.y,
      {
        format: THREE.RGBFormat,
        stencilBuffer: false,
        depthBuffer: true
      }
    );

    this.triMaterial = new THREE.RawShaderMaterial({
      fragmentShader: glslify(fullScreenTriFrag),
      vertexShader: glslify(fullScreenTriVert),
      uniforms: {
        uScene: {
          type: 't',
          value: this.bgRenderTarget.texture
        },
        uResolution: { value: resolution },
        uTime: {
          value: 0.0
        }
      }
    });

    console.log(this.bgRenderTarget.texture);

    let renderTri = new THREE.Mesh(geometry, this.triMaterial);
    renderTri.frustumCulled = false;
    this.scene.add(renderTri);
  }

  initBgScene() {
    this.bgRenderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );
    this.bgCamera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    // this.controls = new OrbitControls(this.bgCamera, this.renderer.domElement);

    this.bgCamera.position.z = 6;
    // this.controls.update();

    this.bgScene = new THREE.Scene();
  }

  initLights() {
    // this.pointLight = new THREE.PointLight(0xff0000, 1, 100);
    // this.pointLight.position.set(0, 0, 50);
    // this.bgScene.add(this.pointLight);
  }

  resize() {
    if (!this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.fovHeight =
      2 *
      Math.tan((this.camera.fov * Math.PI) / 180 / 2) *
      this.camera.position.z;
    this.fovWidth = this.fovHeight * this.camera.aspect;

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    if (this.trackball) this.trackball.handleResize();
  }

  updateTestMesh() {
    this.testMesh.rotation.y += this.PARAMS.rotSpeed;
  }

  updateSpheres() {
    for (let i = 0; i < this.numSpheres; i++) {
      this.spheres[i].rotation.y += i % 2 ? 0.001 : -0.001;
    }
  }

  update() {
    const delta = this.clock.getDelta();
    const time = performance.now() * 0.0005;

    // this.controls.update();

    if (this.triMaterial) {
      this.triMaterial.uniforms.uTime.value = time;
    }

    if (this.testMeshMaterial) {
      this.testMeshMaterial.uniforms.u_time.value = time;
      this.testMeshMaterial.uniforms.uMouse.value = this.mouse;
    }

    if (this.testMesh) {
      this.updateTestMesh();
    }

    if (this.spheres !== 0) {
      this.updateSpheres();
    }

    if (this.trackball) this.trackball.update();
  }

  draw() {
    this.renderer.setRenderTarget(this.bgRenderTarget);
    this.renderer.render(this.bgScene, this.bgCamera);
    this.renderer.setRenderTarget(null);

    this.renderer.render(this.scene, this.camera);
  }
}
