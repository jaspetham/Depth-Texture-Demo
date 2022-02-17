import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import vertex from './shaders/vertex.glsl'
import fragment from './shaders/fragment.glsl'
import gsap from 'gsap'
import * as dat from 'dat.gui'

// import model from './assets/models/face.glb'
import model from './assets/models/facefull.glb'

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0xeeeeee, 1); 
    // this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      100
    );
    this.camera1 = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      2,
      3.3
    );

    // var frustumSize = 1;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, -0.5, 1);
    this.camera1.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // this.controls.enabled = false
    this.time = 0;

    this.isPlaying = true;
    
    this.loader = new GLTFLoader()
    this.loader.load(model,(gltf) => {
      this.model = gltf.scene.children[0]
      this.model.position.set(0,-1,-1.5)
      let s = 2000
      this.model.scale.set(s,s,s)
      this.scene.add(this.model)

      this.model.traverse(child=>{
        if(child.isMesh){
          child.material = new THREE.MeshBasicMaterial({color:0x000000})
        }
      })
    })
    
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    // this.settings();
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 5, 0.01);
    this.gui.add(this.mesh.rotation,'x',-5,5,0.0001)
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    // image cover
    this.imageAspect = 1;
    let a1; let a2;
    if(this.height/this.width>this.imageAspect) {
      a1 = (this.width/this.height) * this.imageAspect ;
      a2 = 1;
    } else{
      a1 = 1;
      a2 = (this.height/this.width) / this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;
  }

  addObjects() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        resolution: { type: "v4", value: new THREE.Vector4() },
        depthInfo: {value:null},
        progress: {value:0},
        cameraNear: { value: this.camera1.near },
        cameraFar: { value: this.camera1.far },
        resolution:{value: new THREE.Vector4()}
      },
      vertexShader: vertex,
      fragmentShader: fragment
    });

    this.geometry = new THREE.PlaneGeometry(2, 2, 100, 100);
    this.mesh = new THREE.Mesh(this.geometry,this.material)
    


    let number = 100
    for (let i = 0; i <= number; i++) {
      this.geometry = new THREE.PlaneBufferGeometry(2,0.005,300,1)

      let y = []
      let len = this.geometry.attributes.position.array.length

      for (let j = 0; j < len/3; j++) {
        y.push(i/100)
      }

      this.geometry.setAttribute('y',new THREE.BufferAttribute(new Float32Array(y),1))
      this.plane = new THREE.Mesh(this.geometry,this.material)
      this.plane.position.y = (i-50)/50
      // let mesh = new THREE.Mesh(this.geometry1,this.material)
      // mesh.position.y = (i - number/2)/number
      this.scene.add(this.plane)
    }

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);

    this.target = new THREE.WebGLRenderTarget( this.width, this.height );
    this.target.texture.minFilter = THREE.NearestFilter;
    this.target.texture.magFilter = THREE.NearestFilter;
    this.target.texture.generateMipmaps = false;
    this.target.stencilBuffer = false;
    this.target.depthBuffer = true;
    this.target.depthTexture = new THREE.DepthTexture();
    this.target.depthTexture.format = THREE.DepthFormat;
    this.target.depthTexture.type = THREE.UnsignedShortType;
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    // this.time += 0.05;
    this.time++;
     if(this.model) {
      this.model.position.z = -1.5 + 0.05*Math.sin(this.time/50);
      this.model.rotation.y = -0.1 + 0.25*Math.sin(this.time/50);
    }
    
    this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    // render scene into target
    this.renderer.setRenderTarget( this.target );
    this.renderer.render( this.scene, this.camera1 );

    this.material.uniforms.depthInfo.value = this.target.depthTexture
    this.material.uniforms.progress.value = this.settings.progress

    this.renderer.setRenderTarget(null)
    this.renderer.render(this.scene, this.camera);

  }
}

new Sketch({
  dom: document.getElementById("container")
});

