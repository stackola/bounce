class Vector {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;

		//console.log("created particle", this);
	}

	add(v: Vector): Vector {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	mult(n: number): Vector {
		this.x = this.x * n;
		this.y = this.y * n;
		return this;
	}

	static random(): Vector {
		return new Vector(Math.floor(Math.random() * 100), Math.floor(Math.random() * 100))
	}


}
class Particle {
	position: Vector;
	velocity: Vector = Vector.random().add(new Vector(-50,-50)).mult(0.03);
	radius: number;
	maxRadius: number = 3;
	minRadius: number = 1;
	shrinkingFactor: number = 0.99;
	age: number = 0;
	maxAge: number = 100;
	constructor() {
		this.position = new Vector(config.mousePosition.x, config.mousePosition.y);
		this.radius = Math.floor(Math.random() * this.maxRadius) + this.minRadius;
	}

	draw(ctx: CanvasRenderingContext2D): void {
		if (this.age < this.maxAge) {


			ctx.fillStyle = "#ff0000";
			ctx.beginPath();
			ctx.arc(this.position.x, this.position.y, this.radius * 2, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();
			console.log("drw part");
		}
	}

	tick(): void {
		this.age++;
		// change velocity
		// 1. Gravity:
		this.velocity.add(config.gravity);
		// apply movement
		this.position.add(this.velocity);

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
		for (var i = 0; i < this.particles.length; ++i) {
			this.particles[i].tick();
		}
	}
}

class Game {
	canvas: HTMLCanvasElement;
	context: CanvasRenderingContext2D;
	particleSystem: ParticleSystem;
	constructor() {
		this.canvas = < HTMLCanvasElement > document.getElementById('c');
		this.canvas.width = config.width;
		this.canvas.height = config.height;
		this.context = this.canvas.getContext('2d');

		this.canvas.addEventListener('mousemove', function(evt) {
			config.mousePosition = this.getMousePos(this.canvas, evt);			

		}.bind(this), false);


		this.particleSystem = new ParticleSystem();
	}

	getMousePos(canvas, evt): Vector {
		var rect = canvas.getBoundingClientRect();
		return new Vector(evt.clientX - rect.left, evt.clientY - rect.top);

	}

	draw() {
		this.context.clearRect(0, 0, config.width, config.height);
		this.particleSystem.draw(this.context);
	}

	tick(): void {
		this.particleSystem.tick();
	}
}

var config: {
	gravity: Vector,
	width: number,
	height: number,
	bounceFriction: number,
	mousePosition: Vector
} = {
	gravity: new Vector(0, 0.1),
	width: 500,
	height: 500,
	bounceFriction: 0.9,
	mousePosition: new Vector(100, 100)
};



var g = new Game();



function loop() {
	requestAnimationFrame(loop);
	g.tick();
	g.draw();
}

loop();

setInterval(g.particleSystem._addParticle, 100);