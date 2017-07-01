// Bouncy Balls
// Inspired by https://codepen.io/waisbren89/pen/gwvVpP
// License: WTFPL

/////////////////////////////////////////////////////////////////////
////////////////////////////// Vector ///////////////////////////////
/////////////////////////////////////////////////////////////////////

class Vector {

	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	// Adds a Vector to the current Vector.
	add(v: Vector): Vector {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	// Multiply both axis by a factor.
	scale(n: number): Vector {
		this.x = this.x * n;
		this.y = this.y * n;
		return this;
	}

	// Normalize to lenth 1.
	normalize(): Vector {
		var l = Math.sqrt(this.x * this.x + this.y * this.y);
		this.x = this.x / l;
		this.y = this.y / l;
		return this;
	}

	// Create a random Vector of length 1
	static random(): Vector {
		return new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
	}
}

/////////////////////////////////////////////////////////////////////
///////////////////////////// Particle //////////////////////////////
/////////////////////////////////////////////////////////////////////

class Particle {

	particleSystem: ParticleSystem;
	position: Vector;
	velocity: Vector = Vector.random().scale(Math.random() * 7 + 1); // New random velocity Vector with length 1-6
	radius: number;
	age: number = 0; // How many ticks have we been tracking this Particle?
	isBouncing: boolean = false; // Bounce-debounce to prevent double-bounce.
	//color information
	light: number = Math.floor(Math.random() * 50) + 50;
	hue: number = Math.floor(Math.random() * 20) + 20;
	opacity: number = 0.8;

	constructor(ps: ParticleSystem) {
		this.particleSystem = ps;
		this.position = new Vector(state.mousePosition.x, state.mousePosition.y); // Instantiate Particle at mouse position
		this.radius = Math.floor(Math.random() * state.config.maxRadius) + state.config.minRadius; // Set random radius between minRadius and minRadius + maxRadius (I guess)
	}

	draw(ctx: CanvasRenderingContext2D): void {
		ctx.globalCompositeOperation = 'lighter';
		ctx.beginPath();
		ctx.fillStyle = "hsla(" + this.hue + ",100%, " + this.light + "%, " + this.opacity + ")";
		ctx.arc(this.position.x, this.position.y, this.radius * 2, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.fill();
	}

	tick(): void {
		// Remove particle after X amount of ticks
		this.age++;
		if (++this.age > state.config.maxAge) {
			this.particleSystem.removeParticle(this);
		}

		// Fade out
		this.opacity = this.opacity * state.config.shrinkingFactor;
		this.radius = this.radius * state.config.shrinkingFactor;

		// Add gravitational acceleration to particle velocity.
		this.velocity.add(state.config.gravity);

		// Add velocity to particle location.
		this.position.add(this.velocity);

		// Check for bounce
		if (this.position.y + this.radius >= state.config.height - state.config.floorHeight && this.isBouncing == false) {
			// Bouncing. Skipping bounce-check for next frame.
			this.velocity.y = this.velocity.y * -1 * state.config.bounceFriction + ( Math.random() * 0.1 ) ;
			this.isBouncing = true;
		} else {
			this.isBouncing = false;
		}

		// If we are below the floor, go to the floor.
		if (this.position.y + this.radius > state.config.height - state.config.floorHeight) {
			this.position.y = state.config.height - state.config.floorHeight - this.radius;
		}
	}
}

/////////////////////////////////////////////////////////////////////
////////////////////////// Particle System //////////////////////////
/////////////////////////////////////////////////////////////////////

class ParticleSystem {

	particles: Array < Particle > = [];

	constructor() {

	}

	draw(ctx: CanvasRenderingContext2D): void {
		for (var i = 0; i < this.particles.length; ++i) {
			this.particles[i].draw(ctx);
		}
	}

	spawnParticle(): void {
		this.particles.push(new Particle(this));
	}

	// Removes a particle
	removeParticle(p: Particle): void {
		var pos = this.particles.indexOf(p);
		this.particles.splice(pos, 1);
	}

