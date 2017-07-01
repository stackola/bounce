// Standard Vector class. X,Y with some methods.
class Vector {

	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	// Adds a Vector to the current vector.
	add(v: Vector): Vector {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	// Multiply by scalar.
	mult(n: number): Vector {
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

	// Create a random Vector for X,Y between 0 and 100.
	static random(): Vector {
		return new Vector(Math.floor(Math.random() * 100), Math.floor(Math.random() * 100))
	}

}


class Particle {
	position: Vector;
	velocity: Vector = Vector.random().add(new Vector(-50, -50)).normalize().mult(Math.random() * 3 + 1); // New random force Vector with length 1-4
	radius: number;
	maxRadius: number = 4;
	minRadius: number = 2;
	shrinkingFactor: number = 0.99; // How much to shrink by, every frame. (newRadius = Radius * shrinkingFactor )
	age: number = 0; // How many ticks have we been tracking this Particle?
	maxAge: number = 300; // After how many ticks do we no longer draw the Particle?
	isBouncing: boolean = false; // Bounce-debounce to prevent double-bounce.
	light: number = Math.floor(Math.random() * 50) + 50; // Color stuff
	hue: number = Math.floor(Math.random() * 30) + 20; // Color stuff
	opacity: number = 1; // Color stuff

	constructor() {
		this.position = new Vector(config.mousePosition.x, config.mousePosition.y); // Instantiate Particle at mouse position
		this.radius = Math.floor(Math.random() * this.maxRadius) + this.minRadius; // Set random radius between minRadius and minRadius + maxRadius (I guess)
	}

	draw(ctx: CanvasRenderingContext2D): void {
		if (this.position.y > config.height - config.floorHeight) { // If we are below the floor, go to the floor.
			this.position.y = config.height - config.floorHeight;
		}

		// Draw
		ctx.fillStyle = "hsla(" + this.hue + ",100%, " + this.light + "%, " + this.opacity + ")";
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, this.radius * 2, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.fill();
	}


	tick(): void {
		this.opacity = this.opacity * this.shrinkingFactor;
		this.age++;
		// Check for bounce
		if (this.position.y >= config.height - config.floorHeight && this.isBouncing == false) {
			this.velocity.y = this.velocity.y * -1 * config.bounceFriction * this.radius / this.maxRadius; // Bouncing. Skipping bounce-check for next frame.
			this.isBouncing = true;
		} else {
			this.isBouncing = false;
		}
		// Add gravitational acceleration to particle velocity.
		this.velocity.add(config.gravity);
		// Add velocity to particle location.
		this.position.add(this.velocity);
		/// Shrink radius.
		this.radius = this.radius * this.shrinkingFactor;
	}
}

class ParticleSystem {
	particles: Array < Particle > = [];

	constructor() {
		this.addParticle();
	}

	draw(ctx: CanvasRenderingContext2D): void {
		for (var i = 0; i < this.particles.length; ++i) {
			this.particles[i].draw(ctx);
		}
	}

	addParticle(): void {
		this.particles.push(new Particle());
	}

	_addParticle = function() {
		this.addParticle();
	}.bind(this);

	tick(): void {
		// Filter old particles from array
		this.particles = this.particles.filter(function(v) {
			return v.age < v.maxAge;
		});
		
		// Call tick on all particles left
		for (var i = 0; i < this.particles.length; ++i) {
			this.particles[i].tick();
		}
	}
}
// Game Class
class Game {
	// Main canvas
	canvas: HTMLCanvasElement;
	context: CanvasRenderingContext2D;
	// Shadow canvas
	canvas2: HTMLCanvasElement;
	context2: CanvasRenderingContext2D;
	particleSystem: ParticleSystem;

	constructor() {
		this.canvas = < HTMLCanvasElement > document.getElementById('c');
		this.canvas2 = < HTMLCanvasElement > document.getElementById('c2');

		this.context = this.canvas.getContext('2d');
		this.context2 = this.canvas2.getContext('2d');

		this.context.globalCompositeOperation = 'lighter';
		this.context2.globalCompositeOperation = 'lighter';



		this.particleSystem = new ParticleSystem();

		// Init to browser size.
		this.resize();

		// Bind events
		window.onresize = this.resize.bind(this);
		this.canvas.addEventListener('mousemove', function(evt) {
			config.mousePosition = this.getMousePos(this.canvas, evt);
		}.bind(this), false);
	}

	resize(): void {

		config.width = document.getElementById('c').clientWidth;
		config.height = document.getElementById('c').clientHeight;

		this.canvas.width = config.width;
		this.canvas.height = config.height;
		this.canvas2.width = config.width;
		this.canvas2.height = config.height;
		//Flip, mirror and blur ctx2.
		this.context2.setTransform(1, 0, 0, 1, 0, 0);
		this.context2.scale(1, -1);
		this.context2.translate(0, -5 - (config.height + (config.height - 2 * config.floorHeight)));
		this.context2['filter'] = "blur(4px)";
	}

	getMousePos(canvas, evt): Vector {
		var rect = canvas.getBoundingClientRect();
		var v = new Vector(evt.clientX - rect.left, evt.clientY - rect.top);
		if (v.y > config.height - config.floorHeight) {
			v.y = config.height - config.floorHeight;
		}
		return v;
	}

	draw() {
		// Clear canvases
		this.context.clearRect(0, 0, config.width, config.height);
		this.context2.clearRect(0, 0, config.width, config.height);

		//Draw canvases
		this.particleSystem.draw(this.context);
		this.context2.drawImage(this.canvas, 0, 0);

	}

	tick(): void {
		this.particleSystem.tick();
	}
}

// Configure global values
var config: {
	gravity: Vector,
	width: number,
	height: number,
	bounceFriction: number,
	mousePosition: Vector,
	floorHeight: number
} = {
	gravity: new Vector(0, 0.4),
	width: 500,
	height: 500,
	bounceFriction: 0.6,
	mousePosition: new Vector(100, 100),
	floorHeight: 200
};

// Init game
var g = new Game();


//Game loop
function loop() {
	// Buffered frames.
	requestAnimationFrame(loop);
	g.tick();
	g.draw();
}


//start loop.
loop();

// Async: Add new particle in intervals.
setInterval(g.particleSystem._addParticle, 10);