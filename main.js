// Bouncy Balls
// Inspired by https://codepen.io/waisbren89/pen/gwvVpP
// License: WTFPL
/////////////////////////////////////////////////////////////////////
////////////////////////////// Vector ///////////////////////////////
/////////////////////////////////////////////////////////////////////
var Vector = (function () {
    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }
    // Adds a Vector to the current Vector.
    Vector.prototype.add = function (v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    };
    // Multiply both axis by a factor.
    Vector.prototype.scale = function (n) {
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
    // Create a random Vector of length 1
    Vector.random = function () {
        return new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    };
    return Vector;
}());
/////////////////////////////////////////////////////////////////////
///////////////////////////// Particle //////////////////////////////
/////////////////////////////////////////////////////////////////////
var Particle = (function () {
    function Particle(ps) {
        this.velocity = Vector.random().scale(Math.random() * 7 + 1); // New random velocity Vector with length 1-6
        this.age = 0; // How many ticks have we been tracking this Particle?
        this.isBouncing = false; // Bounce-debounce to prevent double-bounce.
        //color information
        this.light = Math.floor(Math.random() * 50) + 50;
        this.hue = Math.floor(Math.random() * 20) + 20;
        this.opacity = 0.8;
        this.particleSystem = ps;
        this.position = new Vector(state.mousePosition.x, state.mousePosition.y); // Instantiate Particle at mouse position
        this.radius = Math.floor(Math.random() * state.config.maxRadius) + state.config.minRadius; // Set random radius between minRadius and minRadius + maxRadius (I guess)
    }
    Particle.prototype.draw = function (ctx) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.fillStyle = "hsla(" + this.hue + ",100%, " + this.light + "%, " + this.opacity + ")";
        ctx.arc(this.position.x, this.position.y, this.radius * 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    };
    Particle.prototype.tick = function () {
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
            this.velocity.y = this.velocity.y * -1 * state.config.bounceFriction + (Math.random() * 0.1);
            this.isBouncing = true;
        }
        else {
            this.isBouncing = false;
        }
        // If we are below the floor, go to the floor.
        if (this.position.y + this.radius > state.config.height - state.config.floorHeight) {
            this.position.y = state.config.height - state.config.floorHeight - this.radius;
        }
    };
    return Particle;
}());
/////////////////////////////////////////////////////////////////////
////////////////////////// Particle System //////////////////////////
/////////////////////////////////////////////////////////////////////
var ParticleSystem = (function () {
    function ParticleSystem() {
        this.particles = [];
    }
    ParticleSystem.prototype.draw = function (ctx) {
        for (var i = 0; i < this.particles.length; ++i) {
            this.particles[i].draw(ctx);
        }
    };
    ParticleSystem.prototype.spawnParticle = function () {
        this.particles.push(new Particle(this));
    };
    // Removes a particle
    ParticleSystem.prototype.removeParticle = function (p) {
        var pos = this.particles.indexOf(p);
        this.particles.splice(pos, 1);
    };
    ParticleSystem.prototype.tick = function () {
        // Add 2 new particles at mouse location
        this.spawnParticle();
        this.spawnParticle();
        // Call tick on all particles left
        // Iterate backwards because we are removing elements from the array (also it's faster)
        for (var i = this.particles.length; i--;) {
            this.particles[i].tick();
        }
    };
    return ParticleSystem;
}());
/////////////////////////////////////////////////////////////////////
/////////////////////////////// Game ////////////////////////////////
/////////////////////////////////////////////////////////////////////
var Game = (function () {
    function Game() {
        this.canvas = document.getElementById('canvas');
        this.shadowCanvas = document.getElementById('shadowCanvas');
        this.context = this.canvas.getContext('2d');
        this.shadowContext = this.shadowCanvas.getContext('2d');
        // Init the browser size.
        this.resize();
        // Bind events
        window.onresize = this.resize.bind(this);
        this.canvas.addEventListener('mousemove', function (evt) {
            this.setMousePosition(this.canvas, evt);
        }.bind(this), false);
        this.canvas.addEventListener('touchmove', function (evt) {
            this.setMousePositionFromTouch(this.canvas, evt);
        }.bind(this), false);
        // Initialize the particle system
        this.particleSystem = new ParticleSystem();
    }
    Game.prototype.resize = function () {
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
    };
    Game.prototype.setMousePosition = function (canvas, evt) {
        // Retrieve and set local mouse position
        var rect = canvas.getBoundingClientRect();
        var v = new Vector(evt.clientX - rect.left, evt.clientY - rect.top);
        if (v.y > state.config.height - state.config.floorHeight) {
            v.y = state.config.height - state.config.floorHeight;
        }
        state.mousePosition = v;
    };
    Game.prototype.setMousePositionFromTouch = function (canvas, evt) {
        // Retrieve and set local mouse position
        var rect = canvas.getBoundingClientRect();
        var v = new Vector(evt.targetTouches[0].clientX - rect.left, evt.targetTouches[0].clientY - rect.top);
        if (v.y > state.config.height - state.config.floorHeight) {
            v.y = state.config.height - state.config.floorHeight;
        }
        state.mousePosition = v;
    };
    Game.prototype.draw = function () {
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
    };
    Game.prototype.tick = function () {
        this.particleSystem.tick();
        this.countFps();
    };
    Game.prototype.countFps = function () {
        var delta = (Date.now() - state.lastCalled) / 1000;
        state.lastCalled = Date.now();
        state.fps = 1 / delta;
        state.fps = Math.round(state.fps);
    };
    return Game;
}());
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
////////////////////// Done defining classes ////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
// Initial game state
var state = {
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
var g;
//Game loop
function loop() {
    requestAnimationFrame(loop);
    g.tick();
    g.draw();
}
//start loop.
document.addEventListener("DOMContentLoaded", function (event) {
    g = new Game();
    loop();
});