	tick(): void {

		// Add 2 new particles at mouse location
		this.spawnParticle();
		this.spawnParticle();

		// Call tick on all particles left
		// Iterate backwards because we are removing elements from the array (also it's faster)
		for (var i = this.particles.length; i--;) {
			this.particles[i].tick();
		}
	}
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////// Game ////////////////////////////////
/////////////////////////////////////////////////////////////////////

class Game {

	// Main canvas
	canvas: HTMLCanvasElement;
	context: CanvasRenderingContext2D;
	// Shadow canvas
	shadowCanvas: HTMLCanvasElement;
	shadowContext: CanvasRenderingContext2D;
	particleSystem: ParticleSystem;

	constructor() {
		this.canvas = < HTMLCanvasElement > document.getElementById('canvas');
		this.shadowCanvas = < HTMLCanvasElement > document.getElementById('shadowCanvas');

		this.context = this.canvas.getContext('2d');
		this.shadowContext = this.shadowCanvas.getContext('2d');

		// Init the browser size.
		this.resize();

		// Bind events
		window.onresize = this.resize.bind(this);

		this.canvas.addEventListener('mousemove', function(evt) {
			this.setMousePosition(this.canvas, evt);
		}.bind(this), false);


		// Initialize the particle system
		this.particleSystem = new ParticleSystem();
	}

	resize(): void {
		state.config.width = this.canvas.clientWidth;
		state.config.height = this.canvas.clientHeight;

		// Set width and height of both canvas
		this.canvas.width = state.config.width;
		this.canvas.height = state.config.height;
		this.shadowCanvas.width = state.config.width;
		this.shadowCanvas.height = state.config.height;
		state.config.floorHeight = state.config.height / 5;

		// Flip and blur the reflection canvas.
		this.shadowContext.setTransform(1, 0, 0, 1, 0, 0);
		this.shadowContext.scale(1, -1);
		this.shadowContext.translate(0, -5 - (state.config.height + (state.config.height - 2 * state.config.floorHeight)));
		this.shadowContext['filter'] = "blur(8px)";
	}

	setMousePosition(canvas, evt): void {
		// Retrieve and set local mouse position
		var rect = canvas.getBoundingClientRect();
		var v = new Vector(evt.clientX - rect.left, evt.clientY - rect.top);
		if (v.y > state.config.height - state.config.floorHeight) {
			v.y = state.config.height - state.config.floorHeight;
		}
		state.mousePosition = v;
	}

	draw() {
		// Clear canvases
		this.context.clearRect(0, 0, state.config.width, state.config.height);
		this.shadowContext.clearRect(0, 0, state.config.width, state.config.height);

		// Draw canvases
		this.particleSystem.draw(this.context);
		this.shadowContext.drawImage(this.canvas, 0, 0);

		// Draw FPS counter
		this.context.fillStyle = "#ffffff";
		this.context.font = "12px Arial";
		this.context.fillText(state.fps + " fps", 20, 20);

	}

	tick(): void {
		this.particleSystem.tick();
		this.countFps();
	}

	countFps(): void {
		var delta = (Date.now() - state.lastCalled) / 1000;
		state.lastCalled = Date.now();
		state.fps = 1 / delta;
		state.fps = Math.round(state.fps);
	}
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
////////////////////// Done defining classes ////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////


// Initial game state
var state: {
	config: {
		gravity: Vector,
		width: number,
		height: number,
		bounceFriction: number,
		floorHeight: number,
		maxRadius: number,
		minRadius: number,
		shrinkingFactor: number,
		maxAge: number
	},
	mousePosition: Vector,
	lastCalled: number,
	fps: number
} = {
	config: {
		gravity: new Vector(0, 0.4),
		width: 500,
		height: 500,
		bounceFriction: 0.8,
		floorHeight: 200,
		maxRadius: 6,
		minRadius: 2,
		shrinkingFactor: 0.99,
		maxAge: 300
	},
	mousePosition: new Vector(100, 100),
	lastCalled: Date.now(),
	fps: 0
};

var g: Game;



//Game loop
function loop() {
	requestAnimationFrame(loop);
	g.tick();
	g.draw();
}

//start loop.
document.addEventListener("DOMContentLoaded", function(event) {
	g = new Game();
	loop();
});