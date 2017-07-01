// Standard Vector class. X,Y with some methods.
var lastCalledTime;
var fps;
var Vector = (function () {
    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }
    // Adds a Vector to the current vector.
    Vector.prototype.add = function (v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    };
    // Multiply by scalar.
    Vector.prototype.mult = function (n) {
        this.x = this.x * n;
        this.y = this.y * n;
        return this;
    };
    // Normalize to lenth 1.
    Vector.prototype.normalize = function () {
        var l = Math.sqrt(this.x * this.x + this.y * this.y);
        this.x = this.x / l;
        this.y = this.y / l;
        return this;
    };
    // Create a random Vector for X,Y between 0 and 100.
    Vector.random = function () {
        return new Vector(Math.floor(Math.random() * 100), Math.floor(Math.random() * 100));
    };
    return Vector;
}());
var Particle = (function () {
    function Particle() {
        this.velocity = Vector.random().add(new Vector(-50, -50)).normalize().mult(Math.random() * 3 + 1); // New random force Vector with length 1-4
        this.maxRadius = 4;
        this.minRadius = 2;
        this.shrinkingFactor = 0.99; // How much to shrink by, every frame. (newRadius = Radius * shrinkingFactor )
        this.age = 0; // How many ticks have we been tracking this Particle?
        this.maxAge = 300; // After how many ticks do we no longer draw the Particle?
        this.isBouncing = false; // Bounce-debounce to prevent double-bounce.
        this.light = Math.floor(Math.random() * 50) + 50; // Color stuff
        this.hue = Math.floor(Math.random() * 20) + 20; // Color stuff
        this.opacity = 0.8; // Color stuff
        this.position = new Vector(config.mousePosition.x, config.mousePosition.y); // Instantiate Particle at mouse position
        this.radius = Math.floor(Math.random() * this.maxRadius) + this.minRadius; // Set random radius between minRadius and minRadius + maxRadius (I guess)
    }
    Particle.prototype.draw = function (ctx) {
        if (this.position.y > config.height - config.floorHeight) {
            this.position.y = config.height - config.floorHeight;
        }
        // Draw
        ctx.fillStyle = "hsla(" + this.hue + ",100%, " + this.light + "%, " + this.opacity + ")";
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius * 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    };
    Particle.prototype.tick = function () {
        this.opacity = this.opacity * this.shrinkingFactor;
        //this.light -= 0.5;
        //if (this.light < 0){
        //	this.light == 0;
        //}
        this.age++;
        // Check for bounce
        if (this.position.y >= config.height - config.floorHeight && this.isBouncing == false) {
            this.velocity.y = this.velocity.y * -1 * config.bounceFriction * this.radius / this.maxRadius; // Bouncing. Skipping bounce-check for next frame.
            this.isBouncing = true;
        }
        else {
            this.isBouncing = false;
        }
        // Add gravitational acceleration to particle velocity.
        this.velocity.add(config.gravity);
        // Add velocity to particle location.
        this.position.add(this.velocity);
        /// Shrink radius.
        this.radius = this.radius * this.shrinkingFactor;
    };
    return Particle;
}());
var ParticleSystem = (function () {
    function ParticleSystem() {
        this.particles = [];
        this._addParticle = function () {
            this.addParticle();
        }.bind(this);
        this.addParticle();
    }
    ParticleSystem.prototype.draw = function (ctx) {
        for (var i = 0; i < this.particles.length; ++i) {
            this.particles[i].draw(ctx);
        }
    };
    ParticleSystem.prototype.addParticle = function () {
        this.particles.push(new Particle());
    };
    ParticleSystem.prototype.tick = function () {
        this._addParticle();
        this._addParticle();
        this._addParticle();
        // Filter old particles from array
        this.particles = this.particles.filter(function (v) {
            return v.age < v.maxAge;
        });
        // Call tick on all particles left
        for (var i = 0; i < this.particles.length; ++i) {
            this.particles[i].tick();
        }
    };
    return ParticleSystem;
}());
// Game Class
var Game = (function () {
    function Game() {
        this.canvas = document.getElementById('c');
        this.canvas2 = document.getElementById('c2');
        this.context = this.canvas.getContext('2d');
        this.context2 = this.canvas2.getContext('2d');
        this.context.globalCompositeOperation = 'lighter';
        //this.context2.globalCompositeOperation = 'lighter';
        this.particleSystem = new ParticleSystem();
        // Init to browser size.
        this.resize();
        // Bind events
        window.onresize = this.resize.bind(this);
        this.canvas.addEventListener('mousemove', function (evt) {
            config.mousePosition = this.getMousePos(this.canvas, evt);
        }.bind(this), false);
    }
    Game.prototype.resize = function () {
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
    };
    Game.prototype.getMousePos = function (canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        var v = new Vector(evt.clientX - rect.left, evt.clientY - rect.top);
        if (v.y > config.height - config.floorHeight) {
            v.y = config.height - config.floorHeight;
        }
        return v;
    };
    Game.prototype.draw = function () {
        // Clear canvases
        this.context.clearRect(0, 0, config.width, config.height);
        this.context2.clearRect(0, 0, config.width, config.height);
        // Draw canvases
        this.particleSystem.draw(this.context);
        this.context2.drawImage(this.canvas, 0, 0);
        // Hacky FPS counter
        this.context.fillStyle = "#ffffff";
        this.context.font = "12px Arial";
        this.context.fillText(fps.toFixed(0) + " fps", 20, 20);
    };
    Game.prototype.tick = function () {
        this.particleSystem.tick();
    };
    return Game;
}());
// Configure global values
var config = {
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
    countFps();
    // Buffered frames.
    requestAnimationFrame(loop);
    g.tick();
    g.draw();
}
//start loop.
loop();
function countFps() {
    if (!lastCalledTime) {
        lastCalledTime = Date.now();
        fps = 0;
    }
    var delta = (Date.now() - lastCalledTime) / 1000;
    lastCalledTime = Date.now();
    fps = 1 / delta;
}
