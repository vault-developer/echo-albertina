import 'modern-normalize/modern-normalize.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import vertexShader from './vertexShader.vert?raw';
import fragmentShader from './fragmentShader.frag?raw';
import {AudioOutput} from "../audioOutput/AudioOutput.ts";
import {AudioInput} from "../audioInput/AudioInput.ts";
import {calculateRMS} from "./utils.ts";
import {RenderSceneParams, SceneStateConfig} from "./types.ts";
import {ACTIVE_CONFIG, LERP_FACTOR, MOUSE_INFLUENCE_X, MOUSE_INFLUENCE_Y, SLEEPING_CONFIG} from "./config.ts";

export class Render {
  private playing = false;
  private loadingContainer: HTMLElement | null = null;
  private targetState: SceneStateConfig = SLEEPING_CONFIG;

  // THREE.js objects
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private bloomComposer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;
  private uniforms!: { [uniform: string]: THREE.IUniform };
  private clock = new THREE.Clock();

  // Input and audio
  private mouseX = 0;
  private mouseY = 0;
  private audioInput?: AudioInput;
  private audioOutput?: AudioOutput;

  // Callbacks
  private onCallStart?: () => void;
  private onCallEnd?: () => void;

  constructor() {
    this.createLoadingScreen();
  }

  public start({ onCallStart, onCallEnd, audioInput, audioOutput }: RenderSceneParams) {
    this.onCallStart = onCallStart;
    this.onCallEnd = onCallEnd;
    this.audioInput = audioInput;
    this.audioOutput = audioOutput;

    this.initScene();
    this.initPostProcessing();
    this.initObjects();
    this.initEventListeners();

    this.animate();
  }

  private createLoadingScreen() {
    this.loadingContainer = document.createElement('div');
    document.body.appendChild(this.loadingContainer);

    this.loadingContainer.innerHTML = 'please use a desktop device only <br/> loading models, it may take some time...<br/><br/>';
    this.loadingContainer.id = 'root';
    Object.assign(this.loadingContainer.style, {
      color: 'white',
      backgroundColor: 'black',
      display: 'flex',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '10%',
      height: '100vh',
      fontFamily: 'sans-serif',
    });
  }

  private initScene() {
    if (this.loadingContainer) {
      document.body.removeChild(this.loadingContainer);
      this.loadingContainer = null;
    }

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      105,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, -2, 16);
    this.camera.lookAt(0, 0, 0);
  }

  private initPostProcessing() {
    const renderScene = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(50, 50), SLEEPING_CONFIG.bloom, 1, 0.3);

    this.bloomComposer = new EffectComposer(this.renderer);
    this.bloomComposer.addPass(renderScene);
    this.bloomComposer.addPass(this.bloomPass);
    const outputPass = new OutputPass();
    this.bloomComposer.addPass(outputPass);
  }

  private initObjects() {
    this.uniforms = {
      u_time: {value: 0.0},
      u_frequency: {value: SLEEPING_CONFIG.frequency},
      u_red: {value: SLEEPING_CONFIG.red},
      u_green: {value: SLEEPING_CONFIG.green},
      u_blue: {value: SLEEPING_CONFIG.blue}
    }

    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader
    });

    const geo = new THREE.IcosahedronGeometry(4, 8 );
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
    mesh.material.wireframe = true;
  }



  private animate = () => {
    this.camera.position.x += (this.mouseX - this.camera.position.x) * MOUSE_INFLUENCE_X;
    this.camera.position.y += (-this.mouseY - this.camera.position.y) * MOUSE_INFLUENCE_Y;
    this.camera.lookAt(this.scene.position);
    this.uniforms.u_time.value = this.clock.getElapsedTime();

    // Animate properties towards targetState
    this.bloomPass.strength += (this.targetState.bloom - this.bloomPass.strength) * LERP_FACTOR;
    this.uniforms.u_red.value += (this.targetState.red - this.uniforms.u_red.value) * LERP_FACTOR;
    this.uniforms.u_green.value += (this.targetState.green - this.uniforms.u_green.value) * LERP_FACTOR;
    this.uniforms.u_blue.value += (this.targetState.blue - this.uniforms.u_blue.value) * LERP_FACTOR;
    this.camera.position.z += (this.targetState.cameraZ - this.camera.position.z) * LERP_FACTOR;

    this.updateFrequencyFromAudio();

    this.bloomComposer.render();
    requestAnimationFrame(this.animate);
  }

  private updateFrequencyFromAudio() {
    if (this.playing && this.audioOutput?.analyzer && this.audioInput?.analyzer) {
      const inputDataArray = new Uint8Array(this.audioInput.analyzer.frequencyBinCount);
      this.audioInput.analyzer.getByteTimeDomainData(inputDataArray);
      const rms = calculateRMS(inputDataArray);
      const targetInputScale = Math.floor(60 * rms * 10);

      const outputDataArray = new Uint8Array(this.audioOutput.analyzer.frequencyBinCount);
      this.audioOutput.analyzer.getByteTimeDomainData(outputDataArray);
      const outputRMS = calculateRMS(outputDataArray);
      const targetOutputScale = Math.floor(60 * outputRMS * 10);

      this.uniforms.u_frequency.value = targetInputScale + targetOutputScale + ACTIVE_CONFIG.frequency;
    } else {
      this.uniforms.u_frequency.value += (this.targetState.frequency - this.uniforms.u_frequency.value) * LERP_FACTOR;
    }
  }

  private initEventListeners() {
    document.addEventListener('mousemove', (e: MouseEvent) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      this.mouseX = (e.clientX - windowHalfX) / 100;
      this.mouseY = (e.clientY - windowHalfY) / 100;
    });
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.bloomComposer.setSize(window.innerWidth, window.innerHeight);
    });
    window.addEventListener('click', () => {
      this.playing = !this.playing;
      if (this.playing) {
        this.onCallStart?.();
        this.targetState = ACTIVE_CONFIG;
      } else {
        this.onCallEnd?.();
        this.targetState = SLEEPING_CONFIG;
      }
    });
  }
}
